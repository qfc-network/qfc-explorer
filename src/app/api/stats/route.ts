export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getStatsOverview, getStatsSeries } from '@/db/queries';
import { ok } from '@/lib/api-response';

export const revalidate = 10;

export async function GET() {
  const [stats, series] = await Promise.all([
    getStatsOverview(),
    getStatsSeries(),
  ]);
  return ok({ stats, series });
}
