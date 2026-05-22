-- Atlas Redesign G-COORDINATOR: Loyalty fields + activity ledger
-- Idempotent: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- Add store credit and loyalty points to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_credit INT NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INT NOT NULL DEFAULT 0;

-- Create loyalty_activity_type enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loyalty_activity_type') THEN
    CREATE TYPE loyalty_activity_type AS ENUM (
      'EARNED_PURCHASE',
      'EARNED_REFERRAL',
      'EARNED_REVIEW',
      'REDEEMED',
      'ADJUSTED',
      'EXPIRED'
    );
  END IF;
END$$;

-- Create loyalty_activities table
CREATE TABLE IF NOT EXISTS loyalty_activities (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id   INT,
  type        loyalty_activity_type NOT NULL,
  points      INT NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS loyalty_activities_customer_id_idx ON loyalty_activities (customer_id);
CREATE INDEX IF NOT EXISTS loyalty_activities_tenant_id_idx ON loyalty_activities (tenant_id);
