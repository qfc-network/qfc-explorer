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
    });
  } catch (error) {
    console.error('Contract info error:', error);
    return err('Failed to fetch contract info', 500);
  }
}
