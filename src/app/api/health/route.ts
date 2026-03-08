export const dynamic = "force-dynamic";

import { checkDatabaseHealth, checkRpcHealth, checkIndexerLag } from '@/db/health';
import { ok } from '@/lib/api-response';

export async function GET() {
  const [db, rpc, indexer] = await Promise.all([
    checkDatabaseHealth(),
    checkRpcHealth(),
    checkIndexerLag(),
  ]);

  const healthy = db.ok && rpc.ok && indexer.ok;

  return ok(
    {
      status: healthy ? 'healthy' : 'degraded',
      db,
      rpc,
      indexer,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
