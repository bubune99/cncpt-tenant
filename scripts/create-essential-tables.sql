-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table for user sessions
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on sessions for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Update subdomains table to link to users (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subdomains') THEN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subdomains' AND column_name = 'user_id') THEN
      ALTER TABLE subdomains ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  ELSE
    -- Create subdomains table if it doesn't exist
    CREATE TABLE subdomains (
      id SERIAL PRIMARY KEY,
      subdomain VARCHAR(255) UNIQUE NOT NULL,
      emoji VARCHAR(10) NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_subdomains_user_id ON subdomains(user_id);
    CREATE INDEX idx_subdomains_subdomain ON subdomains(subdomain);
  END IF;
END $$;

-- Adding tenant-related tables for multi-tenant functionality
-- Create tenant_settings table for subdomain customization
CREATE TABLE IF NOT EXISTS tenant_settings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
  site_title VARCHAR(255) DEFAULT 'My Site',
  site_description TEXT DEFAULT 'Welcome to my site!',
  primary_color VARCHAR(7) DEFAULT '#3b82f6',
  secondary_color VARCHAR(7) DEFAULT '#64748b',
  logo_url TEXT,
  favicon_url TEXT,
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Create tenant_pages table for custom pages
CREATE TABLE IF NOT EXISTS tenant_pages (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Create tenant_posts table for blog functionality
CREATE TABLE IF NOT EXISTS tenant_posts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_tenant_id ON tenant_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_slug ON tenant_pages(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_tenant_posts_tenant_id ON tenant_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_posts_slug ON tenant_posts(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_tenant_posts_published ON tenant_posts(tenant_id, is_published, published_at);
