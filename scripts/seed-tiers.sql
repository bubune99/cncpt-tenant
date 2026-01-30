-- Seed Default Subscription Tiers
-- Run this script to set up the default subscription tiers for the platform
-- Replace STRIPE_PRICE_ID_XXX with actual Stripe price IDs after creating products in Stripe

-- First, add subscription fields to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier_id') THEN
    ALTER TABLE users ADD COLUMN tier_id UUID REFERENCES subscription_tiers(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
    ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'none';
  END IF;
END $$;

-- Create subdomains table if not exists
CREATE TABLE IF NOT EXISTS subdomains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  emoji VARCHAR(10) DEFAULT '🌐',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_subdomains_user_id ON subdomains(user_id);

-- Create subscription_events table for logging
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  stripe_event_id VARCHAR(255),
  tier_id UUID REFERENCES subscription_tiers(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

-- Create webhook_events table for idempotency tracking
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'processed',
  error_message TEXT
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at DESC);

-- Seed subscription tiers
-- Stripe Price IDs from FAR CNCPT account (acct_1SUVC586FlZ1gJyi)
INSERT INTO subscription_tiers (
  name,
  display_name,
  description,
  price_monthly,
  price_yearly,
  currency,
  features,
  limits,
  trial_days,
  sort_order,
  is_active,
  stripe_product_id,
  stripe_price_id_monthly,
  stripe_price_id_yearly
) VALUES
  -- Free Tier (no Stripe product needed)
  (
    'free',
    'Free',
    'Perfect for getting started',
    0,
    NULL,
    'USD',
    '["1 subdomain", "Basic analytics", "Community support", "100MB storage"]'::jsonb,
    '{"subdomains": 1, "custom_domains": 0, "team_members": 0, "storage_gb": 0.1, "pages": 5, "posts": 10}'::jsonb,
    0,
    0,
    true,
    NULL,
    NULL,
    NULL
  ),

  -- Starter Tier ($29/mo)
  (
    'starter',
    'Starter',
    'For individuals and hobbyists',
    29,
    290,
    'USD',
    '["3 subdomains", "1 custom domain", "Email support", "1GB storage", "Basic analytics"]'::jsonb,
    '{"subdomains": 3, "custom_domains": 1, "team_members": 0, "storage_gb": 1, "pages": 20, "posts": 50}'::jsonb,
    7,
    1,
    true,
    'prod_TZOuX1tIJ87uQb',
    'price_1ScG6x86FlZ1gJyiTBC0dvA4',
    NULL
  ),

  -- Pro Tier ($99/mo)
  (
    'pro',
    'Pro',
    'For professionals and small teams',
    99,
    990,
    'USD',
    '["10 subdomains", "5 custom domains", "Team collaboration (10 members)", "Priority support", "10GB storage", "Advanced analytics", "Custom branding"]'::jsonb,
    '{"subdomains": 10, "custom_domains": 5, "team_members": 10, "storage_gb": 10, "pages": -1, "posts": -1}'::jsonb,
    14,
    2,
    true,
    'prod_TZOu5v0urF9Icz',
    'price_1ScG7786FlZ1gJyiiiG8htnh',
    NULL
  ),

  -- Enterprise Tier ($299/mo)
  (
    'enterprise',
    'Enterprise',
    'For large organizations with advanced needs',
    299,
    2990,
    'USD',
    '["Unlimited subdomains", "Unlimited custom domains", "Unlimited team members", "Dedicated support", "50GB storage", "Enterprise analytics", "White-label options", "SLA guarantee", "Priority feature requests"]'::jsonb,
    '{"subdomains": -1, "custom_domains": -1, "team_members": -1, "storage_gb": 50, "pages": -1, "posts": -1}'::jsonb,
    14,
    3,
    true,
    'prod_TZOv3JqBtRkKmA',
    'price_1ScG7G86FlZ1gJyixljeGvMB',
    NULL
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  trial_days = EXCLUDED.trial_days,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Output the created tiers
SELECT id, name, display_name, price_monthly, limits->>'subdomains' as subdomain_limit
FROM subscription_tiers
ORDER BY sort_order;
