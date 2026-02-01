import { RpcClient } from './rpc';

export type RpcValidator = {
  address: string;
  stake: string;
  contributionScore: string;
  uptime: string;
  isActive: boolean;
};

export type RpcEpoch = {
  number: string;
  startTime: string;
  durationMs: string;
};

export type RpcNodeInfo = {
  version: string;
  chainId: string;
  peerCount: number;
  isValidator: boolean;
  syncing: boolean;
};

export async function fetchValidators(client: RpcClient): Promise<RpcValidator[]> {
  return client.callWithRetry<RpcValidator[]>('qfc_getValidators');
}

export async function fetchEpoch(client: RpcClient): Promise<RpcEpoch> {
  return client.callWithRetry<RpcEpoch>('qfc_getEpoch');
}

export async function fetchNodeInfo(client: RpcClient): Promise<RpcNodeInfo> {
  return client.callWithRetry<RpcNodeInfo>('qfc_nodeInfo');
}
