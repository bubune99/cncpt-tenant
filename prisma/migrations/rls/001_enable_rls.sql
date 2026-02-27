-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) for Multi-Tenant CMS
-- =============================================================================
-- This migration enables RLS on all tenant-scoped tables.
--
-- Pattern: Each tenant-scoped table has a `tenant_id` (INT, FK to subdomains.id).
-- RLS policies filter rows so tenants only see their own data.
--
-- Tenant context is set per-transaction via:
--   SET LOCAL app.current_tenant_id = '<tenant_id>';
--
-- SuperAdmin bypass: When app.is_super_admin = 'true', RLS is bypassed.
--
-- Compatible with Neon/pgbouncer transaction-mode pooling:
--   - Uses SET LOCAL (scoped to current transaction, auto-reset on completion)
--   - No session-level state leakage between pooled connections
-- =============================================================================

-- Helper function: Get current tenant ID from transaction-local setting
-- Returns NULL if not set (which means no rows match for tenant-scoped queries)
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS INT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::INT;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function: Check if current session is SuperAdmin
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(current_setting('app.is_super_admin', true), 'false') = 'true';
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- TENANT-SCOPED TABLES (have tenant_id column)
-- =============================================================================
-- These tables have a direct tenant_id FK to subdomains:
--   customers, settings, products, custom_fields, categories,
--   digital_assets, orders, order_workflows, pages, route_configs,
--   media, media_folders, blog_posts, blog_categories, blog_tags,
--   carts, discount_codes, wishlists, analytics_events (via tenantId),
--   tenant_posts, tenant_pages, tenant_settings, feedback
-- =============================================================================

-- 1. customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_customers ON customers;
CREATE POLICY tenant_isolation_customers ON customers
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_customers ON customers;
CREATE POLICY tenant_insert_customers ON customers
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 2. settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_settings ON settings;
CREATE POLICY tenant_isolation_settings ON settings
  USING (is_super_admin() OR tenant_id = current_tenant_id() OR tenant_id IS NULL);

