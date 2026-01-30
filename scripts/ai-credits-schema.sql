-- AI Credits System Schema
-- Hybrid model: monthly credits (from tier, capped rollover) + purchased credits (never expire)

-- ============================================
-- 1. AI Credit Balances
-- ============================================
CREATE TABLE IF NOT EXISTS ai_credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (either user_id OR subdomain_id for team pool)
  user_id VARCHAR(255),
  subdomain_id INTEGER REFERENCES subdomains(id) ON DELETE CASCADE,

  -- Split balances
  monthly_balance INTEGER NOT NULL DEFAULT 0,      -- From tier allocation, has rollover cap
  purchased_balance INTEGER NOT NULL DEFAULT 0,    -- From credit packs, NEVER expires

  -- Lifetime stats
  lifetime_allocated INTEGER NOT NULL DEFAULT 0,   -- Total monthly credits received
  lifetime_purchased INTEGER NOT NULL DEFAULT 0,   -- Total credits bought
  lifetime_used INTEGER NOT NULL DEFAULT 0,        -- Total credits consumed

  -- Monthly allocation tracking
  last_allocation_date DATE,
  monthly_allocation_amount INTEGER DEFAULT 0,     -- Current tier's monthly amount
  rollover_cap INTEGER DEFAULT 0,                  -- Max monthly balance can roll to

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints: must be user OR subdomain, not both
  CONSTRAINT ai_balance_owner_check CHECK (
    (user_id IS NOT NULL AND subdomain_id IS NULL) OR
    (user_id IS NULL AND subdomain_id IS NOT NULL)
  ),
  CONSTRAINT ai_balance_user_unique UNIQUE(user_id),
  CONSTRAINT ai_balance_subdomain_unique UNIQUE(subdomain_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_credit_balances_user ON ai_credit_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_balances_subdomain ON ai_credit_balances(subdomain_id);

-- ============================================
-- 2. AI Credit Transactions (Audit Log)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  user_id VARCHAR(255),
  subdomain_id INTEGER REFERENCES subdomains(id) ON DELETE SET NULL,

  -- Transaction type
  type VARCHAR(50) NOT NULL, -- 'allocation', 'purchase', 'usage', 'refund', 'rollover', 'expired', 'transfer'

  -- Amounts (positive = credits in, negative = credits out)
  monthly_amount INTEGER DEFAULT 0,
  purchased_amount INTEGER DEFAULT 0,

  -- Balance after transaction
  monthly_balance_after INTEGER NOT NULL,
  purchased_balance_after INTEGER NOT NULL,

  -- Context
  feature VARCHAR(50),          -- 'chat', 'content_generation', 'image_generation', etc.
  model_tier VARCHAR(50),       -- 'standard', 'pro', 'premium'
  description TEXT,
  reference_id VARCHAR(255),    -- Stripe payment ID, message ID, etc.
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_transactions_user ON ai_credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_subdomain ON ai_credit_transactions(subdomain_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_type ON ai_credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_created ON ai_credit_transactions(created_at DESC);

-- ============================================
-- 3. AI Credit Packs (Purchasable)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Credits
  credits INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,  -- Extra credits as purchase incentive

  -- Pricing
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Stripe integration
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  -- Display
  badge VARCHAR(50),           -- 'popular', 'best_value', etc.
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Availability
  min_tier VARCHAR(50) DEFAULT 'free',  -- Minimum subscription tier to purchase
  show_in_onboarding BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. AI Feature Costs
-- ============================================
CREATE TABLE IF NOT EXISTS ai_feature_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  feature VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general', -- 'chat', 'content', 'image', 'utility'

  -- Cost
  base_cost INTEGER NOT NULL,             -- Base credits per use
  unit_type VARCHAR(50) DEFAULT 'request', -- 'request', 'message', 'image', '1k_tokens'

  -- Access control
  min_tier VARCHAR(50) DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. AI Model Tiers
-- ============================================
CREATE TABLE IF NOT EXISTS ai_model_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Credit multiplier
  credit_multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,

  -- Available models in this tier
  models JSONB NOT NULL DEFAULT '[]',

  -- Access control
  min_tier VARCHAR(50) DEFAULT 'free',
  is_default BOOLEAN DEFAULT false,

  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. Seed Default Data
-- ============================================

-- Seed AI Feature Costs
INSERT INTO ai_feature_costs (feature, display_name, description, category, base_cost, unit_type, min_tier) VALUES
  ('chat', 'AI Chat', 'Interactive AI assistant chat', 'chat', 1, 'message', 'free'),
  ('chat_with_context', 'AI Chat with Page Context', 'Chat with current page as context', 'chat', 2, 'message', 'free'),
  ('content_generation', 'Content Generation', 'Generate blog posts, articles, pages', 'content', 5, 'request', 'starter'),
  ('content_rewrite', 'Content Rewrite', 'Improve or rewrite existing content', 'content', 3, 'request', 'free'),
  ('content_expand', 'Content Expansion', 'Expand on existing content', 'content', 4, 'request', 'starter'),
  ('content_summarize', 'Summarization', 'Summarize long content', 'content', 2, 'request', 'free'),
  ('seo_meta', 'SEO Meta Generation', 'Generate meta titles and descriptions', 'content', 2, 'request', 'free'),
  ('seo_keywords', 'Keyword Suggestions', 'AI-powered keyword research', 'content', 3, 'request', 'starter'),
  ('image_generation', 'Image Generation', 'Generate images with AI', 'image', 10, 'image', 'starter'),
  ('image_edit', 'Image Editing', 'AI-powered image modifications', 'image', 5, 'image', 'pro'),
  ('image_background', 'Background Removal', 'Remove image backgrounds', 'image', 3, 'image', 'starter'),
  ('translation', 'Translation', 'Translate content to other languages', 'utility', 3, 'request', 'starter'),
  ('grammar_check', 'Grammar Check', 'Check and fix grammar issues', 'utility', 1, 'request', 'free'),
  ('tone_adjust', 'Tone Adjustment', 'Adjust content tone and style', 'utility', 2, 'request', 'free')
ON CONFLICT (feature) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  base_cost = EXCLUDED.base_cost,
  min_tier = EXCLUDED.min_tier,
  updated_at = NOW();

-- Seed AI Model Tiers
INSERT INTO ai_model_tiers (name, display_name, description, credit_multiplier, models, min_tier, is_default, sort_order) VALUES
  ('standard', 'Standard', 'Fast and efficient for everyday tasks', 1.0,
   '["gpt-4o-mini", "claude-3-haiku-20240307"]'::jsonb, 'free', false, 1),
  ('pro', 'Pro', 'Balanced quality and speed for most use cases', 2.0,
   '["gpt-4o", "claude-3-5-sonnet-20241022"]'::jsonb, 'free', true, 2),
  ('premium', 'Premium', 'Maximum quality for complex tasks', 3.0,
   '["gpt-4-turbo", "claude-3-opus-20240229"]'::jsonb, 'pro', false, 3)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  credit_multiplier = EXCLUDED.credit_multiplier,
  models = EXCLUDED.models,
  min_tier = EXCLUDED.min_tier,
  is_default = EXCLUDED.is_default,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Seed Credit Packs (Stripe prices to be added later)
INSERT INTO ai_credit_packs (name, display_name, description, credits, bonus_credits, price_cents, badge, is_popular, sort_order, show_in_onboarding) VALUES
  ('starter', 'Starter Pack', 'Get started with AI features', 500, 0, 500, NULL, false, 1, true),
  ('popular', 'Growth Pack', 'Most popular choice', 2000, 200, 1500, 'popular', true, 2, true),
  ('pro', 'Pro Pack', 'For power users', 5000, 750, 3500, 'best_value', false, 3, true),
  ('enterprise', 'Enterprise Pack', 'Maximum credits', 15000, 3000, 9900, NULL, false, 4, false)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  price_cents = EXCLUDED.price_cents,
  badge = EXCLUDED.badge,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  show_in_onboarding = EXCLUDED.show_in_onboarding,
  updated_at = NOW();

-- ============================================
-- 7. Update subscription_tiers with AI credit limits
-- ============================================
UPDATE subscription_tiers SET
  limits = limits || '{"ai_credits_monthly": 50, "ai_credits_rollover_cap": 100, "ai_features": ["chat", "content_rewrite", "content_summarize", "seo_meta", "grammar_check", "tone_adjust"]}'::jsonb
WHERE name = 'free';

UPDATE subscription_tiers SET
  limits = limits || '{"ai_credits_monthly": 200, "ai_credits_rollover_cap": 400, "ai_features": ["chat", "chat_with_context", "content_generation", "content_rewrite", "content_expand", "content_summarize", "seo_meta", "seo_keywords", "image_generation", "image_background", "translation", "grammar_check", "tone_adjust"]}'::jsonb
WHERE name = 'starter';

UPDATE subscription_tiers SET
  limits = limits || '{"ai_credits_monthly": 1000, "ai_credits_rollover_cap": 2000, "ai_features": ["chat", "chat_with_context", "content_generation", "content_rewrite", "content_expand", "content_summarize", "seo_meta", "seo_keywords", "image_generation", "image_edit", "image_background", "translation", "grammar_check", "tone_adjust"]}'::jsonb
WHERE name = 'pro';

UPDATE subscription_tiers SET
  limits = limits || '{"ai_credits_monthly": 5000, "ai_credits_rollover_cap": 10000, "ai_features": "*"}'::jsonb
WHERE name = 'enterprise';

-- ============================================
-- 8. Output summary
-- ============================================
SELECT 'AI Feature Costs' as table_name, COUNT(*) as count FROM ai_feature_costs
UNION ALL
SELECT 'AI Model Tiers', COUNT(*) FROM ai_model_tiers
UNION ALL
SELECT 'AI Credit Packs', COUNT(*) FROM ai_credit_packs;
