-- Site Settings Table
-- Stores configuration for each tenant's site (CMS on Vercel and frontend on VPS)
-- Uses subdomain name as key (matches Redis subdomain storage)

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain VARCHAR(255) NOT NULL UNIQUE,

  -- General Settings
  site_title VARCHAR(255),
  site_tagline VARCHAR(500),
  site_description TEXT,
  visibility VARCHAR(50) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'maintenance')),

  -- Appearance Settings
  primary_color VARCHAR(7) DEFAULT '#3b82f6',
  secondary_color VARCHAR(7) DEFAULT '#6b7280',
  accent_color VARCHAR(7) DEFAULT '#10b981',
  font_heading VARCHAR(100) DEFAULT 'Inter',
  font_body VARCHAR(100) DEFAULT 'Inter',
  theme_preset VARCHAR(50) DEFAULT 'default',

  -- SEO Settings
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image_url TEXT,
  favicon_url TEXT,
  robots_txt TEXT,
  sitemap_enabled BOOLEAN DEFAULT true,

  -- Security Settings
  password_protected BOOLEAN DEFAULT false,
  password_hash TEXT,
  security_headers_enabled BOOLEAN DEFAULT true,

  -- Frontend VPS Settings (Dokploy)
  frontend_enabled BOOLEAN DEFAULT false,
  frontend_app_id VARCHAR(255),
  frontend_domain VARCHAR(255),
  frontend_status VARCHAR(50) DEFAULT 'not_deployed' CHECK (frontend_status IN ('not_deployed', 'deploying', 'running', 'stopped', 'error')),
  frontend_last_deployed_at TIMESTAMP WITH TIME ZONE,
  frontend_env_vars JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_subdomain ON site_settings(subdomain);
CREATE INDEX IF NOT EXISTS idx_site_settings_frontend_status ON site_settings(frontend_status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_timestamp();
