-- Seed demo subdomain with sample data
-- This creates a public demo subdomain that allows unauthenticated access

-- First, create the demo subdomain (using 'system' as the owner for demo purposes)
-- Note: user_id is set to 'demo-system' - this is a special ID for the demo
INSERT INTO subdomains (user_id, subdomain, emoji, site_name, contact_email, onboarding_completed)
VALUES ('demo-system', 'demo', '🎯', 'CNCPT Demo Store', 'demo@cncptweb.com', true)
ON CONFLICT (subdomain) DO UPDATE SET
  site_name = 'CNCPT Demo Store',
  contact_email = 'demo@cncptweb.com',
  onboarding_completed = true;

-- Get the demo subdomain ID for foreign keys
DO $$
DECLARE
  demo_tenant_id INTEGER;
BEGIN
  SELECT id INTO demo_tenant_id FROM subdomains WHERE subdomain = 'demo';

  -- Create tenant settings for demo
  INSERT INTO tenant_settings (subdomain, site_name, site_description, contact_email)
  VALUES ('demo', 'CNCPT Demo Store', 'Explore the full CNCPT CMS experience with this interactive demo.', 'demo@cncptweb.com')
  ON CONFLICT (subdomain) DO UPDATE SET
    site_name = 'CNCPT Demo Store',
    site_description = 'Explore the full CNCPT CMS experience with this interactive demo.';

  -- Insert demo blog posts if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'posts') THEN
    INSERT INTO posts (subdomain, title, slug, content, excerpt, status, author_id, created_at)
    VALUES
      ('demo', 'Welcome to CNCPT CMS', 'welcome-to-cncpt-cms', '<p>Welcome to the CNCPT CMS demo! This is a sample blog post to showcase our content management features.</p><p>With CNCPT, you can:</p><ul><li>Create and manage blog posts</li><li>Organize content with categories and tags</li><li>Schedule posts for future publication</li><li>Optimize for SEO with meta tags</li></ul>', 'Explore the powerful features of CNCPT CMS', 'published', 'demo-system', NOW()),
      ('demo', 'Building Your Online Store', 'building-your-online-store', '<p>Setting up an e-commerce store with CNCPT is straightforward. Our platform provides all the tools you need to manage products, track orders, and grow your business.</p>', 'Learn how to set up and manage your online store', 'published', 'demo-system', NOW() - INTERVAL '2 days'),
      ('demo', 'AI-Powered Content Creation', 'ai-powered-content-creation', '<p>CNCPT integrates AI features to help you create content faster. Generate product descriptions, blog posts, and marketing copy with our built-in AI assistant.</p>', 'Discover how AI can enhance your content workflow', 'published', 'demo-system', NOW() - INTERVAL '5 days')
    ON CONFLICT (subdomain, slug) DO NOTHING;
  END IF;

  -- Insert demo products if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    INSERT INTO products (subdomain, name, slug, description, price, compare_at_price, stock, status, created_at)
    VALUES
      ('demo', 'Premium Wireless Headphones', 'premium-wireless-headphones', 'High-quality wireless headphones with noise cancellation and 30-hour battery life.', 19999, 24999, 50, 'active', NOW()),
      ('demo', 'Smart Home Hub', 'smart-home-hub', 'Control all your smart devices from one central hub. Compatible with Alexa and Google Home.', 12999, NULL, 100, 'active', NOW()),
      ('demo', 'Organic Coffee Blend', 'organic-coffee-blend', 'Premium organic coffee beans sourced from sustainable farms. 500g bag.', 2499, 2999, 200, 'active', NOW()),
      ('demo', 'Fitness Tracker Pro', 'fitness-tracker-pro', 'Advanced fitness tracker with heart rate monitoring, GPS, and sleep analysis.', 14999, 17999, 75, 'active', NOW()),
      ('demo', 'Eco-Friendly Water Bottle', 'eco-friendly-water-bottle', 'Stainless steel water bottle that keeps drinks cold for 24 hours. BPA-free.', 3499, NULL, 300, 'active', NOW())
    ON CONFLICT (subdomain, slug) DO NOTHING;
  END IF;

  RAISE NOTICE 'Demo subdomain seeded successfully with tenant_id: %', demo_tenant_id;
END $$;
