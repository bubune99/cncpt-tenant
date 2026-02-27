-- =============================================================================
-- ROLLBACK: Disable RLS on all tables
-- =============================================================================
-- Run this to completely remove RLS policies and disable row-level security.
-- =============================================================================

-- Drop helper functions
DROP FUNCTION IF EXISTS current_tenant_id();
DROP FUNCTION IF EXISTS is_super_admin();

-- Tenant-scoped tables
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_customers ON customers;
DROP POLICY IF EXISTS tenant_insert_customers ON customers;

ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_settings ON settings;
DROP POLICY IF EXISTS tenant_insert_settings ON settings;

ALTER TABLE products DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_products ON products;
DROP POLICY IF EXISTS tenant_insert_products ON products;

ALTER TABLE custom_fields DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_custom_fields ON custom_fields;
DROP POLICY IF EXISTS tenant_insert_custom_fields ON custom_fields;

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_categories ON categories;
DROP POLICY IF EXISTS tenant_insert_categories ON categories;

ALTER TABLE digital_assets DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_digital_assets ON digital_assets;
DROP POLICY IF EXISTS tenant_insert_digital_assets ON digital_assets;

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
DROP POLICY IF EXISTS tenant_insert_orders ON orders;

ALTER TABLE order_workflows DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_order_workflows ON order_workflows;
DROP POLICY IF EXISTS tenant_insert_order_workflows ON order_workflows;

ALTER TABLE pages DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_pages ON pages;
DROP POLICY IF EXISTS tenant_insert_pages ON pages;

ALTER TABLE route_configs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_route_configs ON route_configs;
DROP POLICY IF EXISTS tenant_insert_route_configs ON route_configs;

ALTER TABLE media DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_media ON media;
DROP POLICY IF EXISTS tenant_insert_media ON media;

ALTER TABLE media_folders DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_media_folders ON media_folders;
DROP POLICY IF EXISTS tenant_insert_media_folders ON media_folders;

ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_blog_posts ON blog_posts;
DROP POLICY IF EXISTS tenant_insert_blog_posts ON blog_posts;

ALTER TABLE blog_categories DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_blog_categories ON blog_categories;
DROP POLICY IF EXISTS tenant_insert_blog_categories ON blog_categories;

ALTER TABLE blog_tags DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_blog_tags ON blog_tags;
DROP POLICY IF EXISTS tenant_insert_blog_tags ON blog_tags;

ALTER TABLE carts DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_carts ON carts;
DROP POLICY IF EXISTS tenant_insert_carts ON carts;

ALTER TABLE discount_codes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_discount_codes ON discount_codes;
DROP POLICY IF EXISTS tenant_insert_discount_codes ON discount_codes;

ALTER TABLE wishlists DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_wishlists ON wishlists;
DROP POLICY IF EXISTS tenant_insert_wishlists ON wishlists;

ALTER TABLE tenant_posts DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tenant_posts ON tenant_posts;
DROP POLICY IF EXISTS tenant_insert_tenant_posts ON tenant_posts;

ALTER TABLE tenant_pages DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tenant_pages ON tenant_pages;
DROP POLICY IF EXISTS tenant_insert_tenant_pages ON tenant_pages;

ALTER TABLE tenant_settings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tenant_settings ON tenant_settings;
DROP POLICY IF EXISTS tenant_insert_tenant_settings ON tenant_settings;

ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_feedback ON feedback;
DROP POLICY IF EXISTS tenant_insert_feedback ON feedback;

-- Child tables
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_order_items ON order_items;

ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_shipments ON shipments;

ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_cart_items ON cart_items;

ALTER TABLE wishlist_items DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_wishlist_items ON wishlist_items;

ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_product_images ON product_images;

ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_product_variants ON product_variants;

ALTER TABLE product_options DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_product_options ON product_options;

ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_product_categories ON product_categories;

ALTER TABLE product_custom_fields DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_product_custom_fields ON product_custom_fields;

ALTER TABLE customer_addresses DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_customer_addresses ON customer_addresses;

ALTER TABLE product_reviews DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_product_reviews ON product_reviews;

ALTER TABLE discount_usages DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_discount_usages ON discount_usages;

ALTER TABLE blog_post_categories DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_blog_post_categories ON blog_post_categories;

ALTER TABLE blog_post_tags DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_blog_post_tags ON blog_post_tags;

ALTER TABLE blog_comments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_blog_comments ON blog_comments;

ALTER TABLE order_workflow_stages DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_order_workflow_stages ON order_workflow_stages;

ALTER TABLE order_progress DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_order_progress ON order_progress;

ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_payments ON payments;

ALTER TABLE license_keys DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_license_keys ON license_keys;

ALTER TABLE digital_downloads DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_digital_downloads ON digital_downloads;

ALTER TABLE stock_reservations DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_stock_reservations ON stock_reservations;

ALTER TABLE back_in_stock_subscriptions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_back_in_stock ON back_in_stock_subscriptions;

ALTER TABLE media_usage DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_media_usage ON media_usage;
