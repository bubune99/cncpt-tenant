-- Rollback for 001_add_system_page_key.sql.
-- Drops the unique constraint, the index, the column, and the enum type.
-- Idempotent: safe to re-run.

BEGIN;

DROP INDEX IF EXISTS pages_tenant_id_system_key_key;
DROP INDEX IF EXISTS pages_system_key_idx;

ALTER TABLE pages
  DROP COLUMN IF EXISTS system_key;

DROP TYPE IF EXISTS "SystemPageKey";

COMMIT;
