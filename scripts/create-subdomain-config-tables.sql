-- Subdomain Configuration & Feature Toggle Tables
-- Run this to set up the enhanced subdomain configuration system

-- 1. Extend subdomains table with configuration fields
ALTER TABLE subdomains
ADD COLUMN IF NOT EXISTS site_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS site_description TEXT,
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS primary_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS use_case VARCHAR(50),
ADD COLUMN IF NOT EXISTS industry VARCHAR(50),
ADD COLUMN IF NOT EXISTS referral_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS team_size VARCHAR(20),
ADD COLUMN IF NOT EXISTS tech_experience VARCHAR(20),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create CMS features catalog table
CREATE TABLE IF NOT EXISTS cms_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'content', 'marketing', 'analytics', 'commerce', 'collaboration', 'developer'
  is_premium BOOLEAN DEFAULT false,
  minimum_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create subdomain feature settings (which features are enabled per subdomain)
CREATE TABLE IF NOT EXISTS subdomain_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain_id UUID NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES cms_features(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disabled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(subdomain_id, feature_id)
);

-- 4. Create feature usage tracking table
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain_id UUID NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES cms_features(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- 'view', 'create', 'edit', 'delete', 'export', etc.
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_subdomain_features_subdomain ON subdomain_features(subdomain_id);
CREATE INDEX IF NOT EXISTS idx_subdomain_features_feature ON subdomain_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_subdomain ON feature_usage(subdomain_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_created ON feature_usage(created_at DESC);

-- 5. Seed default CMS features
INSERT INTO cms_features (name, display_name, description, category, is_premium, minimum_tier, sort_order) VALUES
  -- Content features
  ('pages', 'Pages', 'Create and manage static pages', 'content', false, 'free', 1),
  ('blog', 'Blog Posts', 'Create and publish blog articles', 'content', false, 'free', 2),
  ('media_library', 'Media Library', 'Upload and manage images, videos, and files', 'content', false, 'free', 3),
  ('categories', 'Categories & Tags', 'Organize content with categories and tags', 'content', false, 'free', 4),
  ('rich_editor', 'Rich Text Editor', 'Advanced WYSIWYG content editing', 'content', false, 'free', 5),
  ('content_scheduling', 'Content Scheduling', 'Schedule posts for future publication', 'content', true, 'pro', 6),
  ('content_versioning', 'Version History', 'Track and restore content versions', 'content', true, 'pro', 7),

  -- Marketing features
  ('seo_tools', 'SEO Tools', 'Meta tags, sitemaps, and SEO optimization', 'marketing', false, 'free', 10),
  ('social_sharing', 'Social Sharing', 'Social media integration and sharing', 'marketing', false, 'free', 11),
  ('email_capture', 'Email Capture', 'Newsletter signup forms and lead capture', 'marketing', true, 'pro', 12),
  ('landing_pages', 'Landing Pages', 'Create marketing landing pages', 'marketing', true, 'pro', 13),
  ('ab_testing', 'A/B Testing', 'Test different content variations', 'marketing', true, 'enterprise', 14),

  -- Analytics features
  ('basic_analytics', 'Basic Analytics', 'Page views and visitor counts', 'analytics', false, 'free', 20),
  ('advanced_analytics', 'Advanced Analytics', 'Detailed traffic analysis and reports', 'analytics', true, 'pro', 21),
  ('conversion_tracking', 'Conversion Tracking', 'Track goals and conversions', 'analytics', true, 'pro', 22),
  ('custom_reports', 'Custom Reports', 'Build custom analytics dashboards', 'analytics', true, 'enterprise', 23),

  -- Commerce features
  ('products', 'Products', 'Product catalog management', 'commerce', true, 'pro', 30),
  ('orders', 'Orders', 'Order management and fulfillment', 'commerce', true, 'pro', 31),
  ('payments', 'Payments', 'Payment processing integration', 'commerce', true, 'pro', 32),
  ('subscriptions', 'Subscriptions', 'Recurring billing and memberships', 'commerce', true, 'enterprise', 33),
  ('discounts', 'Discounts & Coupons', 'Promotional codes and discounts', 'commerce', true, 'pro', 34),

  -- Collaboration features
  ('team_members', 'Team Members', 'Invite and manage team access', 'collaboration', true, 'pro', 40),
  ('roles_permissions', 'Roles & Permissions', 'Custom roles and access control', 'collaboration', true, 'pro', 41),
  ('comments', 'Comments', 'Content commenting and review workflow', 'collaboration', true, 'pro', 42),
  ('activity_log', 'Activity Log', 'Track team actions and changes', 'collaboration', true, 'enterprise', 43),

  -- Developer features
  ('api_access', 'API Access', 'REST and GraphQL API access', 'developer', true, 'pro', 50),
  ('webhooks', 'Webhooks', 'Event notifications to external services', 'developer', true, 'pro', 51),
  ('custom_code', 'Custom Code', 'Inject custom CSS and JavaScript', 'developer', true, 'pro', 52),
  ('headless_mode', 'Headless CMS', 'Use as headless CMS with custom frontend', 'developer', true, 'enterprise', 53)

ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_premium = EXCLUDED.is_premium,
  minimum_tier = EXCLUDED.minimum_tier,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 6. Create view for subdomain feature summary
CREATE OR REPLACE VIEW subdomain_feature_summary AS
SELECT
  s.id as subdomain_id,
  s.subdomain,
  s.use_case,
  s.industry,
  f.category,
  COUNT(sf.id) FILTER (WHERE sf.is_enabled = true) as enabled_count,
  COUNT(f.id) as total_count,
  array_agg(f.name) FILTER (WHERE sf.is_enabled = true) as enabled_features
FROM subdomains s
CROSS JOIN cms_features f
LEFT JOIN subdomain_features sf ON sf.subdomain_id = s.id AND sf.feature_id = f.id
WHERE f.is_active = true
GROUP BY s.id, s.subdomain, s.use_case, s.industry, f.category;

-- Output created features
SELECT name, display_name, category, is_premium, minimum_tier
FROM cms_features
ORDER BY category, sort_order;
