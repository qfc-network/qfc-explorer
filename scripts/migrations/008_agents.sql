-- Agent Registry tables for explorer

CREATE TABLE IF NOT EXISTS agents (
  agent_id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  agent_address TEXT NOT NULL,
  permissions INTEGER[] NOT NULL DEFAULT '{}',
  daily_limit TEXT NOT NULL DEFAULT '0',
  max_per_tx TEXT NOT NULL DEFAULT '0',
  deposit TEXT NOT NULL DEFAULT '0',
  spent_today TEXT NOT NULL DEFAULT '0',
  last_spend_day TEXT NOT NULL DEFAULT '0',
  registered_at TEXT NOT NULL DEFAULT '0',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner);
CREATE INDEX IF NOT EXISTS idx_agents_agent_address ON agents(agent_address);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(active);
CREATE INDEX IF NOT EXISTS idx_agents_registered_at ON agents(registered_at DESC);

CREATE TABLE IF NOT EXISTS session_keys (
  key_address TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  owner TEXT NOT NULL,
  expires_at TEXT NOT NULL DEFAULT '0',
  revoked BOOLEAN NOT NULL DEFAULT false,
  permissions INTEGER[] NOT NULL DEFAULT '{}',
  last_activity_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_keys_agent_id ON session_keys(agent_id);
CREATE INDEX IF NOT EXISTS idx_session_keys_owner ON session_keys(owner);
CREATE INDEX IF NOT EXISTS idx_session_keys_expires_at ON session_keys(expires_at);

CREATE TABLE IF NOT EXISTS agent_transactions (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  block_height TEXT NOT NULL,
  from_addr TEXT NOT NULL,
  to_addr TEXT,
  value TEXT NOT NULL DEFAULT '0',
  method TEXT NOT NULL DEFAULT '',
  status INTEGER NOT NULL DEFAULT 1,
  timestamp TEXT NOT NULL DEFAULT '0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_txs_agent_id ON agent_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_txs_block_height ON agent_transactions(block_height DESC);
CREATE INDEX IF NOT EXISTS idx_agent_txs_timestamp ON agent_transactions(timestamp DESC);

CREATE TABLE IF NOT EXISTS agent_spending (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount TEXT NOT NULL DEFAULT '0',
  tx_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(agent_id, date)
);

CREATE INDEX IF NOT EXISTS idx_agent_spending_agent_id ON agent_spending(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_spending_date ON agent_spending(date DESC);
