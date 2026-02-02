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

-- Seed subscription tiers (Per-Site Pricing Model)
-- Stripe Price IDs from FAR CNCPT account (acct_1SUVC586FlZ1gJyi)
-- Updated: Per-site pricing with bandwidth, storage, media, AI credits, and team seats
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
  -- Starter Tier ($25/mo per site)
  (
    'starter',
    'Starter',
    'Perfect for small sites and blogs',
    25,
    250,
    'USD',
    '["2 team seats", "Custom domain", "25GB bandwidth", "1GB storage", "3GB media storage", "300 AI credits/mo", "Email support", "Basic analytics"]'::jsonb,
    '{"team_seats": 2, "extra_seat_price": 15, "bandwidth_gb": 25, "storage_gb": 1, "media_storage_gb": 3, "ai_credits_monthly": 300, "ai_credits_rollover_cap": 600, "custom_domains": 1, "pages": -1, "posts": -1}'::jsonb,
    7,
    1,
    true,
    'prod_Tu11whCDlqQkwX',
    'price_1SwCzW86FlZ1gJyi5iW9z0i9',
    NULL
  ),

  -- Growth Tier ($49/mo per site)
  (
    'growth',
    'Growth',
    'For growing sites and small teams',
    49,
    490,
    'USD',
    '["3 team seats", "Custom domain", "100GB bandwidth", "5GB storage", "15GB media storage", "1,500 AI credits/mo", "Email support", "Standard analytics"]'::jsonb,
    '{"team_seats": 3, "extra_seat_price": 15, "bandwidth_gb": 100, "storage_gb": 5, "media_storage_gb": 15, "ai_credits_monthly": 1500, "ai_credits_rollover_cap": 3000, "custom_domains": 1, "pages": -1, "posts": -1}'::jsonb,
    14,
    2,
    true,
    'prod_Tu11v8anIzWfGT',
    'price_1SwCzX86FlZ1gJyibD4kaoCd',
    NULL
  ),

  -- Pro Tier ($99/mo per site)
  (
    'pro',
    'Pro',
    'For professionals and agencies',
    99,
    990,
    'USD',
    '["6 team seats", "Custom domain", "300GB bandwidth", "30GB storage", "75GB media storage", "7,500 AI credits/mo", "Priority support", "Advanced analytics"]'::jsonb,
    '{"team_seats": 6, "extra_seat_price": 15, "bandwidth_gb": 300, "storage_gb": 30, "media_storage_gb": 75, "ai_credits_monthly": 7500, "ai_credits_rollover_cap": 15000, "custom_domains": 1, "pages": -1, "posts": -1}'::jsonb,
    14,
    3,
    true,
    'prod_Tu11NnLUYzMarg',
    'price_1SwCzY86FlZ1gJyiqpfzTeK1',
    NULL
  ),

  -- Business Tier ($349/mo per site)
  (
    'business',
    'Business',
    'For high-traffic sites and enterprises',
    349,
    3490,
    'USD',
    '["25 team seats", "Custom domain", "1TB bandwidth", "300GB storage", "750GB media storage", "75,000 AI credits/mo", "Dedicated support", "Advanced analytics", "Priority feature requests"]'::jsonb,
    '{"team_seats": 25, "extra_seat_price": 12, "bandwidth_gb": 1000, "storage_gb": 300, "media_storage_gb": 750, "ai_credits_monthly": 75000, "ai_credits_rollover_cap": 150000, "custom_domains": 1, "pages": -1, "posts": -1}'::jsonb,
    14,
    4,
    true,
    'prod_Tu1156ourANJoG',
    'price_1SwCzY86FlZ1gJyiEH50aG09',
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
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
  updated_at = NOW();

-- Deactivate old 'free' and 'enterprise' tiers if they exist (replaced by new model)
UPDATE subscription_tiers SET is_active = false WHERE name IN ('free', 'enterprise') AND name NOT IN ('starter', 'growth', 'pro', 'business');

-- Output the created tiers
SELECT id, name, display_name, price_monthly,
       limits->>'team_seats' as team_seats,
       limits->>'bandwidth_gb' as bandwidth_gb,
       limits->>'ai_credits_monthly' as ai_credits
FROM subscription_tiers
WHERE is_active = true
ORDER BY sort_order;
