-- Atlas Redesign G06: Product pricing tiers + sale schedules
-- Idempotent — safe to run multiple times

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_tier_type') THEN
    CREATE TYPE pricing_tier_type AS ENUM ('QTY','MEMBER');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS product_pricing_tiers (
  id         TEXT               PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT               NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      TEXT               NOT NULL,
  min_qty    INTEGER            NOT NULL,
  max_qty    INTEGER,
  price      INTEGER            NOT NULL,
  type       pricing_tier_type  NOT NULL DEFAULT 'QTY',
  enabled    BOOLEAN            NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_tiers_product ON product_pricing_tiers(product_id);

CREATE TABLE IF NOT EXISTS product_sale_schedules (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT,
  sale_price INTEGER     NOT NULL,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  enabled    BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_schedules_product ON product_sale_schedules(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_schedules_dates ON product_sale_schedules(starts_at, ends_at);
