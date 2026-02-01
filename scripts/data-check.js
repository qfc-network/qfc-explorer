const { Client } = require('pg');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const checks = [];

    checks.push({
      name: 'blocks_with_missing_txs',
      query: `
        SELECT COUNT(*) AS count
        FROM blocks b
        LEFT JOIN transactions t ON t.block_height = b.height
        GROUP BY b.height, b.tx_count
        HAVING COUNT(t.hash) <> b.tx_count
      `,
    });

    checks.push({
      name: 'txs_without_blocks',
      query: `
        SELECT COUNT(*) AS count
        FROM transactions t
        LEFT JOIN blocks b ON b.height = t.block_height
        WHERE b.height IS NULL
      `,
    });

    checks.push({
      name: 'events_without_txs',
      query: `
        SELECT COUNT(*) AS count
        FROM events e
        LEFT JOIN transactions t ON t.hash = e.tx_hash
        WHERE t.hash IS NULL
      `,
    });

    checks.push({
      name: 'accounts_without_activity',
      query: `
        SELECT COUNT(*) AS count
        FROM accounts a
        LEFT JOIN transactions t
          ON t.from_address = a.address OR t.to_address = a.address
        WHERE t.hash IS NULL
      `,
    });

    const results = {};
    for (const check of checks) {
      const res = await client.query(check.query);
      const count = Number(res.rows[0]?.count ?? 0);
      results[check.name] = count;
    }

    console.log('Data checks:', results);

    const failed = Object.values(results).some((count) => count > 0);
    if (failed) {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('Data check failed:', error);
  process.exit(1);
});
