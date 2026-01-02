-- Platform Admin Backend - All Tables
-- Run this script to create all tables needed for the platform admin backend
-- Order matters: tiers must exist before clients (foreign key dependency)

-- ============================================
-- 1. SUBSCRIPTION TIERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    trial_days INTEGER DEFAULT 14,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    stripe_product_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiers_active ON subscription_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_tiers_sort ON subscription_tiers(sort_order);

-- Default tiers
INSERT INTO subscription_tiers (name, display_name, description, price_monthly, features, limits, trial_days, sort_order) VALUES
    ('starter', 'Starter', 'Perfect for small businesses getting started', 15.00,
     '["Visual Page Builder", "5 Pages", "Basic Templates", "Email Support", "SSL Certificate"]'::jsonb,
     '{"storage_gb": 5, "pages": 5, "posts": 50, "custom_domains": 1, "team_members": 1}'::jsonb,
     14, 1),
    ('professional', 'Professional', 'For growing businesses that need more', 29.00,
     '["Everything in Starter", "Unlimited Pages", "All Templates", "Priority Support", "Analytics Dashboard", "Custom Branding"]'::jsonb,
     '{"storage_gb": 25, "pages": -1, "posts": -1, "custom_domains": 3, "team_members": 5}'::jsonb,
     14, 2),
    ('enterprise', 'Enterprise', 'For large organizations with advanced needs', 99.00,
     '["Everything in Professional", "Dedicated Support", "SLA Guarantee", "White-label Option", "API Access", "Advanced Integrations"]'::jsonb,
     '{"storage_gb": 100, "pages": -1, "posts": -1, "custom_domains": -1, "team_members": -1}'::jsonb,
     30, 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. PLATFORM CLIENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS platform_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval'
        CHECK (status IN ('pending_approval', 'trial', 'active', 'suspended', 'cancelled')),
    tier_id UUID REFERENCES subscription_tiers(id) ON DELETE SET NULL,
    trial_started_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    subdomain VARCHAR(255) UNIQUE,
    cms_provisioned BOOLEAN DEFAULT false,
    cms_provisioned_at TIMESTAMP WITH TIME ZONE,
    cms_instance_url VARCHAR(500),
    notes TEXT,
    request_message TEXT,
    requested_tier_id UUID REFERENCES subscription_tiers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_by TEXT,
    suspension_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by TEXT,
    cancellation_reason TEXT
);

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

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_platform_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_platform_clients_updated_at ON platform_clients;
CREATE TRIGGER trigger_update_platform_clients_updated_at
    BEFORE UPDATE ON platform_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_clients_updated_at();

-- ============================================
-- 3. CLIENT ACTIVITY LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS client_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by TEXT NOT NULL,
    performed_by_email VARCHAR(255),
    previous_value JSONB,
    new_value JSONB,
    notes TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_client ON client_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON client_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_performed_by ON client_activity_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_activity_date ON client_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_client_timeline
    ON client_activity_log(client_id, created_at DESC);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify all tables were created:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('subscription_tiers', 'platform_clients', 'client_activity_log');
