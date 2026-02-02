export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db/pool';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'tps';
  const format = searchParams.get('format') || 'csv';

  try {
    const pool = getPool();
    let data: Array<Record<string, unknown>> = [];
    let filename = 'qfc_export';

    switch (type) {
      case 'tps': {
        filename = 'qfc_tps_data';
        const result = await pool.query(`
          WITH recent_blocks AS (
            SELECT height, timestamp_ms, tx_count
            FROM blocks
            ORDER BY height DESC
            LIMIT 100
          ),
          intervals AS (
            SELECT
              height,
              timestamp_ms,
              tx_count,
              LAG(timestamp_ms) OVER (ORDER BY height) AS prev_ts
            FROM recent_blocks
          )
          SELECT
            height,
            timestamp_ms,
            tx_count,
            CASE
              WHEN (timestamp_ms - prev_ts) > 0 THEN
                ROUND((tx_count::numeric / ((timestamp_ms - prev_ts) / 1000.0))::numeric, 4)
              ELSE 0
            END AS tps
          FROM intervals
          ORDER BY height ASC
        `);
        data = result.rows;
        break;
      }

      case 'gas': {
        filename = 'qfc_gas_usage';
        const result = await pool.query(`
          SELECT
            height,
            timestamp_ms,
            gas_used,
            gas_limit,
            ROUND((gas_used::numeric / NULLIF(gas_limit::numeric, 0) * 100)::numeric, 2) AS utilization_percent
          FROM blocks
          ORDER BY height DESC
          LIMIT 100
        `);
        data = result.rows.reverse();
        break;
      }

      case 'block_time': {
        filename = 'qfc_block_time';
        const result = await pool.query(`
          WITH blocks_ordered AS (
            SELECT height, timestamp_ms
            FROM blocks
            ORDER BY height DESC
            LIMIT 100
          )
          SELECT
            height,
            timestamp_ms,
            COALESCE(timestamp_ms - LAG(timestamp_ms) OVER (ORDER BY height), 0) AS block_time_ms
          FROM blocks_ordered
          ORDER BY height ASC
        `);
        data = result.rows;
        break;
      }

      case 'validators': {
        filename = 'qfc_validator_stats';
        const result = await pool.query(`
          SELECT
            producer AS address,
            COUNT(*)::int AS blocks_produced,
            SUM(tx_count)::int AS total_transactions,
            SUM(gas_used)::bigint AS total_gas_used,
            MIN(timestamp_ms)::bigint AS first_block_time,
            MAX(timestamp_ms)::bigint AS last_block_time
          FROM blocks
          WHERE producer IS NOT NULL
          GROUP BY producer
          ORDER BY COUNT(*) DESC
        `);
        data = result.rows;
        break;
      }

      case 'blocks': {
        filename = 'qfc_blocks';
        const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 10000);
        const result = await pool.query(`
          SELECT
            height,
            hash,
            parent_hash,
            producer,
            timestamp_ms,
            gas_limit,
            gas_used,
            tx_count
          FROM blocks
          ORDER BY height DESC
          LIMIT $1
        `, [limit]);
        data = result.rows.reverse();
        break;
      }

      case 'transactions': {
        filename = 'qfc_transactions';
        const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 10000);
        const address = searchParams.get('address');

        let query = `
          SELECT
            hash,
            block_height,
            from_address,
            to_address,
            value,
            gas_limit,
            gas_price,
            status,
            nonce
          FROM transactions
        `;

        const params: (string | number)[] = [limit];
        if (address) {
          query += ` WHERE from_address = $2 OR to_address = $2`;
          params.push(address);
        }
        query += ` ORDER BY block_height DESC, tx_index DESC LIMIT $1`;

        const result = await pool.query(query, params);
        data = result.rows.reverse();
        break;
      }

      default:
        return new NextResponse('Invalid export type', { status: 400 });
    }

    if (format === 'json') {
      return NextResponse.json(data, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }

    // CSV format
    const csv = convertToCsv(data);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Export failed', { status: 500 });
  }
}

function convertToCsv(data: Array<Record<string, unknown>>): string {
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const value = row[h];
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
