export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { getPool } from '@/db/pool';
import { ok, err } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const pool = getPool();

    // Get contracts list
    const result = await pool.query(`
      SELECT
        address,
        creator_tx_hash,
        created_at_block::text,
        is_verified
      FROM contracts
      ORDER BY created_at_block DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM contracts');
    const total = countResult.rows[0]?.total ?? 0;

    return ok({
      items: result.rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Contracts list error:', error);
    return err('Failed to fetch contracts', 500);
  }
}
