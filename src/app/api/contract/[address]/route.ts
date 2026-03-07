export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api-response';
import { getPool } from '@/db/pool';

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

type Params = {
  params: Promise<{ address: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const { address } = await params;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return err('Invalid address format', 400);
  }

  try {
    // Get code from RPC
    const codeResponse = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    const codeResult = await codeResponse.json();
    const code = codeResult.result || '0x';
    const isContract = code !== '0x' && code.length > 2;

    // Get balance from RPC
    const balanceResponse = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 2,
      }),
    });

    const balanceResult = await balanceResponse.json();
    const balanceWei = BigInt(balanceResult.result || '0x0');
    const balanceEth = Number(balanceWei) / 1e18;

    // Get nonce from RPC
    const nonceResponse = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
        id: 3,
      }),
    });

    const nonceResult = await nonceResponse.json();
    const nonce = parseInt(nonceResult.result || '0x0', 16);

    // Try to get contract creation info from DB
    let creatorTx: string | undefined;
    let createdAtBlock: string | undefined;
    let isVerified = false;
    let sourceCode: string | undefined;
    let abi: unknown[] | undefined;
    let compilerVersion: string | undefined;
    let evmVersion: string | undefined;
    let optimizationRuns: number | undefined;
    let verifiedAt: string | undefined;

    if (isContract) {
      const pool = getPool();
      const contractResult = await pool.query(
        `SELECT creator_tx_hash, created_at_block,
                is_verified, source_code, abi, compiler_version,
                evm_version, optimization_runs, verified_at
         FROM contracts WHERE address = $1 LIMIT 1`,
        [address.toLowerCase()]
      );

      if (contractResult.rows.length > 0) {
        const row = contractResult.rows[0];
        creatorTx = row.creator_tx_hash;
        createdAtBlock = row.created_at_block?.toString();
        isVerified = row.is_verified ?? false;
        if (isVerified) {
          sourceCode = row.source_code;
          abi = row.abi;
          compilerVersion = row.compiler_version;
          evmVersion = row.evm_version;
          optimizationRuns = row.optimization_runs;
          verifiedAt = row.verified_at?.toISOString();
        }
      }
    }

    // Detect proxy contract (EIP-1967)
    let proxyType: string | undefined;
    let implementationAddress: string | undefined;
    if (isContract) {
      // EIP-1967 implementation slot: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
      const EIP1967_IMPL_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      // EIP-1967 beacon slot: bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)
      const EIP1967_BEACON_SLOT = '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50';
      // EIP-1822 (UUPS) slot: keccak256("PROXIABLE")
      const EIP1822_SLOT = '0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7';

      const readSlot = async (slot: string): Promise<string | null> => {
        try {
          const res = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getStorageAt',
              params: [address, slot, 'latest'],
              id: 10,
            }),
          });
          const json = await res.json();
          const val = json.result;
          if (!val || val === '0x' || val === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            return null;
          }
          // Extract address from 32-byte slot (last 20 bytes)
          const addr = '0x' + val.slice(-40);
          if (addr === '0x0000000000000000000000000000000000000000') return null;
          return addr;
        } catch {
          return null;
        }
      };

      const eip1967Impl = await readSlot(EIP1967_IMPL_SLOT);
      if (eip1967Impl) {
        proxyType = 'EIP-1967';
        implementationAddress = eip1967Impl;
      } else {
        const eip1822Impl = await readSlot(EIP1822_SLOT);
        if (eip1822Impl) {
          proxyType = 'EIP-1822 (UUPS)';
          implementationAddress = eip1822Impl;
        } else {
          const beacon = await readSlot(EIP1967_BEACON_SLOT);
          if (beacon) {
            proxyType = 'Beacon Proxy';
            implementationAddress = beacon;
          }
        }
      }
    }

    // Find similar contracts (same code_hash)
    let similarContracts: Array<{ address: string; is_verified: boolean }> = [];
    if (isContract) {
      const pool = getPool();
      const codeHashResult = await pool.query(
        `SELECT code_hash FROM contracts WHERE address = $1 AND code_hash IS NOT NULL LIMIT 1`,
        [address.toLowerCase()]
      );
      if (codeHashResult.rows.length > 0 && codeHashResult.rows[0].code_hash) {
        const similarResult = await pool.query(
          `SELECT address, COALESCE(is_verified, false) AS is_verified
           FROM contracts
           WHERE code_hash = $1 AND address != $2
           ORDER BY created_at_block DESC NULLS LAST
           LIMIT 10`,
          [codeHashResult.rows[0].code_hash, address.toLowerCase()]
        );
        similarContracts = similarResult.rows;
      }
    }

    return ok({
      address,
      code: isContract ? code : '0x',
      balance: balanceEth.toFixed(6),
      nonce: nonce.toString(),
      is_contract: isContract,
      creator_tx: creatorTx,
      created_at_block: createdAtBlock,
      is_verified: isVerified,
      source_code: sourceCode,
      abi,
      compiler_version: compilerVersion,
      evm_version: evmVersion,
      optimization_runs: optimizationRuns,
      verified_at: verifiedAt,
      similar_contracts: similarContracts,
      proxy_type: proxyType,
      implementation_address: implementationAddress,
    });
  } catch (error) {
    console.error('Contract info error:', error);
    return err('Failed to fetch contract info', 500);
  }
}