DROP POLICY IF EXISTS tenant_insert_settings ON settings;
CREATE POLICY tenant_insert_settings ON settings
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 3. products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_products ON products;
CREATE POLICY tenant_isolation_products ON products
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_products ON products;
CREATE POLICY tenant_insert_products ON products
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 4. custom_fields
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_custom_fields ON custom_fields;
CREATE POLICY tenant_isolation_custom_fields ON custom_fields
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_custom_fields ON custom_fields;
CREATE POLICY tenant_insert_custom_fields ON custom_fields
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 5. categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_categories ON categories;
CREATE POLICY tenant_isolation_categories ON categories
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_categories ON categories;
CREATE POLICY tenant_insert_categories ON categories
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 6. digital_assets
ALTER TABLE digital_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_assets FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_digital_assets ON digital_assets;
CREATE POLICY tenant_isolation_digital_assets ON digital_assets
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_digital_assets ON digital_assets;
CREATE POLICY tenant_insert_digital_assets ON digital_assets
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 7. orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
CREATE POLICY tenant_isolation_orders ON orders
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_orders ON orders;
CREATE POLICY tenant_insert_orders ON orders
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 8. order_workflows
ALTER TABLE order_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_workflows FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_order_workflows ON order_workflows;
CREATE POLICY tenant_isolation_order_workflows ON order_workflows
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_order_workflows ON order_workflows;
CREATE POLICY tenant_insert_order_workflows ON order_workflows
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 9. pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_pages ON pages;
CREATE POLICY tenant_isolation_pages ON pages
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_pages ON pages;
CREATE POLICY tenant_insert_pages ON pages
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 10. route_configs
ALTER TABLE route_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_configs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_route_configs ON route_configs;
CREATE POLICY tenant_isolation_route_configs ON route_configs
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_route_configs ON route_configs;
CREATE POLICY tenant_insert_route_configs ON route_configs
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 11. media
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_media ON media;
CREATE POLICY tenant_isolation_media ON media
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_media ON media;
CREATE POLICY tenant_insert_media ON media
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 12. media_folders
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_folders FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_media_folders ON media_folders;
CREATE POLICY tenant_isolation_media_folders ON media_folders
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_media_folders ON media_folders;
CREATE POLICY tenant_insert_media_folders ON media_folders
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 13. blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_blog_posts ON blog_posts;
CREATE POLICY tenant_isolation_blog_posts ON blog_posts
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_blog_posts ON blog_posts;
CREATE POLICY tenant_insert_blog_posts ON blog_posts
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 14. blog_categories
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_blog_categories ON blog_categories;
CREATE POLICY tenant_isolation_blog_categories ON blog_categories
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_blog_categories ON blog_categories;
CREATE POLICY tenant_insert_blog_categories ON blog_categories
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 15. blog_tags
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_blog_tags ON blog_tags;
CREATE POLICY tenant_isolation_blog_tags ON blog_tags
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_blog_tags ON blog_tags;
CREATE POLICY tenant_insert_blog_tags ON blog_tags
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 16. carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_carts ON carts;
CREATE POLICY tenant_isolation_carts ON carts
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_carts ON carts;
CREATE POLICY tenant_insert_carts ON carts
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 17. discount_codes
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_discount_codes ON discount_codes;
CREATE POLICY tenant_isolation_discount_codes ON discount_codes
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_discount_codes ON discount_codes;
CREATE POLICY tenant_insert_discount_codes ON discount_codes
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 18. wishlists
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_wishlists ON wishlists;
CREATE POLICY tenant_isolation_wishlists ON wishlists
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_wishlists ON wishlists;
CREATE POLICY tenant_insert_wishlists ON wishlists
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 19. tenant_posts (legacy)
ALTER TABLE tenant_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_posts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_tenant_posts ON tenant_posts;
CREATE POLICY tenant_isolation_tenant_posts ON tenant_posts
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_tenant_posts ON tenant_posts;
CREATE POLICY tenant_insert_tenant_posts ON tenant_posts
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 20. tenant_pages (legacy)
ALTER TABLE tenant_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_pages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_tenant_pages ON tenant_pages;
CREATE POLICY tenant_isolation_tenant_pages ON tenant_pages
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_tenant_pages ON tenant_pages;
CREATE POLICY tenant_insert_tenant_pages ON tenant_pages
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 21. tenant_settings (legacy)
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_tenant_settings ON tenant_settings;
CREATE POLICY tenant_isolation_tenant_settings ON tenant_settings
  USING (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_tenant_settings ON tenant_settings;
CREATE POLICY tenant_insert_tenant_settings ON tenant_settings
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- 22. feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_feedback ON feedback;
CREATE POLICY tenant_isolation_feedback ON feedback
  USING (is_super_admin() OR tenant_id = current_tenant_id() OR tenant_id IS NULL);

DROP POLICY IF EXISTS tenant_insert_feedback ON feedback;
CREATE POLICY tenant_insert_feedback ON feedback
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id() OR tenant_id IS NULL);

-- =============================================================================
-- CHILD TABLES (no direct tenant_id, inherit isolation via parent FK)
-- =============================================================================
-- These tables don't have tenant_id directly but belong to tenant-scoped parents.
-- RLS on parent tables already prevents accessing child rows of other tenants'
-- parents. However, for defense-in-depth, we add RLS via subqueries on the
-- most sensitive child tables.
-- =============================================================================

-- order_items: isolated via orders.tenant_id
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_order_items ON order_items;
CREATE POLICY tenant_isolation_order_items ON order_items
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items."orderId"
        AND (orders.tenant_id = current_tenant_id())
    )
  );

-- shipments: isolated via orders.tenant_id
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_shipments ON shipments;
CREATE POLICY tenant_isolation_shipments ON shipments
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM orders WHERE orders.id = shipments."orderId"
        AND (orders.tenant_id = current_tenant_id())
    )
  );

-- cart_items: isolated via carts.tenant_id
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_cart_items ON cart_items;
CREATE POLICY tenant_isolation_cart_items ON cart_items
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM carts WHERE carts.id = cart_items."cartId"
        AND (carts.tenant_id = current_tenant_id())
    )
  );

