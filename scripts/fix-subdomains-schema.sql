-- Fix subdomains table schema for full compatibility
-- This migration ensures all required columns exist

-- 1. Add updated_at if missing
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Add user_id if missing (as TEXT for Stack Auth)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subdomains' AND column_name = 'user_id') THEN
    ALTER TABLE subdomains ADD COLUMN user_id TEXT;
  END IF;
END $$;

-- 3. Add configuration columns if missing
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS site_name VARCHAR(255);
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS site_description TEXT;
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS primary_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);

-- 4. Add onboarding fields if missing
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS use_case VARCHAR(50);
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS industry VARCHAR(50);
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS referral_source VARCHAR(100);
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS team_size VARCHAR(20);
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS tech_experience VARCHAR(20);
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE subdomains ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- 5. Ensure tenant_settings table exists with correct schema
CREATE TABLE IF NOT EXISTS tenant_settings (
  id SERIAL PRIMARY KEY,
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  site_name VARCHAR(255),
  site_description TEXT DEFAULT 'Welcome to my site',
  contact_email VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'UTC',
  primary_language VARCHAR(10) DEFAULT 'en',
  primary_color VARCHAR(7) DEFAULT '#3b82f6',
  secondary_color VARCHAR(7) DEFAULT '#64748b',
  logo_url TEXT,
  favicon_url TEXT,
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add subdomain column to tenant_settings if using old schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'subdomain') THEN
    ALTER TABLE tenant_settings ADD COLUMN subdomain VARCHAR(255);
  END IF;
END $$;

-- 7. Create index on user_id
CREATE INDEX IF NOT EXISTS idx_subdomains_user_id ON subdomains(user_id);

-- 8. Create cms_features table if not exists
CREATE TABLE IF NOT EXISTS cms_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  minimum_tier VARCHAR(50) DEFAULT 'free',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create subdomain_features table if not exists
CREATE TABLE IF NOT EXISTS subdomain_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain_id INTEGER NOT NULL,
  feature_id UUID NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disabled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(subdomain_id, feature_id)
);

-- 10. Verify schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subdomains'
ORDER BY ordinal_position;
