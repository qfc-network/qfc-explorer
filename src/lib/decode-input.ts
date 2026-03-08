// Common function selectors (first 4 bytes of keccak256 of function signature)
const KNOWN_SELECTORS: Record<string, { name: string; params: string[] }> = {
  // ─── ERC-20 ───
  'a9059cbb': { name: 'transfer', params: ['address to', 'uint256 amount'] },
  '095ea7b3': { name: 'approve', params: ['address spender', 'uint256 amount'] },
  '23b872dd': { name: 'transferFrom', params: ['address from', 'address to', 'uint256 amount'] },
  '70a08231': { name: 'balanceOf', params: ['address account'] },
  'dd62ed3e': { name: 'allowance', params: ['address owner', 'address spender'] },
  '18160ddd': { name: 'totalSupply', params: [] },
  '06fdde03': { name: 'name', params: [] },
  '95d89b41': { name: 'symbol', params: [] },
  '313ce567': { name: 'decimals', params: [] },
  '40c10f19': { name: 'mint', params: ['address to', 'uint256 amount'] },
  '42966c68': { name: 'burn', params: ['uint256 amount'] },
  '79cc6790': { name: 'burnFrom', params: ['address account', 'uint256 amount'] },
  '39509351': { name: 'increaseAllowance', params: ['address spender', 'uint256 addedValue'] },
  'a457c2d7': { name: 'decreaseAllowance', params: ['address spender', 'uint256 subtractedValue'] },
  'd505accf': { name: 'permit', params: ['address owner', 'address spender', 'uint256 value', 'uint256 deadline', 'uint8 v', 'bytes32 r', 'bytes32 s'] },

  // ─── ERC-721 ───
  '42842e0e': { name: 'safeTransferFrom', params: ['address from', 'address to', 'uint256 tokenId'] },
  'b88d4fde': { name: 'safeTransferFrom', params: ['address from', 'address to', 'uint256 tokenId', 'bytes data'] },
  '6352211e': { name: 'ownerOf', params: ['uint256 tokenId'] },
  'a22cb465': { name: 'setApprovalForAll', params: ['address operator', 'bool approved'] },
  'e985e9c5': { name: 'isApprovedForAll', params: ['address owner', 'address operator'] },
  '081812fc': { name: 'getApproved', params: ['uint256 tokenId'] },
  'c87b56dd': { name: 'tokenURI', params: ['uint256 tokenId'] },
  '4f6ccce7': { name: 'tokenByIndex', params: ['uint256 index'] },
  '2f745c59': { name: 'tokenOfOwnerByIndex', params: ['address owner', 'uint256 index'] },
  '01ffc9a7': { name: 'supportsInterface', params: ['bytes4 interfaceId'] },

  // ─── ERC-1155 ───
  'f242432a': { name: 'safeTransferFrom', params: ['address from', 'address to', 'uint256 id', 'uint256 amount', 'bytes data'] },
  '2eb2c2d6': { name: 'safeBatchTransferFrom', params: ['address from', 'address to', 'uint256[] ids', 'uint256[] amounts', 'bytes data'] },
  '00fdd58e': { name: 'balanceOf', params: ['address account', 'uint256 id'] },
  '4e1273f4': { name: 'balanceOfBatch', params: ['address[] accounts', 'uint256[] ids'] },
  '0e89341c': { name: 'uri', params: ['uint256 id'] },

  // ─── Uniswap V2 Router ───
  '38ed1739': { name: 'swapExactTokensForTokens', params: ['uint256 amountIn', 'uint256 amountOutMin', 'address[] path', 'address to', 'uint256 deadline'] },
  '8803dbee': { name: 'swapTokensForExactTokens', params: ['uint256 amountOut', 'uint256 amountInMax', 'address[] path', 'address to', 'uint256 deadline'] },
  '7ff36ab5': { name: 'swapExactETHForTokens', params: ['uint256 amountOutMin', 'address[] path', 'address to', 'uint256 deadline'] },
  '4a25d94a': { name: 'swapTokensForExactETH', params: ['uint256 amountOut', 'uint256 amountInMax', 'address[] path', 'address to', 'uint256 deadline'] },
  '18cbafe5': { name: 'swapExactTokensForETH', params: ['uint256 amountIn', 'uint256 amountOutMin', 'address[] path', 'address to', 'uint256 deadline'] },
  'fb3bdb41': { name: 'swapETHForExactTokens', params: ['uint256 amountOut', 'address[] path', 'address to', 'uint256 deadline'] },
  'e8e33700': { name: 'addLiquidity', params: ['address tokenA', 'address tokenB', 'uint256 amountADesired', 'uint256 amountBDesired', 'uint256 amountAMin', 'uint256 amountBMin', 'address to', 'uint256 deadline'] },
  'f305d719': { name: 'addLiquidityETH', params: ['address token', 'uint256 amountTokenDesired', 'uint256 amountTokenMin', 'uint256 amountETHMin', 'address to', 'uint256 deadline'] },
  'baa2abde': { name: 'removeLiquidity', params: ['address tokenA', 'address tokenB', 'uint256 liquidity', 'uint256 amountAMin', 'uint256 amountBMin', 'address to', 'uint256 deadline'] },
  '02751cec': { name: 'removeLiquidityETH', params: ['address token', 'uint256 liquidity', 'uint256 amountTokenMin', 'uint256 amountETHMin', 'address to', 'uint256 deadline'] },

  // ─── Uniswap V3 Router ───
  '414bf389': { name: 'exactInputSingle', params: ['tuple params'] },
  'c04b8d59': { name: 'exactInput', params: ['tuple params'] },
  'db3e2198': { name: 'exactOutputSingle', params: ['tuple params'] },
  'f28c0498': { name: 'exactOutput', params: ['tuple params'] },
  'ac9650d8': { name: 'multicall', params: ['bytes[] data'] },
  '5ae401dc': { name: 'multicall', params: ['uint256 deadline', 'bytes[] data'] },
  '1f0464d1': { name: 'multicall', params: ['bytes32 previousBlockhash', 'bytes[] data'] },

  // ─── Uniswap V2 Pair ───
  '022c0d9f': { name: 'swap', params: ['uint256 amount0Out', 'uint256 amount1Out', 'address to', 'bytes data'] },
  '6a627842': { name: 'mint', params: ['address to'] },
  '89afcb44': { name: 'burn', params: ['address to'] },
  'bc25cf77': { name: 'skim', params: ['address to'] },
  'fff6cae9': { name: 'sync', params: [] },
  '0902f1ac': { name: 'getReserves', params: [] },

  // ─── Common DeFi ───
  '2e1a7d4d': { name: 'withdraw', params: ['uint256 amount'] },
  'b6b55f25': { name: 'deposit', params: ['uint256 amount'] },
  'e2bbb158': { name: 'deposit', params: ['uint256 pid', 'uint256 amount'] },
  '441a3e70': { name: 'withdraw', params: ['uint256 pid', 'uint256 amount'] },
  '1058d281': { name: 'harvest', params: ['uint256 pid'] },
  'e9fad8ee': { name: 'exit', params: [] },
  'a694fc3a': { name: 'stake', params: ['uint256 amount'] },
  '2e17de78': { name: 'unstake', params: ['uint256 amount'] },
  '3d18b912': { name: 'getReward', params: [] },
  '853828b6': { name: 'withdrawAll', params: [] },
  'c32e7202': { name: 'claimRewards', params: [] },

  // ─── Wrapped ETH (WETH) ───
  'd0e30db0': { name: 'deposit', params: [] },
  '3ccfd60b': { name: 'withdraw', params: [] },

  // ─── Governance ───
  '7d5e81e2': { name: 'propose', params: ['address[] targets', 'uint256[] values', 'bytes[] calldatas', 'string description'] },
  '56781388': { name: 'castVote', params: ['uint256 proposalId', 'uint8 support'] },
  '7b3c71d3': { name: 'castVoteWithReason', params: ['uint256 proposalId', 'uint8 support', 'string reason'] },
  '160cbed7': { name: 'castVoteWithReasonAndParams', params: ['uint256 proposalId', 'uint8 support', 'string reason', 'bytes params'] },
  '2fe99141': { name: 'execute', params: ['uint256 proposalId'] },
  'fe0d94c1': { name: 'execute', params: ['uint256 proposalId'] },
  'ea0217cf': { name: 'queue', params: ['uint256 proposalId'] },
  '452115d6': { name: 'cancel', params: ['uint256 proposalId'] },
  '5c19a95c': { name: 'delegate', params: ['address delegatee'] },
  'c3cda520': { name: 'delegateBySig', params: ['address delegatee', 'uint256 nonce', 'uint256 expiry', 'uint8 v', 'bytes32 r', 'bytes32 s'] },
  '587cde1e': { name: 'delegates', params: ['address account'] },
  '3a46b1a8': { name: 'getPastVotes', params: ['address account', 'uint256 blockNumber'] },

  // ─── Access Control ───
  '8da5cb5b': { name: 'owner', params: [] },
  '715018a6': { name: 'renounceOwnership', params: [] },
  'f2fde38b': { name: 'transferOwnership', params: ['address newOwner'] },
  '2f2ff15d': { name: 'grantRole', params: ['bytes32 role', 'address account'] },
  'd547741f': { name: 'revokeRole', params: ['bytes32 role', 'address account'] },
  '36568abe': { name: 'renounceRole', params: ['bytes32 role', 'address account'] },
  '91d14854': { name: 'hasRole', params: ['bytes32 role', 'address account'] },
  '248a9ca3': { name: 'getRoleAdmin', params: ['bytes32 role'] },

  // ─── Proxy / Upgradeable ───
  '3659cfe6': { name: 'upgradeTo', params: ['address newImplementation'] },
  '4f1ef286': { name: 'upgradeToAndCall', params: ['address newImplementation', 'bytes data'] },
  '5c60da1b': { name: 'implementation', params: [] },
  'f851a440': { name: 'admin', params: [] },
  '8f283970': { name: 'changeAdmin', params: ['address newAdmin'] },

  // ─── Multicall / Batch ───
  '252dba42': { name: 'aggregate', params: ['tuple[] calls'] },
  '82ad56cb': { name: 'aggregate3', params: ['tuple[] calls'] },
  'bce38bd7': { name: 'tryAggregate', params: ['bool requireSuccess', 'tuple[] calls'] },

  // ─── Safe (Gnosis) Multisig ───
  '6a761202': { name: 'execTransaction', params: ['address to', 'uint256 value', 'bytes data', 'uint8 operation', 'uint256 safeTxGas', 'uint256 baseGas', 'uint256 gasPrice', 'address gasToken', 'address refundReceiver', 'bytes signatures'] },
  '0d582f13': { name: 'addOwnerWithThreshold', params: ['address owner', 'uint256 threshold'] },
  'f8dc5dd9': { name: 'removeOwner', params: ['address prevOwner', 'address owner', 'uint256 threshold'] },
  'e318b52b': { name: 'swapOwner', params: ['address prevOwner', 'address oldOwner', 'address newOwner'] },
  '694e80c3': { name: 'changeThreshold', params: ['uint256 threshold'] },

  // ─── ENS ───
  '1896f70a': { name: 'setResolver', params: ['bytes32 node', 'address resolver'] },
  '5b0fc9c3': { name: 'setOwner', params: ['bytes32 node', 'address owner'] },
  '06ab5923': { name: 'setSubnodeOwner', params: ['bytes32 node', 'bytes32 label', 'address owner'] },
  'fda8d2a8': { name: 'setSubnodeRecord', params: ['bytes32 node', 'bytes32 label', 'address owner', 'address resolver', 'uint64 ttl'] },
  '3b3b57de': { name: 'addr', params: ['bytes32 node'] },
  '691f3431': { name: 'name', params: ['bytes32 node'] },

  // ─── ERC-4626 Vault ───
  '6e553f65': { name: 'deposit', params: ['uint256 assets', 'address receiver'] },
  'ba087652': { name: 'mint', params: ['uint256 shares', 'address receiver'] },
  'b460af94': { name: 'withdraw', params: ['uint256 assets', 'address receiver', 'address owner'] },
  'ef8b30f7': { name: 'previewMint', params: ['uint256 shares'] },
  'b3d7f6b9': { name: 'previewDeposit', params: ['uint256 assets'] },
  '0a28a477': { name: 'previewRedeem', params: ['uint256 shares'] },
  '4cdad506': { name: 'previewWithdraw', params: ['uint256 assets'] },
  '07a2d13a': { name: 'convertToShares', params: ['uint256 assets'] },
  'f3fef3a3': { name: 'withdraw', params: ['address token', 'uint256 amount'] },

  // ─── Staking ───
  'a1903eab': { name: 'submit', params: ['address referral'] },
  'cce7ec13': { name: 'requestWithdrawals', params: ['uint256[] amounts', 'address owner'] },
  'e3afe0a3': { name: 'claimWithdrawals', params: ['uint256[] requestIds'] },

  // ─── Misc Common ───
  '8456cb59': { name: 'pause', params: [] },
  '3f4ba83a': { name: 'unpause', params: [] },
  '5c975abb': { name: 'paused', params: [] },
  'a217fddf': { name: 'DEFAULT_ADMIN_ROLE', params: [] },
  'c4d66de8': { name: 'initialize', params: ['address initialOwner'] },
  'fe4b84df': { name: 'initialize', params: ['uint256 initialValue'] },
  'f8c8765e': { name: 'initialize', params: ['address token0', 'address token1', 'address factory', 'address router'] },
  'b0f479a1': { name: 'getRouter', params: [] },
};

