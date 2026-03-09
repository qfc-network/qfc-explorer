export const dynamic = "force-dynamic";

import { RpcClient } from '@/indexer/rpc';
import {
  fetchMinerEarnings,
  fetchMinerVesting,
  fetchContributionScore,
} from '@/indexer/qfc';
import { fail, ok } from '@/lib/api-response';

export const revalidate = 15;

export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return fail('RPC_URL is not configured', 500);
  }

  const { address } = params;
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return fail('Invalid miner address', 400);
  }

  const client = new RpcClient(rpcUrl);

  try {
    const [earnings, vesting, contribution] = await Promise.all([
      fetchMinerEarnings(client, address),
      fetchMinerVesting(client, address),
      fetchContributionScore(client, address),
    ]);

    return ok({
      address,
      totalEarned: vesting.totalEarned,
      locked: vesting.locked,
      available: vesting.available,
      activeTranches: vesting.activeTranches,
      contributionScore: contribution.score,
      earnings,
      tranches: vesting.tranches,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch miner data';
    return fail(message, 502);
  }
}
