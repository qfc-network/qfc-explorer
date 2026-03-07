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

export async function getBlocksPage(
  limit: number,
  offset: number,
  order: 'asc' | 'desc' = 'desc',
  producer?: string | null
): Promise<BlockRow[]> {
  const pool = getPool();
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const params: Array<string | number> = [limit, offset];
  const where = producer ? 'WHERE producer = $3' : '';
  if (producer) {
    params.push(producer);
  }
  const result = await pool.query(
    `
    SELECT hash, height, parent_hash, producer, timestamp_ms, tx_count
    FROM blocks
    ${where}
    ORDER BY height ${direction}
    LIMIT $1 OFFSET $2
    `,
    params
  );
  return result.rows;
}

export async function getTransactionsPage(
  limit: number,
  offset: number,
  order: 'asc' | 'desc' = 'desc',
  filters?: { address?: string; status?: string }
): Promise<TransactionRow[]> {
  const pool = getPool();
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const clauses: string[] = [];
  const params: Array<string | number> = [limit, offset];
  let paramIndex = 3;

  if (filters?.address) {
    clauses.push(`(from_address = $${paramIndex} OR to_address = $${paramIndex})`);
    params.push(filters.address);
    paramIndex += 1;
  }

  if (filters?.status) {
    clauses.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex += 1;
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await pool.query(
    `
    SELECT hash, block_height, from_address, to_address, value, status
    FROM transactions
    ${where}
    ORDER BY block_height ${direction}, tx_index ${direction}
    LIMIT $1 OFFSET $2
    `,
    params
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
  offset: number,
  order: 'asc' | 'desc' = 'desc'
): Promise<TransactionRow[]> {
  const pool = getPool();
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const result = await pool.query(
    `
    SELECT hash, block_height, from_address, to_address, value, status
    FROM transactions
    WHERE block_height = $1
    ORDER BY tx_index ${direction}
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

export async function getAddressAnalysis(address: string): Promise<{
  sent_count: string;
  received_count: string;
  sent_value: string;
  received_value: string;
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT
      (SELECT COUNT(*) FROM transactions WHERE from_address = $1) AS sent_count,
      (SELECT COUNT(*) FROM transactions WHERE to_address = $1) AS received_count,
      (SELECT COALESCE(SUM(value::numeric), 0) FROM transactions WHERE from_address = $1) AS sent_value,
      (SELECT COALESCE(SUM(value::numeric), 0) FROM transactions WHERE to_address = $1) AS received_value
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
  offset: number,
  order: 'asc' | 'desc' = 'desc'
): Promise<TransactionRow[]> {
  const pool = getPool();
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const result = await pool.query(
    `
    SELECT hash, block_height, from_address, to_address, value, status
    FROM transactions
    WHERE from_address = $1 OR to_address = $1
    ORDER BY block_height ${direction}, tx_index ${direction}
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
      WHERE height > 0  -- Exclude genesis block (timestamp=0 skews average)
      ORDER BY height DESC
      LIMIT 100
    ),
    recent_txs AS (
      SELECT COUNT(*) AS tx_count
      FROM transactions
      WHERE block_height >= (SELECT MIN(height) FROM recent_blocks)
    ),
    total_accounts AS (
      SELECT COUNT(*) AS total FROM accounts
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
      (SELECT total FROM total_accounts) AS active_addresses
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

export async function getStatsSeries(): Promise<{
  block_time_ms: Array<{ label: string; value: number }>;
  tps: Array<{ label: string; value: number }>;
  active_addresses: Array<{ label: string; value: number }>;
}> {
  const pool = getPool();

  // Block time series: last 20 blocks
  const btResult = await pool.query(`
    WITH recent_blocks AS (
      SELECT height, timestamp_ms
      FROM blocks
      WHERE height > 0
      ORDER BY height DESC
      LIMIT 20
    )
    SELECT height,
      timestamp_ms,
      COALESCE(timestamp_ms - LAG(timestamp_ms) OVER (ORDER BY height), 0) AS block_time_ms
    FROM recent_blocks
    ORDER BY height ASC
  `);

  const block_time_ms = btResult.rows.map((row) => ({
    label: String(row.height),
    value: Number(row.block_time_ms ?? 0),
  }));

  // Tx & address series: last 20 blocks that have transactions
  const txResult = await pool.query(`
    WITH active_blocks AS (
      SELECT DISTINCT block_height
      FROM transactions
      ORDER BY block_height DESC
      LIMIT 20
    ),
    tx_counts AS (
      SELECT block_height, COUNT(*)::int AS tx_count
      FROM transactions
      WHERE block_height IN (SELECT block_height FROM active_blocks)
      GROUP BY block_height
    ),
    address_counts AS (
      SELECT block_height, COUNT(DISTINCT addr)::int AS active
      FROM (
        SELECT block_height, from_address AS addr FROM transactions
        UNION ALL
        SELECT block_height, to_address AS addr FROM transactions
      ) a
      WHERE block_height IN (SELECT block_height FROM active_blocks)
      GROUP BY block_height
    )
    SELECT
      t.block_height AS height,
      t.tx_count,
      COALESCE(a.active, 0) AS active_addresses
    FROM tx_counts t
    LEFT JOIN address_counts a ON a.block_height = t.block_height
    ORDER BY t.block_height ASC
  `);

  const tps = txResult.rows.map((row) => ({
    label: String(row.height),
    value: Number(row.tx_count ?? 0),
  }));

  const active_addresses = txResult.rows.map((row) => ({
    label: String(row.height),
    value: Number(row.active_addresses ?? 0),
  }));

  return { block_time_ms, tps, active_addresses };
}

export async function getTokensPage(
  limit: number,
  offset: number,
  order: 'asc' | 'desc' = 'desc'
): Promise<Array<{ address: string; name: string | null; symbol: string | null; decimals: number | null; total_supply: string | null; last_seen_block: string | null }>> {
  const pool = getPool();
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const result = await pool.query(
    `
    SELECT address, name, symbol, decimals, total_supply, last_seen_block
    FROM tokens
    ORDER BY last_seen_block ${direction} NULLS LAST
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );
  return result.rows;
}

export async function getTokenByAddress(address: string): Promise<{
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  total_supply: string | null;
  last_seen_block: string | null;
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT address, name, symbol, decimals, total_supply, last_seen_block
    FROM tokens
    WHERE address = $1
    LIMIT 1
    `,
    [address]
  );
  return result.rows[0] ?? null;
}

export async function getTokenTransfers(
  tokenAddress: string,
  limit: number,
  offset: number,
  order: 'asc' | 'desc' = 'desc'
): Promise<Array<{ tx_hash: string; block_height: string; from_address: string; to_address: string; value: string }>> {
  const pool = getPool();
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const result = await pool.query(
    `
    SELECT tx_hash, block_height, from_address, to_address, value
    FROM token_transfers
    WHERE token_address = $1
    ORDER BY block_height ${direction}, log_index ${direction}
    LIMIT $2 OFFSET $3
    `,
    [tokenAddress, limit, offset]
  );
  return result.rows;
}

export async function getTokenHolders(
  tokenAddress: string,
  limit: number
): Promise<Array<{ address: string; balance: string }> | null> {
  const pool = getPool();
  const token = await pool.query(
    `SELECT address FROM tokens WHERE address = $1 LIMIT 1`,
    [tokenAddress]
  );
  if (token.rowCount === 0) {
    return null;
  }

  const result = await pool.query(
    `
    SELECT address, SUM(balance)::numeric AS balance
    FROM (
      SELECT to_address AS address, value::numeric AS balance
      FROM token_transfers
      WHERE token_address = $1
      UNION ALL
      SELECT from_address AS address, -value::numeric AS balance
      FROM token_transfers
      WHERE token_address = $1
    ) balances
    GROUP BY address
    HAVING SUM(balance) > 0
    ORDER BY SUM(balance) DESC
    LIMIT $2
    `,
    [tokenAddress, limit]
  );

  return result.rows.map((row) => ({
    address: row.address,
    balance: row.balance.toString(),
  }));
}

export async function getTokenTransfersByAddress(
  address: string,
  limit: number,
  offset: number,
  order: 'asc' | 'desc' = 'desc'
): Promise<Array<{
  tx_hash: string;
  block_height: string;
  token_address: string;
  from_address: string;
  to_address: string;
  value: string;
  token_name: string | null;
  token_symbol: string | null;
  token_decimals: number | null;
}>> {
  const pool = getPool();
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const result = await pool.query(
    `
    SELECT tt.tx_hash, tt.block_height, tt.token_address, tt.from_address, tt.to_address, tt.value,
           t.name AS token_name, t.symbol AS token_symbol, t.decimals AS token_decimals
    FROM token_transfers tt
    LEFT JOIN tokens t ON t.address = tt.token_address
    WHERE tt.from_address = $1 OR tt.to_address = $1
    ORDER BY tt.block_height ${direction}, tt.log_index ${direction}
    LIMIT $2 OFFSET $3
    `,
    [address, limit, offset]
  );
  return result.rows;
}

export async function getContractByAddress(
  address: string
): Promise<{
  creator_tx_hash: string | null;
  created_at_block: string | null;
  code_hash: string | null;
  is_verified: boolean;
} | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT creator_tx_hash, created_at_block, code_hash, is_verified FROM contracts WHERE address = $1 LIMIT 1`,
    [address]
  );
  return result.rows[0] ?? null;
}
