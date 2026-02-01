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

  return ok({ items: result.rows });
}
