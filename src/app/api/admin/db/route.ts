export const dynamic = "force-dynamic";

import { getPool } from '@/db/pool';
import { ok } from '@/lib/api-response';

export async function GET() {
  const pool = getPool();
  const stats = {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };

  return ok({ pool: stats });
}
