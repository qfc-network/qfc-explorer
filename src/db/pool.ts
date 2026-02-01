import { Pool } from 'pg';

type GlobalWithPool = typeof globalThis & { __qfcPgPool?: Pool };

const globalWithPool = globalThis as GlobalWithPool;

export function getPool(): Pool {
  if (!globalWithPool.__qfcPgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    globalWithPool.__qfcPgPool = new Pool({ connectionString });
  }

  return globalWithPool.__qfcPgPool;
}
