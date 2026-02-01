BEGIN;

-- Transactions query patterns
CREATE INDEX IF NOT EXISTS idx_txs_block_height_tx_index ON transactions(block_height DESC, tx_index DESC);
CREATE INDEX IF NOT EXISTS idx_txs_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_txs_from_block ON transactions(from_address, block_height DESC);
CREATE INDEX IF NOT EXISTS idx_txs_to_block ON transactions(to_address, block_height DESC);

-- Events lookup by tx hash
CREATE INDEX IF NOT EXISTS idx_events_tx_hash ON events(tx_hash);

-- Blocks query by producer
CREATE INDEX IF NOT EXISTS idx_blocks_producer ON blocks(producer);

COMMIT;
