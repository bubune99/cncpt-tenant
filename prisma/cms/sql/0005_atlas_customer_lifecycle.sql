-- Atlas Redesign G05: Customer lifecycle stage
-- Idempotent — safe to run multiple times

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_lifecycle_stage') THEN
    CREATE TYPE customer_lifecycle_stage AS ENUM ('NEW','RETURNING','LOYAL','VIP','LAPSED','CHURNED');
  END IF;
END $$;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifecycle_stage customer_lifecycle_stage NOT NULL DEFAULT 'NEW';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifecycle_updated_at TIMESTAMPTZ;
