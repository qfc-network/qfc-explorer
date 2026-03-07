-- Migration 005: Daily statistics aggregation table
-- Stores pre-computed daily metrics for chart display (30/90/365 day views)

CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE PRIMARY KEY,
  tx_count BIGINT NOT NULL DEFAULT 0,
  active_addresses INTEGER NOT NULL DEFAULT 0,
  new_contracts INTEGER NOT NULL DEFAULT 0,
  total_gas_used NUMERIC NOT NULL DEFAULT 0,
  avg_gas_price NUMERIC NOT NULL DEFAULT 0,
  block_count INTEGER NOT NULL DEFAULT 0,
  avg_block_time_ms NUMERIC NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats (date DESC);

-- Backfill: block-level stats per day
INSERT INTO daily_stats (date, tx_count, block_count, total_gas_used, avg_block_time_ms)
SELECT
  (TO_TIMESTAMP(timestamp_ms / 1000.0) AT TIME ZONE 'UTC')::date AS date,
  COALESCE(SUM(tx_count), 0) AS tx_count,
  COUNT(*)::int AS block_count,
  COALESCE(SUM(gas_used::numeric), 0) AS total_gas_used,
  CASE
    WHEN COUNT(*) > 1 THEN
      (MAX(timestamp_ms) - MIN(timestamp_ms))::numeric / NULLIF(COUNT(*) - 1, 0)
    ELSE 0
  END AS avg_block_time_ms
FROM blocks
WHERE height > 0
GROUP BY (TO_TIMESTAMP(timestamp_ms / 1000.0) AT TIME ZONE 'UTC')::date
ON CONFLICT (date) DO UPDATE SET
  tx_count = EXCLUDED.tx_count,
  block_count = EXCLUDED.block_count,
  total_gas_used = EXCLUDED.total_gas_used,
  avg_block_time_ms = EXCLUDED.avg_block_time_ms;

-- Backfill: active addresses per day
UPDATE daily_stats ds SET active_addresses = sub.cnt
FROM (
  SELECT
    (TO_TIMESTAMP(b.timestamp_ms / 1000.0) AT TIME ZONE 'UTC')::date AS date,
    COUNT(DISTINCT addr)::int AS cnt
  FROM transactions t
  JOIN blocks b ON b.height = t.block_height
  CROSS JOIN LATERAL (VALUES (t.from_address), (t.to_address)) v(addr)
  WHERE addr IS NOT NULL
  GROUP BY (TO_TIMESTAMP(b.timestamp_ms / 1000.0) AT TIME ZONE 'UTC')::date
) sub
WHERE ds.date = sub.date;

-- Backfill: avg gas price per day
UPDATE daily_stats ds SET avg_gas_price = sub.avg_gp
FROM (
  SELECT
    (TO_TIMESTAMP(b.timestamp_ms / 1000.0) AT TIME ZONE 'UTC')::date AS date,
    AVG(t.gas_price::numeric) AS avg_gp
  FROM transactions t
  JOIN blocks b ON b.height = t.block_height
  GROUP BY (TO_TIMESTAMP(b.timestamp_ms / 1000.0) AT TIME ZONE 'UTC')::date
) sub
WHERE ds.date = sub.date;

-- Backfill: new contracts per day
UPDATE daily_stats ds SET new_contracts = sub.cnt
FROM (
  SELECT
    (TO_TIMESTAMP(b.timestamp_ms / 1000.0) AT TIME ZONE 'UTC')::date AS date,
    COUNT(*)::int AS cnt
  FROM contracts c
  JOIN blocks b ON b.height = c.created_at_block
  GROUP BY (TO_TIMESTAMP(b.timestamp_ms / 1000.0) AT TIME ZONE 'UTC')::date
) sub
WHERE ds.date = sub.date;