/**
 * Look up a 4-byte method selector and return the function name, or null if unknown.
 * Accepts with or without '0x' prefix.
 */
export function lookupSelector(selector: string): string | null {
  const clean = selector.startsWith('0x') ? selector.slice(2).toLowerCase() : selector.toLowerCase();
  return KNOWN_SELECTORS[clean]?.name ?? null;
}

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

// --- ABI-based event log decoder ---

export type AbiEventInput = {
  name: string;
  type: string;
  indexed: boolean;
};

export type AbiEventDef = {
  type: 'event';
  name: string;
  inputs: AbiEventInput[];
};

export type DecodedEventParam = {
  name: string;
  type: string;
  indexed: boolean;
  value: string;
};

export type DecodedEventLog = {
  name: string;
  signature: string;
  params: DecodedEventParam[];
};

/** Simple keccak256 using SubtleCrypto is not available synchronously,
 *  so we match topic0 by building signature strings and comparing against
 *  event ABI entries. The topic0 matching is done by the caller who already
 *  has the topic0 from the backend decode-log endpoint. This utility
 *  focuses on parsing ABI event definitions from a JSON ABI array. */

/**
 * Extract all event definitions from a parsed ABI JSON array.
 */
export function extractEventDefs(abi: unknown[]): AbiEventDef[] {
  const events: AbiEventDef[] = [];
  for (const item of abi) {
    if (typeof item !== 'object' || item === null) continue;
    const entry = item as Record<string, unknown>;
    if (entry.type !== 'event' || typeof entry.name !== 'string') continue;
    const inputs: AbiEventInput[] = [];
    if (Array.isArray(entry.inputs)) {
      for (const inp of entry.inputs) {
        if (typeof inp !== 'object' || inp === null) continue;
        const p = inp as Record<string, unknown>;
        inputs.push({
          name: (p.name as string) || '',
          type: (p.type as string) || '',
          indexed: Boolean(p.indexed),
        });
      }
    }
    events.push({ type: 'event', name: entry.name, inputs });
  }
  return events;
}

