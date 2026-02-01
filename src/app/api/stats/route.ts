import { NextResponse } from 'next/server';
import { getStatsOverview } from '@/db/queries';

export const revalidate = 10;

export async function GET() {
  const stats = await getStatsOverview();
  return NextResponse.json({ stats });
}
