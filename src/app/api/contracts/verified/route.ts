export const dynamic = "force-dynamic";

import { ok, err } from '@/lib/api-response';
import { getPool } from '@/db/pool';

export async function GET() {
  try {
    const pool = getPool();

    const result = await pool.query(`
      SELECT
        c.address,
        c.creator_tx_hash,
        c.created_at_block::text,
        c.compiler_version,
        c.verified_at,
        t.name AS token_name,
        t.symbol AS token_symbol,
        (SELECT COUNT(*)::int FROM transactions WHERE to_address = c.address) AS interaction_count
      FROM contracts c
      LEFT JOIN tokens t ON t.address = c.address
      WHERE c.is_verified = true
      ORDER BY interaction_count DESC, c.verified_at DESC NULLS LAST
      LIMIT 50
    `);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM contracts WHERE is_verified = true`
    );

    return ok({
      items: result.rows.map((r) => ({
        ...r,
        verified_at: r.verified_at?.toISOString() ?? null,
      })),
      total: countResult.rows[0]?.total ?? 0,
    });
  } catch (error) {
    console.error('Verified contracts error:', error);
    return err('Failed to fetch verified contracts', 500);
  }
}