-- wishlist_items: isolated via wishlists.tenant_id
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_wishlist_items ON wishlist_items;
CREATE POLICY tenant_isolation_wishlist_items ON wishlist_items
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM wishlists WHERE wishlists.id = wishlist_items."wishlistId"
        AND (wishlists.tenant_id = current_tenant_id())
    )
  );

-- product_images: isolated via products.tenant_id
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_product_images ON product_images;
CREATE POLICY tenant_isolation_product_images ON product_images
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM products WHERE products.id = product_images."productId"
        AND (products.tenant_id = current_tenant_id())
    )
  );

-- product_variants: isolated via products.tenant_id
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_product_variants ON product_variants;
CREATE POLICY tenant_isolation_product_variants ON product_variants
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM products WHERE products.id = product_variants."productId"
        AND (products.tenant_id = current_tenant_id())
    )
  );

-- product_options: isolated via products.tenant_id
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_product_options ON product_options;
CREATE POLICY tenant_isolation_product_options ON product_options
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM products WHERE products.id = product_options."productId"
        AND (products.tenant_id = current_tenant_id())
    )
  );

-- product_categories: isolated via products.tenant_id
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_product_categories ON product_categories;
CREATE POLICY tenant_isolation_product_categories ON product_categories
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM products WHERE products.id = product_categories."productId"
        AND (products.tenant_id = current_tenant_id())
    )
  );

-- product_custom_fields: isolated via products.tenant_id
ALTER TABLE product_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_custom_fields FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_product_custom_fields ON product_custom_fields;
CREATE POLICY tenant_isolation_product_custom_fields ON product_custom_fields
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM products WHERE products.id = product_custom_fields."productId"
        AND (products.tenant_id = current_tenant_id())
    )
  );

-- customer_addresses: isolated via customers.tenant_id
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_customer_addresses ON customer_addresses;
CREATE POLICY tenant_isolation_customer_addresses ON customer_addresses
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM customers WHERE customers.id = customer_addresses."customerId"
        AND (customers.tenant_id = current_tenant_id())
    )
  );

-- product_reviews: isolated via products.tenant_id
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_product_reviews ON product_reviews;
CREATE POLICY tenant_isolation_product_reviews ON product_reviews
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM products WHERE products.id = product_reviews."productId"
        AND (products.tenant_id = current_tenant_id())
    )
  );

-- discount_usages: isolated via discount_codes.tenant_id
ALTER TABLE discount_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_discount_usages ON discount_usages;
CREATE POLICY tenant_isolation_discount_usages ON discount_usages
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM discount_codes WHERE discount_codes.id = discount_usages."discountCodeId"
        AND (discount_codes.tenant_id = current_tenant_id())
    )
  );

-- blog_post_categories: isolated via blog_posts.tenant_id
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_blog_post_categories ON blog_post_categories;
CREATE POLICY tenant_isolation_blog_post_categories ON blog_post_categories
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM blog_posts WHERE blog_posts.id = blog_post_categories."postId"
        AND (blog_posts.tenant_id = current_tenant_id())
    )
  );

-- blog_post_tags: isolated via blog_posts.tenant_id
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_blog_post_tags ON blog_post_tags;
CREATE POLICY tenant_isolation_blog_post_tags ON blog_post_tags
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM blog_posts WHERE blog_posts.id = blog_post_tags."postId"
        AND (blog_posts.tenant_id = current_tenant_id())
    )
  );

-- blog_comments: isolated via blog_posts.tenant_id
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_blog_comments ON blog_comments;
CREATE POLICY tenant_isolation_blog_comments ON blog_comments
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM blog_posts WHERE blog_posts.id = blog_comments."postId"
        AND (blog_posts.tenant_id = current_tenant_id())
    )
  );

