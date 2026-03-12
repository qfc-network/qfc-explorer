export const dynamic = "force-dynamic";

import { ok, fail } from '@/lib/api-response';
import type { NextRequest } from 'next/server';
// Mock data for now — will be replaced with RpcClient calls once
// the qfc_getRecentTasks RPC method is available.
const now = Math.floor(Date.now() / 1000);

const MOCK_TASKS = [
  {
    taskId: '32aa519f0e84f88f5e42e7127515bd74900d2f8d3b7774facf520fc2af6c75da',
    modelId: 'llama3-8b',
    status: 'Completed',
    submitter: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    taskType: 'TextGeneration',
    createdAt: now - 120,
    deadline: now + 3480,
    maxFee: '10000000000000000',
    minerAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    executionTimeMs: 1450,
  },
  {
    taskId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    modelId: 'llama3-70b',
    status: 'Pending',
    submitter: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    taskType: 'TextGeneration',
    createdAt: now - 60,
    deadline: now + 3540,
    maxFee: '50000000000000000',
  },
  {
    taskId: 'c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5',
    modelId: 'deepseek-r1-7b',
    status: 'Completed',
    submitter: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    taskType: 'TextGeneration',
    createdAt: now - 300,
    deadline: now + 3300,
    maxFee: '15000000000000000',
    minerAddress: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    executionTimeMs: 980,
  },
  {
    taskId: 'e8f9a0b1c2d3e8f9a0b1c2d3e8f9a0b1c2d3e8f9a0b1c2d3e8f9a0b1c2d3e8f9',
    modelId: 'sdxl',
    status: 'Assigned',
    submitter: '0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e',
    taskType: 'ImageGeneration',
    createdAt: now - 30,
    deadline: now + 3570,
    maxFee: '30000000000000000',
    minerAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
  },
  {
    taskId: 'f0a1b2c3d4e5f0a1b2c3d4e5f0a1b2c3d4e5f0a1b2c3d4e5f0a1b2c3d4e5f0a1',
    modelId: 'whisper-large-v3',
    status: 'Failed',
    submitter: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    taskType: 'SpeechToText',
    createdAt: now - 600,
    deadline: now + 3000,
    maxFee: '20000000000000000',
  },
];

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status');
    const submitter = request.nextUrl.searchParams.get('submitter');
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(request.nextUrl.searchParams.get('limit') ?? '25')));

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

    const total = tasks.length;
    const paged = tasks.slice((page - 1) * limit, page * limit);

    const completed = MOCK_TASKS.filter((t) => t.status === 'Completed').length;
    const pending = MOCK_TASKS.filter((t) => t.status === 'Pending').length;
    const failed = MOCK_TASKS.filter((t) => t.status === 'Failed').length;
    const completedTasks = MOCK_TASKS.filter((t) => t.status === 'Completed');
    const avgExecutionTimeMs = completedTasks.length > 0 ? 1200 : 0;

    return ok({
      page,
      limit,
      total,
      status: status ?? null,
      stats: {
        total: MOCK_TASKS.length,
        completed,
        pending,
        failed,
        avgExecutionTimeMs,
      },
      items: paged,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return fail(message, 500);
  }
}
