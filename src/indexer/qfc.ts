import { RpcClient } from './rpc';

export type RpcValidator = {
  address: string;
  stake: string;
  contributionScore: string;
  uptime: string;
  isActive: boolean;
  providesCompute: boolean;
  hashrate: string;
  inferenceScore: string;
  computeMode: string;
  tasksCompleted: string;
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

// v2.0: AI Inference types

export type RpcInferenceStats = {
  tasksCompleted: string;
  avgTimeMs: string;
  flopsTotal: string;
  passRate: string;
};

export type RpcComputeInfo = {
  backend: string;
  supportedModels: string[];
  gpuMemoryMb: number;
  inferenceScore: string;
  gpuTier: string;
  providesCompute: boolean;
};

export async function fetchInferenceStats(client: RpcClient): Promise<RpcInferenceStats> {
  return client.callWithRetry<RpcInferenceStats>('qfc_getInferenceStats');
}

export async function fetchComputeInfo(client: RpcClient): Promise<RpcComputeInfo> {
  return client.callWithRetry<RpcComputeInfo>('qfc_getComputeInfo');
}
