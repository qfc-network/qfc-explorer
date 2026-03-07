export const dynamic = "force-dynamic";

import { RpcClient } from '@/indexer/rpc';
import { fetchPublicTaskStatus } from '@/indexer/qfc';
import { fail, ok } from '@/lib/api-response';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('id');
  if (!taskId) {
    return fail('Missing task id', 400);
  }

  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return fail('RPC_URL is not configured', 500);
  }

  try {
    const client = new RpcClient(rpcUrl);
    const status = await fetchPublicTaskStatus(client, taskId);
    return ok(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, 404);
  }
}
