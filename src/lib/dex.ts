// DEX contract addresses (placeholders — update when deployed)
export const DEX_FACTORY_ADDRESS = '0x0000000000000000000000000000000000000000';
export const DEX_ROUTER_ADDRESS = '0x0000000000000000000000000000000000000000';

// Known tokens
export const TOKENS = [
  { symbol: 'QFC', address: null, decimals: 18 },
  { symbol: 'TTK', address: '0xff9427b41587206cea2b156a9967fb4d4dbf99d0', decimals: 18 },
  { symbol: 'QDOGE', address: '0xb7938ce567a164a216fa2d0aa885e32608b2e621', decimals: 18 },
] as const;

// Minimal ABIs for DEX interaction
export const DEX_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
  'function allPairsLength() view returns (uint256)',
  'function allPairs(uint256) view returns (address)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)',
] as const;

export const DEX_ROUTER_ABI = [
  'function factory() view returns (address)',
  'function WETH() view returns (address)',
  'function getAmountsOut(uint256 amountIn, address[] memory path) view returns (uint256[] memory amounts)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint256[] memory amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) payable returns (uint256[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
] as const;

export const DEX_PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() view returns (uint256)',
  'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
  'event Sync(uint112 reserve0, uint112 reserve1)',
] as const;

/**
 * Calculate output amount for a swap using the constant product formula.
 * Applies 0.3% fee (same as Uniswap V2).
 */
export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

/**
 * Format reserves as human-readable string (18 decimals).
 */
export function formatReserves(reserve: bigint, decimals = 18): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = reserve / divisor;
  const frac = reserve % divisor;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4);
  return `${whole.toLocaleString()}.${fracStr}`;
}
