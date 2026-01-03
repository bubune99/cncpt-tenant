# Multi-Storefront Mode (Ninja Transfers Pattern)

## Overview

This architecture supports a single owner managing multiple storefronts (subdomains/domains) with unified backend data. Unlike multi-tenant SaaS where each tenant is isolated, this mode shares customers, products, and purchases across all storefronts.

## Use Case

A business like Ninja Transfers that operates:
- ninjatransfers.com (DTF transfers)
- ninjapatches.com (patches)
- ninjacrafts.com (crafts)
- ninjaprintondemand.com (POD)

All storefronts share:
- Customer accounts (one login works everywhere)
- Product catalog (can be filtered per storefront)
- Order history and purchases
- Inventory management

Each storefront has:
- Its own branding/theme
- Curated product display
- Storefront-specific content (via CMS)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Unified CMS / Admin (packages/cms)                         │
│  ├── Storefront management (add/remove storefronts)         │
│  ├── Product catalog (tag products to storefronts)          │
│  ├── Customer database (shared)                             │
│  ├── Orders/fulfillment (centralized)                       │
│  └── Content editor per storefront                          │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     storefront-a.com  storefront-b.com  storefront-c.com
     (Theme A)         (Theme B)         (Theme C)
     (Products: X,Y)   (Products: Y,Z)   (Products: X,Z)
```

## Database Schema Additions

```sql
-- Storefronts belong to a single owner/team
CREATE TABLE storefronts (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),  -- Single owner
  subdomain VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  theme_config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products can appear on multiple storefronts
CREATE TABLE storefront_products (
  storefront_id UUID REFERENCES storefronts(id),
  product_id UUID REFERENCES products(id),
  display_order INT,
  featured BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (storefront_id, product_id)
);

-- Customers are shared (no storefront_id)
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),  -- Belongs to the business owner
  email VARCHAR(255) NOT NULL,
  -- ... customer fields
);

-- Orders track which storefront they came from
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  storefront_id UUID REFERENCES storefronts(id),  -- Where they purchased
  -- ... order fields
);
```

## Key Differences from Multi-Tenant SaaS

| Aspect | Multi-Tenant SaaS | Multi-Storefront |
|--------|-------------------|------------------|
| Ownership | Different owners per tenant | Single owner, multiple storefronts |
| Data isolation | Complete isolation | Shared data, storefront context |
| CMS | One CMS per tenant | One CMS for all storefronts |
| Customers | Isolated per tenant | Unified across storefronts |
| Products | Tenant-specific | Shared catalog, filtered per storefront |
| Auth | Per-tenant | Unified (SSO across storefronts) |

## Implementation Toggle

The system can detect mode based on:
```typescript
// In subdomain config or team settings
interface TeamConfig {
  mode: 'multi-tenant' | 'multi-storefront';
  // multi-tenant: subdomains are isolated tenants
  // multi-storefront: subdomains share data
}
```

## Future Considerations

- Cross-storefront cart (buy from multiple storefronts, one checkout)
- Storefront-specific pricing
- Analytics per storefront with unified dashboard
- Inventory allocation per storefront
