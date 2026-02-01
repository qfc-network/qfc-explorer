BEGIN;

CREATE TABLE IF NOT EXISTS tokens (
  address TEXT PRIMARY KEY,
  name TEXT,
  symbol TEXT,
  decimals INTEGER,
  total_supply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_block BIGINT
);

CREATE TABLE IF NOT EXISTS token_transfers (
  id BIGSERIAL PRIMARY KEY,
  token_address TEXT NOT NULL REFERENCES tokens(address) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL REFERENCES transactions(hash) ON DELETE CASCADE,
  block_height BIGINT NOT NULL,
  log_index INTEGER NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_token_transfers_token ON token_transfers(token_address, block_height DESC);
CREATE INDEX IF NOT EXISTS idx_token_transfers_from ON token_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_token_transfers_to ON token_transfers(to_address);

COMMIT;
