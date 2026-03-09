export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api-response';
import { getPool } from '@/db/pool';

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

type VerifyMultiRequest = {
  address: string;
  compiler_version: string;
  evm_version?: string;
  optimization_runs?: number | null;
  constructor_args?: string;
  files: Record<string, string>;
  entry_contract: string;
};

/**
 * Strip the CBOR-encoded metadata hash from the end of Solidity bytecode.
 */
function stripMetadata(bytecode: string): string {
  const hex = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
  if (hex.length < 4) return hex;

  const metadataLength = parseInt(hex.slice(-4), 16);
  const metadataHexLen = metadataLength * 2 + 4;

  if (metadataHexLen >= hex.length) return hex;
  return hex.slice(0, hex.length - metadataHexLen);
}

/**
 * Flatten multi-file sources into a single display string.
 * Each file is separated by a comment header with the file path.
 */
function flattenMultiFileSources(files: Record<string, string>): string {
  const sorted = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));
  return sorted
    .map(([path, content]) => `// File: ${path}\n\n${content.trim()}`)
    .join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyMultiRequest = await request.json();
    const {
      address,
      compiler_version,
      evm_version = 'paris',
      optimization_runs = null,
      constructor_args,
      files,
      entry_contract,
    } = body;

    // Validate address
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return err('Invalid address format', 400);
    }
    if (!compiler_version) {
      return err('Compiler version is required', 400);
    }
    if (!files || Object.keys(files).length === 0) {
      return err('No source files provided', 400);
    }
    if (!entry_contract) {
      return err('Entry contract is required', 400);
    }

    // Validate entry_contract format: "path/File.sol:ContractName"
    const colonIdx = entry_contract.lastIndexOf(':');
    if (colonIdx === -1) {
      return err('entry_contract must be in format "path/File.sol:ContractName"', 400);
    }
    const entryFile = entry_contract.slice(0, colonIdx);
    const entryName = entry_contract.slice(colonIdx + 1);

    if (!files[entryFile]) {
      return err(`Entry file "${entryFile}" not found in provided files`, 400);
    }

    const addrLower = address.toLowerCase();

    // 1. Get deployed bytecode from chain
    const codeResponse = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [addrLower, 'latest'],
        id: 1,
      }),
    });

    const codeResult = await codeResponse.json();
    const deployedCode = codeResult.result || '0x';

    if (deployedCode === '0x' || deployedCode.length <= 2) {
      return err('No contract code found at this address', 400);
    }

    // 2. Build Standard JSON Input and compile
    let solc: { compile: (input: string) => string };
    try {
      const mod = await (Function('return import("solc")')() as Promise<{ default: { compile: (input: string) => string } }>);
      solc = mod.default;
    } catch {
      throw new Error('Solidity compiler (solc) not available on server');
    }

    const sources: Record<string, { content: string }> = {};
    for (const [filename, content] of Object.entries(files)) {
      sources[filename] = { content };
    }

    const standardJsonInput = {
      language: 'Solidity',
      sources,
      settings: {
        evmVersion: evm_version,
        optimizer: optimization_runs != null
          ? { enabled: true, runs: optimization_runs }
          : { enabled: false },
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
          },
        },
      },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(standardJsonInput)));

    // Check for compilation errors
    if (output.errors) {
      const severe = output.errors.filter(
        (e: { severity: string }) => e.severity === 'error',
      );
      if (severe.length > 0) {
        return err(
          `Compilation failed: ${severe.map((e: { message: string }) => e.message).join('\n')}`,
          400,
        );
      }
    }

    const deployedStripped = stripMetadata(deployedCode);

    // 3. Try the entry contract first
    const entryContracts = output.contracts?.[entryFile];
    const entryContractData = entryContracts?.[entryName];

    let matchedName: string | null = null;
    let matchedAbi: unknown[] = [];

    if (entryContractData) {
      const compiled = entryContractData.evm.deployedBytecode.object;
      if (stripMetadata(compiled).toLowerCase() === deployedStripped.toLowerCase()) {
        matchedName = entry_contract;
        matchedAbi = entryContractData.abi;
      }
    }

    // Fall back: search all compiled contracts
    if (!matchedName) {
      for (const [fileName, fileContracts] of Object.entries(output.contracts || {})) {
        for (const [contractName, contractData] of Object.entries(fileContracts as Record<string, unknown>)) {
          const cd = contractData as { evm: { deployedBytecode: { object: string } }; abi: unknown[] };
          const compiled = cd.evm.deployedBytecode.object;
          if (stripMetadata(compiled).toLowerCase() === deployedStripped.toLowerCase()) {
            matchedName = `${fileName}:${contractName}`;
            matchedAbi = cd.abi;
            break;
          }
        }
        if (matchedName) break;
      }
    }

    if (!matchedName) {
      return err(
        'Bytecode does not match. Check compiler version, optimization settings, and EVM version.',
        400,
      );
    }

    // 4. Store verification result in DB
    const pool = getPool();
    const flatSource = flattenMultiFileSources(files);

    // Ensure contract exists in contracts table
    await pool.query(
      `INSERT INTO contracts (address, updated_at)
       VALUES ($1, NOW())
       ON CONFLICT (address) DO NOTHING`,
      [addrLower],
    );

    await pool.query(
      `UPDATE contracts SET
        source_code = $2,
        abi = $3,
        compiler_version = $4,
        evm_version = $5,
        optimization_runs = $6,
        constructor_args = $7,
        is_verified = TRUE,
        verified_at = NOW(),
        updated_at = NOW()
      WHERE address = $1`,
      [
        addrLower,
        flatSource,
        JSON.stringify(matchedAbi),
        compiler_version,
        evm_version,
        optimization_runs ?? null,
        constructor_args ?? null,
      ],
    );

    return ok({
      address: addrLower,
      verified: true,
      contractName: matchedName,
      compiler: compiler_version,
      evmVersion: evm_version,
      optimizationRuns: optimization_runs ?? null,
    });
  } catch (error) {
    console.error('Multi-file contract verification error:', error);
    const message = error instanceof Error ? error.message : 'Verification failed';
    return err(message, 500);
  }
}
