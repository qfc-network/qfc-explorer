export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api-response';
import { getDailyStats } from '@/db/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const daysParam = searchParams.get('days');
  const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365) : 30;

  try {
    const stats = await getDailyStats(days);

    return ok({
      days,
      stats: stats.map((s) => ({
        date: s.date,
        tx_count: Number(s.tx_count),
        active_addresses: s.active_addresses,
        new_contracts: s.new_contracts,
        total_gas_used: s.total_gas_used,
        avg_gas_price: Number(s.avg_gas_price),
        block_count: s.block_count,
        avg_block_time_ms: Number(s.avg_block_time_ms),
      })),
    });
  } catch (error) {
    console.error('Daily analytics error:', error);
    return err('Failed to fetch daily analytics', 500);
  }
}
