# RLS (Row-Level Security) Migrations

## Overview

PostgreSQL Row-Level Security ensures tenant data isolation at the database level. Even if application code has bugs, one tenant cannot access another tenant's data.

## Architecture

### Two-Layer Defense

1. **Prisma Middleware** (`lib/cms/db/tenant-context.ts`) - Injects `tenantId` into all queries at the ORM level
2. **PostgreSQL RLS** (`001_enable_rls.sql`) - Enforces tenant isolation at the database level via policies

### How It Works

- Each request sets `app.current_tenant_id` via `SET LOCAL` inside a transaction
- RLS policies on tenant-scoped tables check `current_tenant_id()` against the row's `tenant_id`
- `SET LOCAL` is transaction-scoped, so it's safe with Neon/pgbouncer connection pooling
- SuperAdmin bypass via `app.is_super_admin = 'true'`

### Tables with RLS

**Direct tenant_id** (22 tables): customers, settings, products, custom_fields, categories, digital_assets, orders, order_workflows, pages, route_configs, media, media_folders, blog_posts, blog_categories, blog_tags, carts, discount_codes, wishlists, tenant_posts, tenant_pages, tenant_settings, feedback

**Inherited via parent FK** (20 tables): order_items, shipments, cart_items, wishlist_items, product_images, product_variants, product_options, product_categories, product_custom_fields, customer_addresses, product_reviews, discount_usages, blog_post_categories, blog_post_tags, blog_comments, order_workflow_stages, order_progress, payments, license_keys, digital_downloads, stock_reservations, back_in_stock_subscriptions, media_usage

## Usage

### Apply Migration

```bash
npx tsx prisma/migrations/rls/apply-rls.ts
```

### Rollback

```bash
npx tsx prisma/migrations/rls/apply-rls.ts --rollback
```

### In Application Code

```typescript
import { prisma, setCurrentTenant, runWithTenant } from "@/lib/cms/db"

// Option 1: Set tenant for the current request
setCurrentTenant(tenantId)
const products = await prisma.product.findMany() // auto-filtered

// Option 2: Scoped execution
const products = await runWithTenant(tenantId, () =>
  prisma.product.findMany()
)

// Option 3: Transaction with RLS
import { withTenantTransaction } from "@/lib/cms/db"
const result = await withTenantTransaction(prisma, tenantId, async (tx) => {
  const products = await tx.product.findMany()
  return products
})
```

## Files

- `001_enable_rls.sql` - Enable RLS on all tenant-scoped tables
- `001_enable_rls_rollback.sql` - Rollback (disable RLS)
- `002_add_cms_modules.sql` - Add CmsModule table
- `apply-rls.ts` - Migration runner script
