import { getPool } from './pool';

export async function checkDatabaseHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'unknown error' };
  }
}
