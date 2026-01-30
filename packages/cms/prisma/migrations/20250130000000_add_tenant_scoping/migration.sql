-- Add tenant_id columns to CMS content models for multi-tenancy support

-- BlogPost: Add tenant scoping
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "blog_posts_tenant_id_idx" ON "blog_posts"("tenant_id");

-- Drop old unique constraint on slug if exists and create tenant-scoped one
DROP INDEX IF EXISTS "blog_posts_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_tenant_id_slug_key" ON "blog_posts"("tenant_id", "slug");

-- Add foreign key to subdomains
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BlogCategory: Add tenant scoping
ALTER TABLE "blog_categories" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "blog_categories_tenant_id_idx" ON "blog_categories"("tenant_id");
DROP INDEX IF EXISTS "blog_categories_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "blog_categories_tenant_id_slug_key" ON "blog_categories"("tenant_id", "slug");
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BlogTag: Add tenant scoping
ALTER TABLE "blog_tags" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "blog_tags_tenant_id_idx" ON "blog_tags"("tenant_id");
DROP INDEX IF EXISTS "blog_tags_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "blog_tags_tenant_id_slug_key" ON "blog_tags"("tenant_id", "slug");
ALTER TABLE "blog_tags" ADD CONSTRAINT "blog_tags_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Page: Add tenant scoping
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "pages_tenant_id_idx" ON "pages"("tenant_id");
DROP INDEX IF EXISTS "pages_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "pages_tenant_id_slug_key" ON "pages"("tenant_id", "slug");
ALTER TABLE "pages" ADD CONSTRAINT "pages_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product: Add tenant scoping
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "products_tenant_id_idx" ON "products"("tenant_id");
DROP INDEX IF EXISTS "products_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "products_tenant_id_slug_key" ON "products"("tenant_id", "slug");
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Category (Product categories): Add tenant scoping
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "categories_tenant_id_idx" ON "categories"("tenant_id");
DROP INDEX IF EXISTS "categories_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "categories_tenant_id_slug_key" ON "categories"("tenant_id", "slug");
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Media: Add tenant scoping
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "media_tenant_id_idx" ON "media"("tenant_id");
ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MediaFolder: Add tenant scoping
ALTER TABLE "media_folders" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "media_folders_tenant_id_idx" ON "media_folders"("tenant_id");
DROP INDEX IF EXISTS "media_folders_parentId_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "media_folders_tenant_id_parentId_slug_key" ON "media_folders"("tenant_id", "parentId", "slug");
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Order: Add tenant scoping
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "orders_tenant_id_idx" ON "orders"("tenant_id");
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Customer: Add tenant scoping
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "customers_tenant_id_idx" ON "customers"("tenant_id");
DROP INDEX IF EXISTS "customers_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "customers_tenant_id_email_key" ON "customers"("tenant_id", "email");
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cart: Add tenant scoping
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "carts_tenant_id_idx" ON "carts"("tenant_id");
DROP INDEX IF EXISTS "carts_sessionId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "carts_tenant_id_sessionId_key" ON "carts"("tenant_id", "sessionId");
ALTER TABLE "carts" ADD CONSTRAINT "carts_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Wishlist: Add tenant scoping
ALTER TABLE "wishlists" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "wishlists_tenant_id_idx" ON "wishlists"("tenant_id");
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DiscountCode: Add tenant scoping
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "discount_codes_tenant_id_idx" ON "discount_codes"("tenant_id");
DROP INDEX IF EXISTS "discount_codes_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "discount_codes_tenant_id_code_key" ON "discount_codes"("tenant_id", "code");
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Setting: Add tenant scoping (null = global)
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "settings_tenant_id_idx" ON "settings"("tenant_id");
DROP INDEX IF EXISTS "settings_key_key";
CREATE UNIQUE INDEX IF NOT EXISTS "settings_tenant_id_key_key" ON "settings"("tenant_id", "key");
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RouteConfig: Add tenant scoping
ALTER TABLE "route_configs" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "route_configs_tenant_id_idx" ON "route_configs"("tenant_id");
DROP INDEX IF EXISTS "route_configs_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "route_configs_tenant_id_slug_key" ON "route_configs"("tenant_id", "slug");
ALTER TABLE "route_configs" ADD CONSTRAINT "route_configs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CustomField: Add tenant scoping
ALTER TABLE "custom_fields" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "custom_fields_tenant_id_idx" ON "custom_fields"("tenant_id");
DROP INDEX IF EXISTS "custom_fields_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "custom_fields_tenant_id_slug_key" ON "custom_fields"("tenant_id", "slug");
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DigitalAsset: Add tenant scoping
ALTER TABLE "digital_assets" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "digital_assets_tenant_id_idx" ON "digital_assets"("tenant_id");
ALTER TABLE "digital_assets" ADD CONSTRAINT "digital_assets_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OrderWorkflow: Add tenant scoping
ALTER TABLE "order_workflows" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
CREATE INDEX IF NOT EXISTS "order_workflows_tenant_id_idx" ON "order_workflows"("tenant_id");
DROP INDEX IF EXISTS "order_workflows_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "order_workflows_tenant_id_slug_key" ON "order_workflows"("tenant_id", "slug");
ALTER TABLE "order_workflows" ADD CONSTRAINT "order_workflows_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
