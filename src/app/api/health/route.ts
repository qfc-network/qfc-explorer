import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/db/health';

export async function GET() {
  const db = await checkDatabaseHealth();
  const status = db.ok ? 200 : 503;

  return NextResponse.json(
    {
      ok: db.ok,
      db,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
