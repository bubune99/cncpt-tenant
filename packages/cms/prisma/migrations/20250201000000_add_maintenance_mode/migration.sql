-- Add maintenance mode fields to subdomains table
-- This allows site owners to restrict public access to their storefront

ALTER TABLE "subdomains" ADD COLUMN IF NOT EXISTS "maintenance_mode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subdomains" ADD COLUMN IF NOT EXISTS "maintenance_message" TEXT;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS "idx_subdomains_maintenance_mode" ON "subdomains" ("maintenance_mode");
