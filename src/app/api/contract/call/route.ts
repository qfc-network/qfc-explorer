export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api-response';

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

type FunctionInput = {
  type: string;
  value: string;
};

type CallRequest = {
  address: string;
  function: string;
  inputs: FunctionInput[];
};

// Function signatures for common ERC-20 functions
const FUNCTION_SELECTORS: Record<string, string> = {
  // ERC-20
  name: '0x06fdde03',
  symbol: '0x95d89b41',
  decimals: '0x313ce567',
  totalSupply: '0x18160ddd',
  balanceOf: '0x70a08231',
  allowance: '0xdd62ed3e',
  transfer: '0xa9059cbb',
  approve: '0x095ea7b3',
  transferFrom: '0x23b872dd',
  // ERC-721
  ownerOf: '0x6352211e',
  tokenURI: '0xc87b56dd',
  // Generic
  owner: '0x8da5cb5b',
};

export async function POST(request: NextRequest) {
  try {
    const body: CallRequest = await request.json();
    const { address, function: funcName, inputs } = body;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return err('Invalid address format', 400);
    }

    if (!funcName) {
      return err('Function name is required', 400);
    }

    // Get function selector
    const selector = FUNCTION_SELECTORS[funcName];
    if (!selector) {
      return err(`Unknown function: ${funcName}`, 400);
    }

    // Encode call data
    let callData = selector;
    for (const input of inputs) {
      callData += encodeInput(input.type, input.value);
    }

    // Make eth_call
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: address,
            data: callData,
          },
          'latest',
        ],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.error) {
      return err(result.error.message || 'RPC call failed', 400);
    }

    // Decode result based on function
    const decoded = decodeResult(funcName, result.result);

    return ok({
      function: funcName,
      raw: result.result,
      result: decoded,
    });
  } catch (error) {
    console.error('Contract call error:', error);
    return err('Failed to call contract', 500);
  }
}

function encodeInput(type: string, value: string): string {
  if (type === 'address') {
    // Address: pad to 32 bytes (64 hex chars)
    const addr = value.toLowerCase().replace('0x', '');
    return addr.padStart(64, '0');
  }

  if (type === 'uint256' || type === 'uint8' || type.startsWith('uint')) {
    // Uint: convert to hex and pad
    try {
      const num = BigInt(value);
      return num.toString(16).padStart(64, '0');
    } catch {
      return '0'.repeat(64);
    }
  }

  if (type === 'bool') {
    return value === 'true' || value === '1' ? '1'.padStart(64, '0') : '0'.repeat(64);
  }

  // Default: treat as bytes32
  return value.replace('0x', '').padEnd(64, '0');
}

function decodeResult(funcName: string, result: string): string {
  if (!result || result === '0x' || result === '0x0') {
    return '0';
  }

  const data = result.replace('0x', '');

  switch (funcName) {
    case 'name':
    case 'symbol':
    case 'tokenURI':
      // String: dynamic type, decode from offset
      return decodeString(data);

    case 'decimals':
      // uint8
      return parseInt(data, 16).toString();

    case 'totalSupply':
    case 'balanceOf':
    case 'allowance':
      // uint256 - return raw for now, frontend can format
      return BigInt('0x' + data).toString();

    case 'ownerOf':
    case 'owner':
      // address: last 40 chars
      return '0x' + data.slice(-40);

    case 'transfer':
    case 'approve':
    case 'transferFrom':
      // bool
      return parseInt(data, 16) === 1 ? 'true' : 'false';

    default:
      // Return hex for unknown
      return result;
  }
}

function decodeString(data: string): string {
  try {
    // Dynamic string encoding:
    // - First 32 bytes: offset to data
    // - At offset: 32 bytes length, then data

    if (data.length < 128) {
      // Try direct decode
      const bytes = hexToBytes(data);
      return new TextDecoder().decode(bytes).replace(/\0/g, '').trim();
    }

    // Read offset (first 32 bytes)
    const offset = parseInt(data.slice(0, 64), 16) * 2;

    // Read length (32 bytes at offset)
    const length = parseInt(data.slice(offset, offset + 64), 16);

    // Read string data
    const strData = data.slice(offset + 64, offset + 64 + length * 2);
    const bytes = hexToBytes(strData);

    return new TextDecoder().decode(bytes);
  } catch {
    // Fallback: try direct decode
    const bytes = hexToBytes(data);
    return new TextDecoder().decode(bytes).replace(/\0/g, '').trim();
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
