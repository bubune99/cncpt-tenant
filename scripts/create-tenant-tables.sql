-- Create tenant-specific content tables with proper isolation

-- Posts table for tenant content (blogs, articles, etc.)
CREATE TABLE IF NOT EXISTS tenant_posts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES subdomains(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  slug VARCHAR(255) NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, slug)
);

-- Pages table for tenant static pages
CREATE TABLE IF NOT EXISTS tenant_pages (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES subdomains(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  slug VARCHAR(255) NOT NULL,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, slug)
);

-- Settings table for tenant customization
CREATE TABLE IF NOT EXISTS tenant_settings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES subdomains(id) ON DELETE CASCADE UNIQUE,
  site_title VARCHAR(255),
  site_description TEXT,
  theme_color VARCHAR(7) DEFAULT '#0891b2',
  custom_css TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add id column to subdomains table if it doesn't exist
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_posts_tenant_id ON tenant_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_posts_slug ON tenant_posts(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_tenant_id ON tenant_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_slug ON tenant_pages(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);

-- Insert default settings for existing subdomains
INSERT INTO tenant_settings (tenant_id, site_title, site_description)
SELECT id, CONCAT(subdomain, ' Site'), CONCAT('Welcome to ', subdomain, '.', '${rootDomain}')
FROM subdomains
WHERE id NOT IN (SELECT tenant_id FROM tenant_settings WHERE tenant_id IS NOT NULL)
ON CONFLICT (tenant_id) DO NOTHING;
