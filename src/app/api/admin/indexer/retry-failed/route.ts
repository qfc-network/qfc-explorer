export const dynamic = "force-dynamic";

import { getPool } from '@/db/pool';
import { ok } from '@/lib/api-response';

export async function POST() {
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO indexer_state (key, value)
    VALUES ('admin_retry_failed', 'true')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `
  );

  return ok({ accepted: true });
}