/**
 * Build the canonical event signature string: "Transfer(address,address,uint256)"
 */
export function buildEventSignature(event: AbiEventDef): string {
  const types = event.inputs.map((i) => i.type).join(',');
  return `${event.name}(${types})`;
}

/**
 * Decode an event log given the matched ABI event definition.
 * topics[0] = topic0 (event signature hash)
 * topics[1..3] = indexed parameters
 * data = non-indexed parameters (ABI-encoded)
 */
export function decodeEventLog(
  event: AbiEventDef,
  topics: (string | null)[],
  data: string | null,
): DecodedEventLog {
  const params: DecodedEventParam[] = [];
  let topicIdx = 1; // skip topic0
  let dataOffset = 0;
  const cleanData = (data || '0x').startsWith('0x')
    ? (data || '0x').slice(2)
    : (data || '');

  for (const input of event.inputs) {
    if (input.indexed) {
      const topicHex = topicIdx < topics.length && topics[topicIdx]
        ? topics[topicIdx]!.startsWith('0x')
          ? topics[topicIdx]!.slice(2)
          : topics[topicIdx]!
        : '';
      params.push({
        name: input.name,
        type: input.type,
        indexed: true,
        value: topicHex ? decodeAbiWord(topicHex.padStart(64, '0'), input.type) : '',
      });
      topicIdx++;
    } else {
      if (dataOffset + 64 <= cleanData.length) {
        const word = cleanData.slice(dataOffset, dataOffset + 64);
        params.push({
          name: input.name,
          type: input.type,
          indexed: false,
          value: decodeAbiWord(word, input.type),
        });
        dataOffset += 64;
      } else {
        params.push({
          name: input.name,
          type: input.type,
          indexed: false,
          value: '',
        });
      }
    }
  }

  return {
    name: event.name,
    signature: buildEventSignature(event),
    params,
  };
}

