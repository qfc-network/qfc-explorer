-- 006_internal_transactions.sql
-- Internal transactions from debug_traceTransaction (CALL, CREATE, DELEGATECALL, etc.)

CREATE TABLE IF NOT EXISTS internal_transactions (
  tx_hash       TEXT NOT NULL,
  block_height  BIGINT NOT NULL,
  trace_index   INTEGER NOT NULL,
  call_type     TEXT,          -- CALL, STATICCALL, DELEGATECALL, CREATE, CREATE2, SELFDESTRUCT
  depth         INTEGER DEFAULT 0,
  from_address  TEXT,
  to_address    TEXT,
  value         TEXT DEFAULT '0',
  gas           TEXT,
  gas_used      TEXT,
  input         TEXT,
  output        TEXT,
  error         TEXT,
  PRIMARY KEY (tx_hash, trace_index, block_height)
);

CREATE INDEX IF NOT EXISTS idx_internal_txs_block ON internal_transactions (block_height DESC);
CREATE INDEX IF NOT EXISTS idx_internal_txs_from ON internal_transactions (from_address, block_height DESC);
CREATE INDEX IF NOT EXISTS idx_internal_txs_to ON internal_transactions (to_address, block_height DESC);

INSERT INTO migrations (name) VALUES ('006_internal_transactions.sql')
ON CONFLICT DO NOTHING;
