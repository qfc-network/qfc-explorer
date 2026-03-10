export const dynamic = "force-dynamic";

import { ok, fail } from '@/lib/api-response';

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

/** Only allow safe, read-only methods + tx broadcast through the public proxy. */
const ALLOWED_METHODS = new Set([
  // Transaction broadcast
  'eth_sendRawTransaction',
  // Read-only queries used by bridge/agents/tools pages
  'eth_call',
  'eth_estimateGas',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_getBalance',
  'eth_getCode',
  'eth_blockNumber',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_chainId',
  'net_version',
  // QFC custom read-only RPCs
  'qfc_getBridgeStatus',
  'qfc_getBridgeDeposits',
  'qfc_getBridgeWithdrawals',
  'qfc_getAgentRegistry',
  'qfc_getRecentTasks',
  'qfc_getContributionScore',
  'qfc_getMinerEarnings',
  'qfc_getMinerVesting',
  'qfc_getModelProposals',
]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const { method, params, id } = body as {
    method?: string;
    params?: unknown[];
    id?: number;
  };

  if (!method || typeof method !== 'string') {
    return fail('Missing "method" field', 400);
  }

  if (!ALLOWED_METHODS.has(method)) {
    return fail(`Method "${method}" is not allowed`, 403);
  }

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params: params ?? [],
      id: id ?? 1,
    }),
  });

  const result = await response.json();

  if (result.error) {
    return fail(result.error.message || 'RPC call failed', 502);
  }

  return ok(result.result);
}
