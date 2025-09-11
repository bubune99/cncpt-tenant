-- Create subdomains table to replace Redis storage
CREATE TABLE IF NOT EXISTS subdomains (
  id SERIAL PRIMARY KEY,
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster subdomain lookups
CREATE INDEX IF NOT EXISTS idx_subdomains_subdomain ON subdomains(subdomain);
