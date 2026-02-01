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
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, height, parent_hash, producer, timestamp_ms, gas_limit, gas_used
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
  data: string | null;
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT hash, block_height, from_address, to_address, value, status, gas_limit, data
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
