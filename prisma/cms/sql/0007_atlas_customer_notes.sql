-- Atlas Redesign G10: Structured customer notes timeline
-- Idempotent — safe to run multiple times

CREATE TABLE IF NOT EXISTS customer_notes (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  author_id   TEXT,
  content     TEXT        NOT NULL,
  pinned      BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created  ON customer_notes(created_at);
