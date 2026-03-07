export const dynamic = "force-dynamic";

import { getPool } from '@/db/pool';
import { ok, err } from '@/lib/api-response';

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const pool = getPool();

    const [
      topBalances,
      mostActive,
      topValidators,
      topContracts,
    ] = await Promise.all([
      // Top 25 accounts by balance
      pool.query(`
        SELECT address, balance, nonce, last_seen_block
        FROM accounts
        WHERE balance::numeric > 0
        ORDER BY balance::numeric DESC
        LIMIT 25
      `),

      // Most active addresses by tx count (sent + received)
      pool.query(`
        SELECT address,
          (SELECT COUNT(*) FROM transactions WHERE from_address = a.address) AS sent,
          (SELECT COUNT(*) FROM transactions WHERE to_address = a.address) AS received,
          a.balance,
          a.last_seen_block
        FROM accounts a
        ORDER BY (
          (SELECT COUNT(*) FROM transactions WHERE from_address = a.address) +
          (SELECT COUNT(*) FROM transactions WHERE to_address = a.address)
        ) DESC
        LIMIT 25
      `),

      // Top validators by blocks produced
      pool.query(`
        SELECT
          producer AS address,
          COUNT(*)::int AS blocks_produced,
          MIN(height)::text AS first_block,
          MAX(height)::text AS last_block
        FROM blocks
        WHERE producer IS NOT NULL
        GROUP BY producer
        ORDER BY COUNT(*) DESC
        LIMIT 25
      `),

      // Top verified contracts by interaction count
      pool.query(`
        SELECT
          c.address,
          c.is_verified,
          COALESCE(t.name, '') AS token_name,
          (SELECT COUNT(*) FROM transactions WHERE to_address = c.address) AS tx_count
        FROM contracts c
        LEFT JOIN tokens t ON t.address = c.address
        ORDER BY (SELECT COUNT(*) FROM transactions WHERE to_address = c.address) DESC
        LIMIT 25
      `),
    ]);

    return ok({
      topBalances: topBalances.rows.map((r) => ({
        address: r.address,
        balance: r.balance,
        nonce: r.nonce,
        last_seen_block: r.last_seen_block,
      })),
      mostActive: mostActive.rows.map((r) => ({
        address: r.address,
        sent: String(r.sent),
        received: String(r.received),
        total: String(Number(r.sent) + Number(r.received)),
        balance: r.balance,
      })),
      topValidators: topValidators.rows.map((r) => ({
        address: r.address,
        blocks_produced: r.blocks_produced,
        first_block: r.first_block,
        last_block: r.last_block,
      })),
      topContracts: topContracts.rows.map((r) => ({
        address: r.address,
        is_verified: r.is_verified ?? false,
        token_name: r.token_name || null,
        tx_count: String(r.tx_count),
      })),
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return err('Failed to fetch leaderboard data', 500);
  }
}
