export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getPool } from '@/db/pool';
import { ok, err } from '@/lib/api-response';

export const revalidate = 30;

export async function GET() {
  try {
    const pool = getPool();

    // Get overview stats
    const overviewResult = await pool.query(`
      SELECT
        (SELECT COUNT(*)::text FROM blocks) AS total_blocks,
        (SELECT COUNT(*)::text FROM transactions) AS total_transactions,
        (SELECT COUNT(*)::text FROM accounts) AS total_addresses,
        (SELECT COALESCE(SUM(gas_used::numeric), 0)::text FROM blocks) AS total_gas_used
    `);

    const overview = overviewResult.rows[0] ?? {
      total_blocks: '0',
      total_transactions: '0',
      total_addresses: '0',
      total_gas_used: '0',
    };

    // Get time series data (last 100 blocks)
    const seriesResult = await pool.query(`
      WITH recent_blocks AS (
        SELECT height, timestamp_ms, gas_used, tx_count
        FROM blocks
        ORDER BY height DESC
        LIMIT 100
      ),
      intervals AS (
        SELECT
          height,
          timestamp_ms,
          gas_used,
          tx_count,
          LAG(timestamp_ms) OVER (ORDER BY height) AS prev_ts
        FROM recent_blocks
      )
      SELECT
        height::text AS label,
        timestamp_ms::bigint AS timestamp,
        COALESCE(timestamp_ms - prev_ts, 0)::int AS block_time_ms,
        COALESCE(gas_used, 0)::bigint AS gas_used,
        COALESCE(tx_count, 0)::int AS tx_count,
        CASE
          WHEN (timestamp_ms - prev_ts) > 0 THEN
            (tx_count::numeric / ((timestamp_ms - prev_ts) / 1000.0))
          ELSE 0
        END AS tps
      FROM intervals
      ORDER BY height ASC
    `);

    const series = {
      tps: seriesResult.rows.map((row) => ({
        label: row.label,
        value: Number(row.tps) || 0,
        timestamp: Number(row.timestamp),
      })),
      gas_used: seriesResult.rows.map((row) => ({
        label: row.label,
        value: Number(row.gas_used) || 0,
        timestamp: Number(row.timestamp),
      })),
      block_time: seriesResult.rows.map((row) => ({
        label: row.label,
        value: Number(row.block_time_ms) || 0,
        timestamp: Number(row.timestamp),
      })),
      tx_count: seriesResult.rows.map((row) => ({
        label: row.label,
        value: Number(row.tx_count) || 0,
        timestamp: Number(row.timestamp),
      })),
    };

    // Get validator stats (blocks produced per producer)
    const validatorResult = await pool.query(`
      SELECT
        producer AS address,
        COUNT(*)::int AS blocks_produced,
        MAX(contribution_score)::text AS contribution_score,
        '10000' AS uptime  -- Default uptime since we don't have per-block uptime data
      FROM blocks
      WHERE producer IS NOT NULL
      GROUP BY producer
      ORDER BY COUNT(*) DESC
      LIMIT 50
    `);

    const validators = validatorResult.rows.map((row) => ({
      address: row.address,
      blocks_produced: row.blocks_produced,
      contribution_score: row.contribution_score || '0',
      uptime: row.uptime,
    }));

    return ok({
      overview,
      series,
      validators,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return err('Failed to fetch analytics data', 500);
  }
}
