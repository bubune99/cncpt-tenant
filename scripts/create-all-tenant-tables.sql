-- Create tenant_settings table
CREATE TABLE IF NOT EXISTS tenant_settings (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
    site_title VARCHAR(255) NOT NULL DEFAULT 'My Site',
    site_description TEXT DEFAULT 'Welcome to my site',
    theme_color VARCHAR(7) DEFAULT '#000000',
    custom_css TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id)
);

-- Create tenant_pages table
CREATE TABLE IF NOT EXISTS tenant_pages (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    slug VARCHAR(255) NOT NULL,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, slug)
);

-- Create tenant_posts table
CREATE TABLE IF NOT EXISTS tenant_posts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    slug VARCHAR(255) NOT NULL,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, slug)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_tenant_id ON tenant_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_slug ON tenant_pages(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_tenant_posts_tenant_id ON tenant_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_posts_slug ON tenant_posts(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_tenant_posts_published ON tenant_posts(tenant_id, published);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_published ON tenant_pages(tenant_id, published);
