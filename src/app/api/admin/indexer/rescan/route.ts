import { getPool } from '@/db/pool';
import { ok } from '@/lib/api-response';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { from?: number };
  const from = Number(body.from);
  if (!Number.isFinite(from) || from < 0) {
    return ok({ accepted: false, reason: 'Invalid "from" height' }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `
    INSERT INTO indexer_state (key, value)
    VALUES ('admin_rescan_from', $1)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [String(Math.floor(from))]
  );

  return ok({ accepted: true, from: Math.floor(from) });
}
