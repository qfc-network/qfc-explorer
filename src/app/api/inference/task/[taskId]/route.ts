export const dynamic = "force-dynamic";

import { ok, fail } from '@/lib/api-response';
import type { InferenceTaskDetail } from '@/lib/api-types';

// Mock data — will be replaced with RpcClient / contract reads
const MOCK_TASKS: Record<string, InferenceTaskDetail> = {
  '1': {
    taskId: '1',
    modelId: '1',
    modelName: 'Llama 3 8B',
    submitter: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    miner: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    status: 'Completed',
    maxFee: '10000000000000000',
    inputHash: '0xabc123def456789abc123def456789abc123def456789abc123def456789abcd',
    resultHash: '0xdef789abc123456def789abc123456def789abc123456def789abc123456defa',
    proof: '0x1234567890abcdef',
    createdAt: Date.now() - 120_000,
    claimedAt: Date.now() - 100_000,
    completedAt: Date.now() - 90_000,
    challengeWindow: Date.now() + 3_600_000,
  },
  '2': {
    taskId: '2',
    modelId: '2',
    modelName: 'Llama 3 70B',
    submitter: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    miner: null,
    status: 'Pending',
    maxFee: '50000000000000000',
    inputHash: '0x789abc123def456789abc123def456789abc123def456789abc123def456789a',
    resultHash: null,
    proof: null,
    createdAt: Date.now() - 60_000,
    claimedAt: null,
    completedAt: null,
    challengeWindow: null,
  },
  '3': {
    taskId: '3',
    modelId: '5',
    modelName: 'DeepSeek R1 7B',
    submitter: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    miner: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    status: 'Completed',
    maxFee: '15000000000000000',
    inputHash: '0x456def789abc123456def789abc123456def789abc123456def789abc123456d',
    resultHash: '0x123456def789abc123456def789abc123456def789abc123456def789abc1234',
    proof: '0xabcdef1234567890',
    createdAt: Date.now() - 300_000,
    claimedAt: Date.now() - 280_000,
    completedAt: Date.now() - 260_000,
    challengeWindow: Date.now() - 1_000,
  },
  '4': {
    taskId: '4',
    modelId: '4',
    modelName: 'SDXL',
    submitter: '0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e',
    miner: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    status: 'Assigned',
    maxFee: '30000000000000000',
    inputHash: '0xdef456789abc123def456789abc123def456789abc123def456789abc123def4',
    resultHash: null,
    proof: null,
    createdAt: Date.now() - 30_000,
    claimedAt: Date.now() - 20_000,
    completedAt: null,
    challengeWindow: null,
  },
  '5': {
    taskId: '5',
    modelId: '3',
    modelName: 'Whisper Large V3',
    submitter: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    miner: null,
    status: 'Failed',
    maxFee: '20000000000000000',
    inputHash: '0xabc789def123456abc789def123456abc789def123456abc789def123456abc7',
    resultHash: null,
    proof: null,
    createdAt: Date.now() - 600_000,
    claimedAt: null,
    completedAt: null,
    challengeWindow: null,
  },
};

export async function GET(
  _request: Request,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  if (!taskId) {
    return fail('Missing taskId', 400);
  }

  try {
    const task = MOCK_TASKS[taskId];
    if (!task) {
      return fail('Task not found', 404);
    }
    return ok(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, 500);
  }
}
