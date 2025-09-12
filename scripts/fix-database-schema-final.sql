-- Fix password_hash constraint and create missing tenant_content table
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Create tenant_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS tenant_content (
    id SERIAL PRIMARY KEY,
    subdomain_id INTEGER REFERENCES subdomains(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    content_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_content_subdomain_id ON tenant_content(subdomain_id);
