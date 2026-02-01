import { getPool } from './pool';

export type BlockRow = {
  hash: string;
  height: string;
  parent_hash: string | null;
  producer: string | null;
  timestamp_ms: string;
  tx_count: number;
};

export type TransactionRow = {
  hash: string;
  block_height: string;
  from_address: string;
  to_address: string | null;
  value: string;
  status: string;
  gas_limit?: string;
  data?: string | null;
};

export async function getLatestBlocks(limit = 10): Promise<BlockRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, height, parent_hash, producer, timestamp_ms, tx_count
    FROM blocks
    ORDER BY height DESC
    LIMIT $1
    `,
    [limit]
  );
  return result.rows;
}

export async function getLatestTransactions(limit = 10): Promise<TransactionRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, block_height, from_address, to_address, value, status
    FROM transactions
    ORDER BY block_height DESC, tx_index DESC
    LIMIT $1
    `,
    [limit]
  );
  return result.rows;
}

export async function getBlocksPage(limit: number, offset: number): Promise<BlockRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, height, parent_hash, producer, timestamp_ms, tx_count
    FROM blocks
    ORDER BY height DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );
  return result.rows;
}

export async function getTransactionsPage(limit: number, offset: number): Promise<TransactionRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, block_height, from_address, to_address, value, status
    FROM transactions
    ORDER BY block_height DESC, tx_index DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );
  return result.rows;
}

export async function getBlockByHeight(height: string): Promise<{
  hash: string;
  height: string;
  parent_hash: string | null;
  producer: string | null;
  timestamp_ms: string;
  gas_limit: string;
  gas_used: string;
  state_root: string | null;
  transactions_root: string | null;
  receipts_root: string | null;
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, height, parent_hash, producer, timestamp_ms, gas_limit, gas_used, state_root, transactions_root, receipts_root
    FROM blocks
    WHERE height = $1
    LIMIT 1
    `,
    [height]
  );
  return result.rows[0] ?? null;
}

export async function getBlockByHash(hash: string): Promise<{
  hash: string;
  height: string;
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, height
    FROM blocks
    WHERE hash = $1
    LIMIT 1
    `,
    [hash]
  );
  return result.rows[0] ?? null;
}

export async function getTransactionsByBlockHeight(
  height: string,
  limit: number,
  offset: number
): Promise<TransactionRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, block_height, from_address, to_address, value, status
    FROM transactions
    WHERE block_height = $1
    ORDER BY tx_index DESC
    LIMIT $2 OFFSET $3
    `,
    [height, limit, offset]
  );
  return result.rows;
}

export async function getTransactionByHash(hash: string): Promise<{
  hash: string;
  block_height: string;
  from_address: string;
  to_address: string | null;
  value: string;
  status: string;
  gas_limit: string;
  gas_price: string;
  nonce: string;
  data: string | null;
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, block_height, from_address, to_address, value, status, gas_limit, gas_price, nonce, data
    FROM transactions
    WHERE hash = $1
    LIMIT 1
    `,
    [hash]
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    ...row,
    data: row.data ? `0x${row.data.toString('hex')}` : null,
  };
}

export async function getReceiptLogsByTxHash(hash: string): Promise<Array<{
  contract_address: string;
  topic0: string | null;
  topic1: string | null;
  topic2: string | null;
  topic3: string | null;
  data: string | null;
}>> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT contract_address, topic0, topic1, topic2, topic3, data
    FROM events
    WHERE tx_hash = $1
    ORDER BY log_index ASC
    `,
    [hash]
  );
  return result.rows.map((row) => ({
    ...row,
    data: row.data ? `0x${row.data.toString('hex')}` : null,
  }));
}

export async function getAddressStats(address: string): Promise<{
  sent: string;
  received: string;
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT
      (SELECT COUNT(*) FROM transactions WHERE from_address = $1) AS sent,
      (SELECT COUNT(*) FROM transactions WHERE to_address = $1) AS received
    `,
    [address]
  );
  return result.rows[0] ?? null;
}

