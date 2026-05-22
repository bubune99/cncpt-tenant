-- Atlas Redesign G02: Analytics dashboards + widgets + templates
-- Idempotent — safe to run multiple times

CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id   INTEGER     REFERENCES subdomains(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  layout      JSONB,
  pinned_by   TEXT[]      DEFAULT '{}',
  shared_with TEXT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_tenant ON analytics_dashboards(tenant_id);

CREATE TABLE IF NOT EXISTS analytics_widgets (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dashboard_id TEXT        NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  viz_type     TEXT        NOT NULL,
  query        JSONB       NOT NULL,
  config       JSONB,
  position     JSONB       NOT NULL,
  template_id  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_widgets_dashboard ON analytics_widgets(dashboard_id);

CREATE TABLE IF NOT EXISTS analytics_widget_templates (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id   INTEGER,
  name        TEXT        NOT NULL,
  description TEXT,
  viz_type    TEXT        NOT NULL,
  query       JSONB       NOT NULL,
  config      JSONB,
  thumbnail   TEXT,
  category    TEXT,
  is_system   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_widget_templates_tenant ON analytics_widget_templates(tenant_id);
