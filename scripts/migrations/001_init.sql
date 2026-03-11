BEGIN;

CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
  hash TEXT PRIMARY KEY,
  height BIGINT NOT NULL UNIQUE,
  parent_hash TEXT,
  state_root TEXT,
  transactions_root TEXT,
  receipts_root TEXT,
  producer TEXT,
  contribution_score BIGINT,
  timestamp_ms BIGINT NOT NULL,
  gas_limit BIGINT,
  gas_used BIGINT,
  extra_data BYTEA,
  tx_count INTEGER NOT NULL DEFAULT 0,
  base_fee_per_gas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  hash TEXT PRIMARY KEY,
  block_hash TEXT NOT NULL REFERENCES blocks(hash) ON DELETE CASCADE,
  block_height BIGINT NOT NULL,
  tx_index INTEGER NOT NULL,
  type TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT,
  value TEXT NOT NULL,
  nonce BIGINT NOT NULL,
  gas_limit BIGINT NOT NULL,
  gas_price TEXT NOT NULL,
  status TEXT NOT NULL,
  input_data TEXT,
  max_fee_per_gas TEXT,
  max_priority_fee_per_gas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  address TEXT PRIMARY KEY,
  balance TEXT NOT NULL DEFAULT '0',
  nonce BIGINT NOT NULL DEFAULT 0,
  first_seen_block BIGINT,
  last_seen_block BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
  address TEXT PRIMARY KEY,
  creator_tx_hash TEXT REFERENCES transactions(hash) ON DELETE SET NULL,
  created_at_block BIGINT,
  code_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT NOT NULL REFERENCES transactions(hash) ON DELETE CASCADE,
  block_height BIGINT NOT NULL,
  log_index INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  topic0 TEXT,
  topic1 TEXT,
  topic2 TEXT,
  topic3 TEXT,
  data BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS indexer_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocks_height ON blocks(height);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp_ms);

CREATE INDEX IF NOT EXISTS idx_txs_block_height ON transactions(block_height);
CREATE INDEX IF NOT EXISTS idx_txs_from ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_txs_to ON transactions(to_address);

CREATE INDEX IF NOT EXISTS idx_accounts_last_seen ON accounts(last_seen_block);

CREATE INDEX IF NOT EXISTS idx_events_block_height ON events(block_height);
CREATE INDEX IF NOT EXISTS idx_events_contract ON events(contract_address);

COMMIT;

-- Token prices (from external oracle/CoinGecko)
CREATE TABLE IF NOT EXISTS token_prices (
  token_address TEXT NOT NULL PRIMARY KEY,
  price_usd     NUMERIC(30,10) NOT NULL DEFAULT 0,
  market_cap_usd NUMERIC(30,2),
  change_24h    NUMERIC(10,4),
  volume_24h    NUMERIC(30,2),
  coingecko_id  TEXT,
  source        TEXT NOT NULL DEFAULT 'manual',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
