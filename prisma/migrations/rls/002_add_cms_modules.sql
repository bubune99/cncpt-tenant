-- =============================================================================
-- Add CmsModule table for DB-driven feature toggles
-- =============================================================================
-- This is a global table (no tenant_id) - modules are platform-level.
-- No RLS needed since modules are shared across all tenants.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cms_modules (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  slug        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  description TEXT,
  icon        TEXT,
  version     TEXT        NOT NULL DEFAULT '1.0.0',
  manifest    JSONB       NOT NULL DEFAULT '{}',
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  "builtIn"   BOOLEAN     NOT NULL DEFAULT true,
  config      JSONB,
  "sortOrder" INTEGER     NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cms_modules_enabled ON cms_modules (enabled);
CREATE INDEX IF NOT EXISTS idx_cms_modules_slug ON cms_modules (slug);
