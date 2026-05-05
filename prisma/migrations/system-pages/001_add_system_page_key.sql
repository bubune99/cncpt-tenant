-- Migration: add `system_key` column + `SystemPageKey` enum to `pages`.
--
-- Backs the per-tenant customizable system pages feature (404 / 500 /
-- maintenance / coming-soon). Each tenant can have at most one Page row per
-- system_key; that row's blocks override the platform default when rendered.
--
-- Idempotent: safe to re-run. Does NOT touch existing rows. Existing rows
-- (including the 42 NULL-tenant orphans) get system_key = NULL automatically
-- and continue to behave as normal user-authored pages.
--
-- Apply:
--   psql "$DATABASE_URL" -f prisma/migrations/system-pages/001_add_system_page_key.sql
-- Or via Prisma:
--   npx prisma db execute --file prisma/migrations/system-pages/001_add_system_page_key.sql --schema prisma/cms/schema.prisma
--
-- After applying, regenerate the Prisma client:
--   npx prisma generate --schema prisma/cms/schema.prisma

BEGIN;

-- 1. Create the SystemPageKey enum (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SystemPageKey') THEN
    CREATE TYPE "SystemPageKey" AS ENUM (
      'NOT_FOUND',
      'SERVER_ERROR',
      'MAINTENANCE',
      'COMING_SOON'
    );
  END IF;
END$$;

-- 2. Add the nullable column. NULL means "this is a normal user-authored
--    page", non-null means "this is a tenant override for a system page".
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS system_key "SystemPageKey";

-- 3. Compound unique on (tenant_id, system_key). Postgres treats NULLs as
--    distinct in unique indexes by default, so this only constrains rows
--    where system_key IS NOT NULL — exactly the "at most one of each system
--    page per tenant" semantics we want.
CREATE UNIQUE INDEX IF NOT EXISTS pages_tenant_id_system_key_key
  ON pages (tenant_id, system_key);

-- 4. Index for the (rare) lookup path: "give me the not-found page for this
--    tenant". The unique index above already covers (tenant_id, system_key)
--    queries, so a separate index on system_key alone supports global
--    diagnostics queries (e.g. "how many tenants customised 404?").
CREATE INDEX IF NOT EXISTS pages_system_key_idx
  ON pages (system_key);

COMMIT;