export async function getAddressOverview(address: string): Promise<{
  address: string;
  balance: string;
  nonce: string;
  last_seen_block: string;
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT address, balance, nonce, last_seen_block
    FROM accounts
    WHERE address = $1
    LIMIT 1
    `,
    [address]
  );
  return result.rows[0] ?? null;
}

export async function getAddressTransactions(
  address: string,
  limit: number,
  offset: number
): Promise<TransactionRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, block_height, from_address, to_address, value, status
    FROM transactions
    WHERE from_address = $1 OR to_address = $1
    ORDER BY block_height DESC, tx_index DESC
    LIMIT $2 OFFSET $3
    `,
    [address, limit, offset]
  );
  return result.rows;
}

export async function searchBlockHeightPrefix(prefix: string, limit: number): Promise<string[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT height
    FROM blocks
    WHERE height LIKE $1
    ORDER BY height DESC
    LIMIT $2
    `,
    [`${prefix}%`, limit]
  );
  return result.rows.map((row) => row.height);
}

export async function searchBlockHashPrefix(prefix: string, limit: number): Promise<Array<{ hash: string; height: string }>> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, height
    FROM blocks
    WHERE hash ILIKE $1
    ORDER BY height DESC
    LIMIT $2
    `,
    [`${prefix}%`, limit]
  );
  return result.rows;
}

export async function searchTransactionHashPrefix(prefix: string, limit: number): Promise<Array<{ hash: string; block_height: string }>> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, block_height
    FROM transactions
    WHERE hash ILIKE $1
    ORDER BY block_height DESC
    LIMIT $2
    `,
    [`${prefix}%`, limit]
  );
  return result.rows;
}

export async function searchAddressPrefix(prefix: string, limit: number): Promise<string[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT address
    FROM accounts
    WHERE address ILIKE $1
    ORDER BY last_seen_block DESC NULLS LAST
    LIMIT $2
    `,
    [`${prefix}%`, limit]
  );
  return result.rows.map((row) => row.address);
}

export async function getStatsOverview(): Promise<{
  latest_block: string | null;
  latest_timestamp_ms: string | null;
  avg_block_time_ms: string | null;
  tps: string | null;
  active_addresses: string | null;
}> {
  const pool = getPool();
  const result = await pool.query(
    `
    WITH recent_blocks AS (
      SELECT height, timestamp_ms
      FROM blocks
      ORDER BY height DESC
      LIMIT 100
    ),
    recent_txs AS (
      SELECT COUNT(*) AS tx_count
      FROM transactions
      WHERE block_height >= (SELECT MIN(height) FROM recent_blocks)
    ),
    address_activity AS (
      SELECT COUNT(DISTINCT addr) AS active
      FROM (
        SELECT from_address AS addr FROM transactions WHERE block_height >= (SELECT MIN(height) FROM recent_blocks)
        UNION
        SELECT to_address AS addr FROM transactions WHERE block_height >= (SELECT MIN(height) FROM recent_blocks)
      ) AS all_addrs
    )
    SELECT
      (SELECT MAX(height) FROM recent_blocks) AS latest_block,
      (SELECT MAX(timestamp_ms) FROM recent_blocks) AS latest_timestamp_ms,
      CASE
        WHEN (SELECT COUNT(*) FROM recent_blocks) > 1 THEN
          ((SELECT MAX(timestamp_ms) FROM recent_blocks) - (SELECT MIN(timestamp_ms) FROM recent_blocks))::numeric
          / (SELECT COUNT(*) - 1 FROM recent_blocks)
        ELSE NULL
      END AS avg_block_time_ms,
      CASE
        WHEN (SELECT COUNT(*) FROM recent_blocks) > 1 THEN
          (SELECT tx_count FROM recent_txs)::numeric
          / (((SELECT MAX(timestamp_ms) FROM recent_blocks) - (SELECT MIN(timestamp_ms) FROM recent_blocks)) / 1000.0)
        ELSE NULL
      END AS tps,
      (SELECT active FROM address_activity) AS active_addresses
    `,
    []
  );

  return result.rows[0] ?? {
    latest_block: null,
    latest_timestamp_ms: null,
    avg_block_time_ms: null,
    tps: null,
    active_addresses: null,
  };
}
