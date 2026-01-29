-- Subdomain Auth Configuration Table
-- Stores per-subdomain Stack Auth project credentials and branding settings
-- Each subdomain can have its own customer authentication system

CREATE TABLE IF NOT EXISTS subdomain_auth_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain VARCHAR(100) NOT NULL UNIQUE,

    -- Stack Auth project credentials
    stack_auth_project_id VARCHAR(255) NOT NULL,
    stack_auth_publishable_key VARCHAR(255) NOT NULL,
    stack_auth_secret_key TEXT, -- Should be encrypted at rest
    stack_auth_base_url VARCHAR(500), -- Self-hosted URL (optional)

    -- Branding (cached for SSR)
    branding_logo_url VARCHAR(500),
    branding_primary_color VARCHAR(7) DEFAULT '#0891b2',
    branding_name VARCHAR(255),

    -- Feature flags
    enable_social_auth BOOLEAN DEFAULT true,
    enable_magic_link BOOLEAN DEFAULT true,
    enable_password_auth BOOLEAN DEFAULT true,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255), -- User ID who created this config
    updated_by VARCHAR(255)  -- User ID who last updated
);

-- Index for fast subdomain lookup
CREATE INDEX IF NOT EXISTS idx_subdomain_auth_subdomain ON subdomain_auth_config(subdomain);

-- Add comment for documentation
COMMENT ON TABLE subdomain_auth_config IS 'Stores Stack Auth configuration per subdomain for customer authentication';
COMMENT ON COLUMN subdomain_auth_config.stack_auth_secret_key IS 'Encrypted server key - do not expose to client';
COMMENT ON COLUMN subdomain_auth_config.stack_auth_base_url IS 'Override URL for self-hosted Stack Auth instances';

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subdomain_auth_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subdomain_auth_config_updated_at ON subdomain_auth_config;
CREATE TRIGGER subdomain_auth_config_updated_at
    BEFORE UPDATE ON subdomain_auth_config
    FOR EACH ROW
    EXECUTE FUNCTION update_subdomain_auth_config_updated_at();
