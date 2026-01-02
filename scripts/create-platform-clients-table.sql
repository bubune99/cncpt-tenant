-- Create platform_clients table for managing all SaaS clients
-- This is the core registry for tracking client lifecycle

CREATE TABLE IF NOT EXISTS platform_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Stack Auth user ID of the client owner
    user_id TEXT NOT NULL,
    -- Business information
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval'
        CHECK (status IN ('pending_approval', 'trial', 'active', 'suspended', 'cancelled')),
    -- Subscription info (references subscription_tiers)
    tier_id UUID REFERENCES subscription_tiers(id) ON DELETE SET NULL,
    -- Trial tracking
    trial_started_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    -- Stripe integration (for future billing)
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    -- Link to their subdomain (set when CMS is provisioned)
    subdomain VARCHAR(255) UNIQUE,
    -- CMS provisioning status
    cms_provisioned BOOLEAN DEFAULT false,
    cms_provisioned_at TIMESTAMP WITH TIME ZONE,
    cms_instance_url VARCHAR(500),
    -- Admin notes
    notes TEXT,
    -- Request info (from client signup)
    request_message TEXT,
    requested_tier_id UUID REFERENCES subscription_tiers(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Approval tracking
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    -- Suspension tracking
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_by TEXT,
    suspension_reason TEXT,
    -- Cancellation tracking
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by TEXT,
    cancellation_reason TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_status ON platform_clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON platform_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_tier ON platform_clients(tier_id);
CREATE INDEX IF NOT EXISTS idx_clients_subdomain ON platform_clients(subdomain);
CREATE INDEX IF NOT EXISTS idx_clients_email ON platform_clients(contact_email);
CREATE INDEX IF NOT EXISTS idx_clients_created ON platform_clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_trial_ends ON platform_clients(trial_ends_at)
    WHERE status = 'trial';
CREATE INDEX IF NOT EXISTS idx_clients_pending ON platform_clients(created_at)
    WHERE status = 'pending_approval';

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_platform_clients_updated_at ON platform_clients;
CREATE TRIGGER trigger_update_platform_clients_updated_at
    BEFORE UPDATE ON platform_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_clients_updated_at();
