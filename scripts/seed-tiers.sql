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

-- Seed subscription tiers
-- Note: Replace the stripe_price_id values with actual Stripe price IDs
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
  -- Free Tier
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

  -- Pro Tier
  (
    'pro',
    'Pro',
    'For professionals and small teams',
    19,
    190,
    'USD',
    '["5 subdomains", "3 custom domains", "Team collaboration (5 members)", "Priority support", "5GB storage", "Advanced analytics", "Custom branding"]'::jsonb,
    '{"subdomains": 5, "custom_domains": 3, "team_members": 5, "storage_gb": 5, "pages": -1, "posts": -1}'::jsonb,
    14,
    1,
    true,
    'prod_XXXXXXXXX',  -- Replace with actual Stripe product ID
    'price_XXXXXXXXX', -- Replace with actual Stripe monthly price ID
    'price_YYYYYYYYY'  -- Replace with actual Stripe yearly price ID
  ),

  -- Enterprise Tier
  (
    'enterprise',
    'Enterprise',
    'For large organizations with advanced needs',
    99,
    990,
    'USD',
    '["Unlimited subdomains", "Unlimited custom domains", "Unlimited team members", "Dedicated support", "50GB storage", "Enterprise analytics", "White-label options", "SLA guarantee", "Priority feature requests"]'::jsonb,
    '{"subdomains": -1, "custom_domains": -1, "team_members": -1, "storage_gb": 50, "pages": -1, "posts": -1}'::jsonb,
    14,
    2,
    true,
    'prod_ZZZZZZZZZ',  -- Replace with actual Stripe product ID
    'price_ZZZZZZZZZ', -- Replace with actual Stripe monthly price ID
    'price_WWWWWWWWW'  -- Replace with actual Stripe yearly price ID
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
