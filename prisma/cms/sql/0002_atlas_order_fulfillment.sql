-- Atlas Redesign G01: Order per-line sub-fulfillment steps
-- Idempotent — safe to run multiple times

-- Add configurable item fields to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS config_options JSONB;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS attachments JSONB;

-- Create fulfillment steps table
CREATE TABLE IF NOT EXISTS order_item_fulfillment_steps (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_item_id TEXT        NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  position      INTEGER     NOT NULL DEFAULT 0,
  completed     BOOLEAN     NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  completed_by  TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oifs_order_item ON order_item_fulfillment_steps(order_item_id);
