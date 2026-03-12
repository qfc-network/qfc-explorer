export const dynamic = "force-dynamic";

import { ok, fail } from '@/lib/api-response';
import type { NextRequest } from 'next/server';
import type { InferenceTaskItem } from '@/lib/api-types';

// Mock data for now — will be replaced with RpcClient calls once
// the qfc_getRecentTasks RPC method is available.
const MOCK_TASKS: InferenceTaskItem[] = [
  {
    taskId: '1',
    modelId: '1',
    modelName: 'Llama 3 8B',
    submitter: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    miner: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    status: 'Completed',
    maxFee: '10000000000000000',
    createdAt: Date.now() - 120_000,
  },
  {
    taskId: '2',
    modelId: '2',
    modelName: 'Llama 3 70B',
    submitter: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    miner: null,
    status: 'Pending',
    maxFee: '50000000000000000',
    createdAt: Date.now() - 60_000,
  },
  {
    taskId: '3',
    modelId: '5',
    modelName: 'DeepSeek R1 7B',
    submitter: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    miner: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    status: 'Completed',
    maxFee: '15000000000000000',
    createdAt: Date.now() - 300_000,
  },
  {
    taskId: '4',
    modelId: '4',
    modelName: 'SDXL',
    submitter: '0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e',
    miner: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    status: 'Assigned',
    maxFee: '30000000000000000',
    createdAt: Date.now() - 30_000,
  },
  {
    taskId: '5',
    modelId: '3',
    modelName: 'Whisper Large V3',
    submitter: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    miner: null,
    status: 'Failed',
    maxFee: '20000000000000000',
    createdAt: Date.now() - 600_000,
  },
];

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status');
    const submitter = request.nextUrl.searchParams.get('submitter');

    let tasks = [...MOCK_TASKS];

    if (status && status !== 'All') {
      tasks = tasks.filter((t) => t.status === status);
    }
    if (submitter) {
      tasks = tasks.filter(
        (t) => t.submitter.toLowerCase() === submitter.toLowerCase()
      );
    }

    tasks.sort((a, b) => b.createdAt - a.createdAt);

    return ok({ tasks, total: tasks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, 500);
  }
}
