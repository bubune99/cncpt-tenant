-- Create subscription_tiers table for configurable pricing plans
-- This table stores all available subscription tiers that can be assigned to clients

CREATE TABLE IF NOT EXISTS subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    -- Features (JSON array of feature strings)
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Limits (JSON object with numeric limits, -1 = unlimited)
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Trial settings
    trial_days INTEGER DEFAULT 14,
    -- Display order in UI
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    -- Stripe integration (for future billing)
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    stripe_product_id VARCHAR(255),
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tiers_active ON subscription_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_tiers_sort ON subscription_tiers(sort_order);

-- Insert default tiers
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
