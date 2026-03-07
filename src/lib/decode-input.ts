// Common function selectors (first 4 bytes of keccak256 of function signature)
const KNOWN_SELECTORS: Record<string, { name: string; params: string[] }> = {
  // ERC-20
  'a9059cbb': { name: 'transfer', params: ['address to', 'uint256 amount'] },
  '095ea7b3': { name: 'approve', params: ['address spender', 'uint256 amount'] },
  '23b872dd': { name: 'transferFrom', params: ['address from', 'address to', 'uint256 amount'] },
  '70a08231': { name: 'balanceOf', params: ['address account'] },
  'dd62ed3e': { name: 'allowance', params: ['address owner', 'address spender'] },
  '18160ddd': { name: 'totalSupply', params: [] },
  // ERC-721
  '42842e0e': { name: 'safeTransferFrom', params: ['address from', 'address to', 'uint256 tokenId'] },
  'b88d4fde': { name: 'safeTransferFrom', params: ['address from', 'address to', 'uint256 tokenId', 'bytes data'] },
  '6352211e': { name: 'ownerOf', params: ['uint256 tokenId'] },
  // Common
  '8da5cb5b': { name: 'owner', params: [] },
  '715018a6': { name: 'renounceOwnership', params: [] },
  'f2fde38b': { name: 'transferOwnership', params: ['address newOwner'] },
  '3ccfd60b': { name: 'withdraw', params: [] },
  'd0e30db0': { name: 'deposit', params: [] },
  // Proxy
  '3659cfe6': { name: 'upgradeTo', params: ['address newImplementation'] },
  '4f1ef286': { name: 'upgradeToAndCall', params: ['address newImplementation', 'bytes data'] },
};

// Common event topic0s
const KNOWN_TOPICS: Record<string, string> = {
  'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer(address,address,uint256)',
  '8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval(address,address,uint256)',
  'e1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c': 'Deposit(address,uint256)',
  '7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65': 'Withdrawal(address,uint256)',
};

export type DecodedInput = {
  selector: string;
  functionName: string;
  params: string[];
  rawParams: string[];
};

export function decodeInput(data: string | null): DecodedInput | null {
  if (!data || data === '0x' || data.length < 10) return null;

  const selector = data.slice(2, 10).toLowerCase();
  const known = KNOWN_SELECTORS[selector];

  if (!known) return null;

  // Extract 32-byte params
  const paramsHex = data.slice(10);
  const rawParams: string[] = [];
  for (let i = 0; i < paramsHex.length; i += 64) {
    const chunk = paramsHex.slice(i, i + 64);
    if (chunk.length === 64) rawParams.push(chunk);
  }

  return {
    selector,
    functionName: known.name,
    params: known.params,
    rawParams,
  };
}

export function formatParam(paramType: string, rawValue: string): string {
  if (paramType.startsWith('address')) {
    return '0x' + rawValue.slice(24);
  }
  if (paramType.startsWith('uint')) {
    try {
      const val = BigInt('0x' + rawValue);
      return val.toString();
    } catch {
      return rawValue;
    }
  }
  return rawValue;
}

export function decodeEventTopic(topic0: string | null): string | null {
  if (!topic0) return null;
  const key = topic0.startsWith('0x') ? topic0.slice(2).toLowerCase() : topic0.toLowerCase();
  return KNOWN_TOPICS[key] ?? null;
}
