BEGIN;

-- Add token_type to tokens table (erc20, erc721, erc1155)
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS token_type TEXT NOT NULL DEFAULT 'erc20';

-- Add token_id to token_transfers (null for ERC-20, tokenId for ERC-721/1155)
ALTER TABLE token_transfers ADD COLUMN IF NOT EXISTS token_id TEXT;

-- Token balances: real-time snapshot (replaces aggregating from transfers)
CREATE TABLE IF NOT EXISTS token_balances (
  token_address TEXT NOT NULL REFERENCES tokens(address) ON DELETE CASCADE,
  holder_address TEXT NOT NULL,
  token_id TEXT,          -- null for ERC-20, tokenId for ERC-721/1155
  balance TEXT NOT NULL DEFAULT '0',
  last_updated_block BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (token_address, holder_address, COALESCE(token_id, ''))
);

CREATE INDEX IF NOT EXISTS idx_token_balances_holder ON token_balances(holder_address);
CREATE INDEX IF NOT EXISTS idx_token_balances_token ON token_balances(token_address, balance DESC);
CREATE INDEX IF NOT EXISTS idx_token_balances_nft ON token_balances(holder_address, token_address) WHERE token_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tokens_type ON tokens(token_type);
CREATE INDEX IF NOT EXISTS idx_token_transfers_token_id ON token_transfers(token_address, token_id) WHERE token_id IS NOT NULL;

-- Backfill token_balances from existing ERC-20 token_transfers
INSERT INTO token_balances (token_address, holder_address, token_id, balance, last_updated_block)
SELECT
  token_address,
  address AS holder_address,
  NULL AS token_id,
  SUM(amount)::text AS balance,
  MAX(block_height) AS last_updated_block
FROM (
  SELECT token_address, to_address AS address, value::numeric AS amount, block_height
  FROM token_transfers WHERE token_id IS NULL
  UNION ALL
  SELECT token_address, from_address AS address, -value::numeric AS amount, block_height
  FROM token_transfers WHERE token_id IS NULL
) t
GROUP BY token_address, address
HAVING SUM(amount) > 0
ON CONFLICT (token_address, holder_address, COALESCE(token_id, '')) DO UPDATE SET
  balance = EXCLUDED.balance,
  last_updated_block = EXCLUDED.last_updated_block,
  updated_at = NOW();

COMMIT;
