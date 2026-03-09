export const dynamic = "force-dynamic";

import { RpcClient } from '@/indexer/rpc';
import { fetchAgent } from '@/lib/agent-registry';
import { fail, ok } from '@/lib/api-response';

export const revalidate = 15;

export async function GET(
  _request: Request,
  { params }: { params: { agentId: string } }
) {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return fail('RPC_URL is not configured', 500);
  }

  const { agentId } = params;
  if (!agentId) {
    return fail('Agent ID is required', 400);
  }

  const client = new RpcClient(rpcUrl);

  try {
    const agent = await fetchAgent(client, decodeURIComponent(agentId));
    if (!agent) {
      return fail('Agent not found', 404);
    }
    return ok(agent);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch agent';
    return fail(message, 502);
  }
}
