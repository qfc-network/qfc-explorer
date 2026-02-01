import { checkDatabaseHealth } from '@/db/health';
import { ok } from '@/lib/api-response';

export async function GET() {
  const db = await checkDatabaseHealth();
  const status = db.ok ? 200 : 503;

  return ok(
    {
      db,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
