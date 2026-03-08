-- 007_address_labels.sql
-- Human-readable labels for known addresses (exchanges, projects, system contracts, etc.)

CREATE TABLE IF NOT EXISTS address_labels (
  address      TEXT PRIMARY KEY,
  label        TEXT NOT NULL,
  category     TEXT,           -- e.g. exchange, defi, system, token, nft, bridge
  description  TEXT,
  website      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_address_labels_category ON address_labels (category);
CREATE INDEX IF NOT EXISTS idx_address_labels_label_tsvector ON address_labels USING gin(to_tsvector('simple', label));

INSERT INTO migrations (name) VALUES ('007_address_labels.sql')
ON CONFLICT DO NOTHING;