/** Decode a single 32-byte hex word by ABI type */
function decodeAbiWord(hex: string, type: string): string {
  if (type === 'address') {
    return '0x' + hex.slice(24).toLowerCase();
  }
  if (type === 'bool') {
    return parseInt(hex, 16) !== 0 ? 'true' : 'false';
  }
  if (type.startsWith('uint')) {
    try {
      return BigInt('0x' + hex).toString();
    } catch {
      return '0x' + hex;
    }
  }
  if (type.startsWith('int')) {
    try {
      const bits = parseInt(type.slice(3)) || 256;
      const val = BigInt('0x' + hex);
      const max = 1n << BigInt(bits);
      const half = max / 2n;
      return (val >= half ? val - max : val).toString();
    } catch {
      return '0x' + hex;
    }
  }
  if (type.startsWith('bytes') && type !== 'bytes') {
    const len = parseInt(type.slice(5));
    if (len > 0) return '0x' + hex.slice(0, len * 2);
  }
  return '0x' + hex;
}

/**
 * Check if a uint256 value looks like a token amount (> 1e15 wei).
 * Used to decide whether to show wei-to-QFC conversion.
 */
export function looksLikeWeiAmount(value: string): boolean {
  try {
    const v = BigInt(value);
    return v > 1000000000000000n; // > 0.001 QFC in wei
  } catch {
    return false;
  }
}
