import { NextResponse } from 'next/server';
import { RpcClient } from '@/indexer/rpc';
import { fetchEpoch, fetchNodeInfo, fetchValidators } from '@/indexer/qfc';

export const revalidate = 15;

export async function GET() {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    return NextResponse.json({ error: 'RPC_URL is not configured' }, { status: 500 });
  }

  const client = new RpcClient(rpcUrl);

  const [epoch, nodeInfo, validators] = await Promise.all([
    fetchEpoch(client),
    fetchNodeInfo(client),
    fetchValidators(client),
  ]);

  return NextResponse.json({ epoch, nodeInfo, validators });
}