-- order_workflow_stages: isolated via order_workflows.tenant_id
ALTER TABLE order_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_workflow_stages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_order_workflow_stages ON order_workflow_stages;
CREATE POLICY tenant_isolation_order_workflow_stages ON order_workflow_stages
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM order_workflows WHERE order_workflows.id = order_workflow_stages."workflowId"
        AND (order_workflows.tenant_id = current_tenant_id())
    )
  );

-- order_progress: isolated via orders.tenant_id
ALTER TABLE order_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_progress FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_order_progress ON order_progress;
CREATE POLICY tenant_isolation_order_progress ON order_progress
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_progress."orderId"
        AND (orders.tenant_id = current_tenant_id())
    )
  );

-- payments: isolated via orders (via orderId)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
CREATE POLICY tenant_isolation_payments ON payments
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM orders WHERE orders.id = payments."orderId"
        AND (orders.tenant_id = current_tenant_id())
    )
  );

-- license_keys: isolated via digital_assets.tenant_id
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_keys FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_license_keys ON license_keys;
CREATE POLICY tenant_isolation_license_keys ON license_keys
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM digital_assets WHERE digital_assets.id = license_keys."digitalAssetId"
        AND (digital_assets.tenant_id = current_tenant_id())
    )
  );

-- digital_downloads: isolated via digital_assets.tenant_id
ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_downloads FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_digital_downloads ON digital_downloads;
CREATE POLICY tenant_isolation_digital_downloads ON digital_downloads
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM digital_assets WHERE digital_assets.id = digital_downloads."digitalAssetId"
        AND (digital_assets.tenant_id = current_tenant_id())
    )
  );

-- stock_reservations: isolated via orders.tenant_id
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_stock_reservations ON stock_reservations;
CREATE POLICY tenant_isolation_stock_reservations ON stock_reservations
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM orders WHERE orders.id = stock_reservations."orderId"
        AND (orders.tenant_id = current_tenant_id())
    )
  );

-- back_in_stock_subscriptions: isolated via products.tenant_id
ALTER TABLE back_in_stock_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE back_in_stock_subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_back_in_stock ON back_in_stock_subscriptions;
CREATE POLICY tenant_isolation_back_in_stock ON back_in_stock_subscriptions
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM products WHERE products.id = back_in_stock_subscriptions."productId"
        AND (products.tenant_id = current_tenant_id())
    )
  );

-- media_usage: isolated via media.tenant_id
ALTER TABLE media_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_usage FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_media_usage ON media_usage;
CREATE POLICY tenant_isolation_media_usage ON media_usage
  USING (
    is_super_admin() OR EXISTS (
      SELECT 1 FROM media WHERE media.id = media_usage."mediaId"
        AND (media.tenant_id = current_tenant_id())
    )
  );

-- =============================================================================
-- GLOBAL TABLES (no RLS needed - platform-level or shared)
-- =============================================================================
-- These tables are NOT tenant-scoped and remain globally accessible:
--   users, roles, role_assignments, user_permissions, audit_logs,
--   api_keys, api_key_usage, addresses, mcp_servers,
--   product_option_values, product_variant_option_values,
--   variant_custom_field_values, ai_conversations, ai_messages,
--   ai_votes, ai_streams, ai_documents, ai_suggestions,
--   primitives, plugins, workflows, workflow_nodes,
--   primitive_executions, workflow_executions, workflow_templates,
--   workflow_steps, workflow_logs, email_campaigns, email_recipients,
--   email_subscribers, email_templates, puck_templates,
--   email_automations, email_automation_steps, email_automation_enrollments,
--   email_automation_enrollment_steps, email_segments, email_segment_members,
--   email_links, email_link_clicks, email_ab_tests, subscriptions,
--   forms, form_submissions, gift_cards, gift_card_transactions,
--   review_votes, notifications, email_queue_items, site_settings,
--   page_bundles, bundle_assets, custom_animations, custom_components,
--   help_content, help_tours, admin_users, subdomains,
--   subscription_tiers, teams, team_members, team_invitations,
--   team_subdomains, super_admins, platform_activity_log, cms_modules
-- =============================================================================

-- =============================================================================
-- VERIFICATION QUERY (run after migration to verify RLS is enabled)
-- =============================================================================
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
