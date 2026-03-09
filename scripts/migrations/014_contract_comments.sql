-- Contract comments
CREATE TABLE IF NOT EXISTS contract_comments (
  id SERIAL PRIMARY KEY,
  contract_address TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) <= 2000),
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contract_comments_address ON contract_comments(contract_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_comments_user ON contract_comments(user_id);

-- Contract ratings (one per user per contract)
CREATE TABLE IF NOT EXISTS contract_ratings (
  contract_address TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (contract_address, user_id)
);
