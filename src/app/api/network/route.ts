export const dynamic = "force-dynamic";

import { RpcClient } from '@/indexer/rpc';
import { fetchEpoch, fetchNodeInfo, fetchValidators } from '@/indexer/qfc';
import { fail, ok } from '@/lib/api-response';

export const revalidate = 15;

export async function GET() {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return fail('RPC_URL is not configured', 500);
  }

  const client = new RpcClient(rpcUrl);

  const [epoch, nodeInfo, validators] = await Promise.all([
    fetchEpoch(client),
    fetchNodeInfo(client),
    fetchValidators(client),
  ]);

  // Calculate total network hashrate
  const totalHashrate = validators
    .filter(v => v.providesCompute)
    .reduce((sum, v) => sum + BigInt(v.hashrate || '0'), BigInt(0))
    .toString();

  return ok({ epoch, nodeInfo, validators, totalHashrate });
}
