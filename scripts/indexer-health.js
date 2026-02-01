const { Client } = require('pg');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query(
      "SELECT value, updated_at FROM indexer_state WHERE key = 'last_processed_height'"
    );

    if (result.rowCount === 0) {
      console.error('Indexer has not processed any blocks yet.');
      process.exit(1);
    }

    const updatedAt = new Date(result.rows[0].updated_at);
    const ageMs = Date.now() - updatedAt.getTime();

    const maxAgeMs = process.env.INDEXER_HEALTH_MAX_AGE_MS
      ? Number(process.env.INDEXER_HEALTH_MAX_AGE_MS)
      : 5 * 60 * 1000;

    if (Number.isNaN(maxAgeMs)) {
      throw new Error('INDEXER_HEALTH_MAX_AGE_MS is not a number');
    }

    if (ageMs > maxAgeMs) {
      console.error(`Indexer stale: last update ${Math.round(ageMs / 1000)}s ago`);
      process.exit(1);
    }

    console.log('Indexer healthy');
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('Indexer health check failed:', error);
  process.exit(1);
});
