export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api-response';
import { getPool } from '@/db/pool';

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

type VerifyRequest = {
  address: string;
  sourceCode: string;
  compilerVersion: string;
  evmVersion?: string;
  optimizationRuns?: number;
  constructorArgs?: string;
};

/**
 * Strip the CBOR-encoded metadata hash from the end of Solidity bytecode.
 * Metadata format: ...{cbor_data}<2-byte length>
 * This allows matching bytecodes compiled with different metadata hashes.
 */
function stripMetadata(bytecode: string): string {
  const hex = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
  if (hex.length < 4) return hex;

  // Last 2 bytes = metadata length in bytes
  const metadataLength = parseInt(hex.slice(-4), 16);
  // metadata section = metadataLength * 2 hex chars + 4 chars for the length itself
  const metadataHexLen = metadataLength * 2 + 4;

  if (metadataHexLen >= hex.length) return hex;
  return hex.slice(0, hex.length - metadataHexLen);
}

/**
 * Compile Solidity source using solc standard JSON input.
 * Uses dynamically loaded solc.
 */
async function compileSolidity(
  sourceCode: string,
  compilerVersion: string,
  evmVersion: string,
  optimizationRuns?: number,
): Promise<{ bytecode: string; abi: unknown[]; contractName: string; error?: string }> {
  // Dynamic import of solc (no type declarations available)
  let solc: any;
  try {
    solc = (await (Function('return import("solc")')() as Promise<any>)).default;
  } catch {
    throw new Error('Solidity compiler (solc) not available on server');
  }

  const input = {
    language: 'Solidity',
    sources: {
      'Contract.sol': { content: sourceCode },
    },
    settings: {
      evmVersion,
      optimizer: optimizationRuns != null
        ? { enabled: true, runs: optimizationRuns }
        : { enabled: false },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // Check for errors
  if (output.errors) {
    const severe = output.errors.filter(
      (e: { severity: string }) => e.severity === 'error',
    );
    if (severe.length > 0) {
      return {
        bytecode: '',
        abi: [],
        contractName: '',
        error: severe.map((e: { message: string }) => e.message).join('\n'),
      };
    }
  }

  // Find the first contract in output
  const contracts = output.contracts?.['Contract.sol'];
  if (!contracts) {
    return { bytecode: '', abi: [], contractName: '', error: 'No contracts found in source code' };
  }

  const contractName = Object.keys(contracts)[0];
  const contract = contracts[contractName];

  return {
    bytecode: contract.evm.deployedBytecode.object,
    abi: contract.abi,
    contractName,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();
    const {
      address,
      sourceCode,
      compilerVersion,
      evmVersion = 'paris',
      optimizationRuns,
      constructorArgs,
    } = body;

    // Validate
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return err('Invalid address format', 400);
    }
    if (!sourceCode || sourceCode.trim().length === 0) {
      return err('Source code is required', 400);
    }
    if (!compilerVersion) {
      return err('Compiler version is required', 400);
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

    // 2. Compile source code
    const compiled = await compileSolidity(
      sourceCode,
      compilerVersion,
      evmVersion,
      optimizationRuns,
    );

    if (compiled.error) {
      return err(`Compilation failed: ${compiled.error}`, 400);
    }

    if (!compiled.bytecode) {
      return err('Compilation produced no bytecode', 400);
    }

    // 3. Compare bytecodes (strip metadata for comparison)
    const deployedStripped = stripMetadata(deployedCode);
    const compiledStripped = stripMetadata(compiled.bytecode);

    const matched = deployedStripped.toLowerCase() === compiledStripped.toLowerCase();

    if (!matched) {
      return err(
        'Bytecode does not match. Check compiler version, optimization settings, and EVM version.',
        400,
      );
    }

    // 4. Store verification result in DB
    const pool = getPool();

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
        sourceCode,
        JSON.stringify(compiled.abi),
        compilerVersion,
        evmVersion,
        optimizationRuns ?? null,
        constructorArgs ?? null,
      ],
    );

    return ok({
      address: addrLower,
      verified: true,
      contractName: compiled.contractName,
      compiler: compilerVersion,
      evmVersion,
      optimizationRuns: optimizationRuns ?? null,
    });
  } catch (error) {
    console.error('Contract verification error:', error);
    const message = error instanceof Error ? error.message : 'Verification failed';
    return err(message, 500);
  }
}
