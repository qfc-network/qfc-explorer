export const dynamic = "force-dynamic";

import { ok, fail } from '@/lib/api-response';

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

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
