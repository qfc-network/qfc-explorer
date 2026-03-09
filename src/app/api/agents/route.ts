export const dynamic = "force-dynamic";

import { RpcClient } from '@/indexer/rpc';
import { fetchAllAgents } from '@/lib/agent-registry';
import { fail, ok } from '@/lib/api-response';

export const revalidate = 30;

export async function GET() {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return fail('RPC_URL is not configured', 500);
  }

  const client = new RpcClient(rpcUrl);

  try {
    const agents = await fetchAllAgents(client);
    return ok({ total: agents.length, items: agents });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch agents';
    return fail(message, 502);
  }
}
