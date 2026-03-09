export const dynamic = "force-dynamic";

import { RpcClient } from '@/indexer/rpc';
import { fetchRecentTasks } from '@/indexer/qfc';
import { fail, ok } from '@/lib/api-response';
import type { NextRequest } from 'next/server';

export const revalidate = 10;

export async function GET(request: NextRequest) {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return fail('RPC_URL is not configured', 500);
  }

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? '25')));
  const status = params.get('status') || undefined;

  try {
    const client = new RpcClient(rpcUrl);
    const result = await fetchRecentTasks(client, page, limit, status);

    return ok({
      page,
      limit,
      total: result.total,
      status: status ?? null,
      stats: result.stats,
      items: result.tasks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, 500);
  }
}
