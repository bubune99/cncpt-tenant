-- Atlas redesign — add user-selectable brand preset + density to tenant_settings.
-- Idempotent: safe to run repeatedly. Apply on deploy (pre-`prisma generate`),
-- e.g. psql "$DATABASE_URL" -f prisma/cms/sql/0001_atlas_brand_preset.sql

ALTER TABLE tenant_settings
  ADD COLUMN IF NOT EXISTS brand_preset VARCHAR(20) NOT NULL DEFAULT 'marigold';

ALTER TABLE tenant_settings
  ADD COLUMN IF NOT EXISTS density VARCHAR(20) NOT NULL DEFAULT 'regular';
