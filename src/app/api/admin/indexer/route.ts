import { getPool } from '@/db/pool';
import { ok } from '@/lib/api-response';

export async function GET() {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT key, value, updated_at
    FROM indexer_state
    ORDER BY updated_at DESC
    LIMIT 10
    `
  );

  const items = result.rows as Array<{ key: string; value: string; updated_at: string }>;
  const lastBatch = items.find((item) => item.key === 'last_batch_stats');
  const failed = items.find((item) => item.key === 'failed_blocks');

  const parsedBatch = lastBatch ? JSON.parse(lastBatch.value) : null;
  const parsedFailed = failed ? JSON.parse(failed.value) : null;

  return ok({ items, lastBatch: parsedBatch, failed: parsedFailed });
}
