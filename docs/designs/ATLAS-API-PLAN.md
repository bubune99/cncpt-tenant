# Atlas Redesign — API Coverage Plan

**Author:** Atlas A8 (API Planning Agent)
**Date:** 2026-05-17
**Branch:** `feat/atlas-redesign`
**Source of truth:** `docs/designs/ATLAS-SPEC.md` + chat transcripts `cms-ui/chats/chat1–6.md` + `cncpt-web-admin-ui/chats/chat1–3.md`

---

## 0. Scope

This document validates that every **new capability or data structure introduced by the Atlas redesign** is adequately exposed through:

1. **Tenant MCP server** (`app/s/[subdomain]/mcp/route.ts`) — for external AI agents
2. **Internal agents** — dashboard chat (`app/api/dashboard-chat/`), CMS chat (`app/api/cms/chat/`), block-editor chat, v0-agent, and chatsdk tools under `lib/cms/ai/tools/` + `lib/ai/tools/`

It covers: which **Prisma models** back each capability, which **REST endpoints** expose it, which **MCP tools** exist, and which **internal-agent tools** exist.

---

## 1. Redesign Capability Inventory

Extracted from the design chats + ATLAS-SPEC.md:

| # | Capability Area | Sub-capability |
|---|---|---|
| C01 | Brand presets + density | TenantSetting.brandPreset (marigold/boreal/obsidian/meadow) + density (compact/regular/spacious) |
| C02 | Product types | SIMPLE/VARIABLE/DIGITAL/SERVICE/SUBSCRIPTION/BUNDLE — type-specific tabs |
| C03 | Custom fields (10 types) | TEXT/NUMBER/BOOLEAN/SELECT/MULTISELECT/COLOR/IMAGE/DATE/URL/TEXTAREA per product |
| C04 | Variant grid bulk ops | Drag-fill, fill-down, matrix view (size×color), per-column type editors |
| C05 | Bundle composer | BUNDLE product: bundleItems JSON, bundlePriceMode (fixed/calculated) |
| C06 | Pricing stack | Base price, tier/B2B qty breaks, member tiers, sale schedule, linked discount codes, stacking rules |
| C07 | Digital assets + license keys | DigitalAsset (files, version, delivery rules), LicenseKey pool (AVAILABLE/ASSIGNED/ACTIVATED/REVOKED) |
| C08 | Order per-line sub-fulfillment | Per-OrderItem checkoff steps (pick/prepare/customize/pack) |
| C09 | Order configurable items + attachments | OrderItem with config options, file attachments |
| C10 | Order kanban stage moves | OrderWorkflow + OrderWorkflowStage + currentStageId on Order |
| C11 | Page hierarchy / tree view | Page.parentId self-relation, tree/map view mode, chapter grouping |
| C12 | Page view modes | Table vs. Map toggle; chapter-grouped hierarchical display |
| C13 | Journal series | BlogPost series grouping (Atlas chat4: F3 Structure — series, series progress) |
| C14 | Journal taxonomy + contributors | Taxonomy chips, contributor references per post |
| C15 | Journal related entries + shop links | Related posts, product linkage in blog posts |
| C16 | Multi-channel distribution | Web/newsletter/RSS/X/Mastodon/Instagram per-channel copy + scheduling strip |
| C17 | Analytics widget CRUD | Create/update/delete/reorder widgets in a dashboard layout |
| C18 | Analytics dashboard layouts | Multiple named dashboards; drag-resize grid |
| C19 | Analytics query builder | Schema browser, From/Metric/Group-by/Filter/Comparison, SQL preview |
| C20 | Analytics widget templates | Library of saved/template widgets |
| C21 | Customer lifecycle stage | NEW→LOYAL→VIP ribbon; lifecycle progression |
| C22 | Customer notes | Admin-authored notes on a customer record (timeline) |
| C23 | Admin notification feed | Bell + drawer: STOCK/ORDERS/TICKETS/PAYMENTS/REVIEW categories, unread pip |
| C24 | Customer notification inbox | Bell + drawer: order/stock/subscription/review tabs; per-event prefs |
| C25 | Orders ledger + board view modes | Kanban (Board) vs table (Ledger) toggle on orders list |

---

## 2. Coverage Matrix

> Legend: ✅ exists | ⚠️ partial/shape mismatch | ❌ missing

### 2.1 Prisma Model Backing

| Capability | Prisma Model | Status | Notes |
|---|---|---|---|
| C01 brandPreset/density | `TenantSetting.brandPreset`, `TenantSetting.density` | ✅ | Added in Phase 0 migration (lines 4218–4220 of schema) |
| C02 Product types | `ProductType` enum (SIMPLE/VARIABLE/DIGITAL/SERVICE/SUBSCRIPTION/BUNDLE) | ✅ | Fully defined |
| C03 Custom fields | `CustomField`, `ProductCustomField`, `VariantCustomFieldValue`, `CustomFieldType` enum (10 values) | ✅ | Fully defined |
| C04 Variant grid bulk ops | No dedicated model; front-end bulk-edit via ProductVariant[] | ✅ (data) | REST shape needed; no atomic bulk-update endpoint |
| C05 Bundle composer | `Product.bundleItems` (Json), `Product.bundlePriceMode` | ✅ | Stored as JSON, not a relation table — sufficient for Phase 1 |
| C06 Pricing stack — base+compare | `Product.basePrice`, `Product.compareAtPrice`, `ProductVariant.price`/`.compareAtPrice` | ✅ | — |
| C06 Pricing stack — tier/B2B qty | ❌ No `PricingTier` model | ❌ | **Missing** — needs new model |
| C06 Pricing stack — member pricing | ❌ No `MemberTierPrice` model | ❌ | **Missing** — needs new model |
| C06 Pricing stack — sale schedule | ❌ No `SaleSchedule` model | ❌ | **Missing** — needs new model |
| C06 Pricing stack — discount codes | `DiscountCode` model | ✅ | Exists, linked from Order |
| C07 Digital assets | `DigitalAsset`, `LicenseKey`, `DigitalDownload` | ✅ | Fully defined |
| C08 Order per-line sub-fulfillment | ❌ No `OrderItemFulfillmentStep` model | ❌ | **Missing** — needs new model |
| C09 Order configurable items | ❌ No config options or attachments on `OrderItem` | ❌ | **Missing** — `OrderItem` lacks `configOptions Json?` and `attachments Json?` |
| C10 Order kanban stage moves | `OrderWorkflow`, `OrderWorkflowStage`, `OrderProgress`, `Order.currentStageId` | ✅ | Fully defined |
| C11 Page hierarchy | `Page.parentId` self-relation, `Page.children[]` | ✅ | Exists |
| C12 Page view modes | Front-end toggle only | ✅ (data) | No schema change needed; view is client-side preference |
| C13 Journal series | ❌ No `BlogSeries` / `BlogPostSeries` model | ❌ | **Missing** — BlogPost has no series relation |
| C14 Journal taxonomy + contributors | Categories/tags exist; ❌ No contributor model | ⚠️ | Taxonomy = BlogCategory/BlogTag ✅. Contributors need a `BlogContributor` junction or Json field |
| C15 Journal related entries + shop links | ❌ No `BlogPostRelated` or `BlogPostProduct` relation | ❌ | **Missing** — needs junction tables or Json fields |
| C16 Multi-channel distribution | ❌ No `PostDistributionChannel` / `PostChannelSchedule` model | ❌ | **Missing** — needs new model |
| C17 Analytics widget CRUD | ❌ No `AnalyticsWidget` model | ❌ | **Missing** |
| C18 Analytics dashboard layouts | ❌ No `AnalyticsDashboard` model | ❌ | **Missing** |
| C19 Analytics query builder | ❌ No `AnalyticsQuery` model | ❌ | **Missing** (can be implemented as widget config Json field in C17 model) |
| C20 Analytics widget templates | ❌ No `AnalyticsWidgetTemplate` model | ❌ | **Missing** (can merge with C17/C18) |
| C21 Customer lifecycle stage | ❌ No `lifecycleStage` on Customer | ❌ | **Missing** — Customer lacks `lifecycleStage String?` field |
| C22 Customer notes | `Customer.notes String?` exists (single text) | ⚠️ | Single text field, not a structured timeline. Needs `CustomerNote` model for proper timeline |
| C23 Admin notification feed | `Notification` model + `NotificationType` enum | ✅ | Model exists; enum covers order/stock/payment/review types |
| C24 Customer notification inbox | `Notification` model (same table, customer-facing) | ✅ | Same model; `entityType` can differentiate |
| C25 Orders view modes | Front-end toggle only | ✅ (data) | No schema change needed |

### 2.2 REST Endpoint Coverage

| Capability | Relevant REST Endpoint | HTTP | Status |
|---|---|---|---|
| C01 brandPreset/density | `app/api/cms/admin/branding/route.ts` | GET/PUT | ⚠️ Partial — need to confirm brandPreset+density fields are in payload |
| C02 Product types | `app/api/cms/products/route.ts`, `app/api/cms/products/[id]/route.ts` | GET/POST/PUT | ✅ type field present |
| C03 Custom fields | `app/api/cms/custom-fields/route.ts`, `/[id]/route.ts` | GET/POST/PUT/DELETE | ✅ |
| C04 Variant grid bulk ops | `app/api/cms/products/[id]/route.ts` (via product update) | PUT | ⚠️ No bulk-update variants endpoint |
| C05 Bundle composer | `app/api/cms/products/[id]/route.ts` | PUT | ⚠️ bundleItems is in Product; no dedicated bundle composition API |
| C06 Pricing stack (tier) | ❌ No endpoint | — | ❌ Missing |
| C06 Pricing stack (member) | ❌ No endpoint | — | ❌ Missing |
| C06 Pricing stack (sale schedule) | ❌ No endpoint | — | ❌ Missing |
| C06 Discount codes | `app/api/cms/discounts/route.ts`, `/[id]/route.ts` | GET/POST/PUT/DELETE | ✅ |
| C07 Digital assets | ❌ No `/api/cms/digital-assets/` route | — | ❌ Missing |
| C07 License keys | ❌ No `/api/cms/digital-assets/[id]/license-keys/` route | — | ❌ Missing |
| C08 Sub-fulfillment checkoffs | ❌ No endpoint | — | ❌ Missing (no model yet) |
| C09 Order config items | ❌ No endpoint | — | ❌ Missing |
| C10 Order kanban stage moves | `app/api/cms/workflows/route.ts`, `/[id]/route.ts`, `/[id]/stages/route.ts` | GET/POST/PUT | ✅ Workflow CRUD exists; need order stage-move action endpoint |
| C10 Order move to stage | ❌ No `PATCH /api/cms/orders/[id]/stage` | — | ❌ Missing action |
| C11 Page hierarchy | `app/api/cms/admin/pages/route.ts` | GET | ⚠️ parentId in schema; unclear if tree fetch exposed |
| C12 Page view modes | n/a (client preference) | — | n/a |
| C13 Journal series | ❌ No endpoint | — | ❌ Missing (no model) |
| C14 Contributors | ❌ No endpoint | — | ❌ Missing |
| C15 Related + shop links | ❌ No endpoint | — | ❌ Missing |
| C16 Multi-channel distribution | ❌ No endpoint | — | ❌ Missing |
| C17 Analytics widget CRUD | ❌ No `/api/cms/analytics/widgets/` | — | ❌ Missing |
| C18 Analytics dashboard layouts | ❌ No `/api/cms/analytics/dashboards/` | — | ❌ Missing |
| C19 Query builder | ❌ No endpoint | — | ❌ Missing |
| C20 Widget templates | ❌ No endpoint | — | ❌ Missing |
| C21 Customer lifecycle stage | `app/api/cms/admin/customers/route.ts` | GET/PUT | ❌ field missing from model |
| C22 Customer notes (structured) | ❌ No `/api/cms/customers/[id]/notes/` | — | ❌ Missing (single text field only) |
| C23 Admin notifications | `app/api/cms/notifications/route.ts`, `/[id]/route.ts`, `/unread-counts/route.ts`, `/mark-all-read/route.ts` | GET/PATCH | ✅ |
| C24 Customer notifications | `app/api/cms/notifications/route.ts` (filtered by userId) | GET/PATCH | ✅ |
| C25 Orders view modes | n/a | — | n/a |

### 2.3 MCP Tool Coverage

Existing MCP tools in `app/s/[subdomain]/mcp/route.ts`:
- `list_products`, `get_product` (products:read)
- `list_orders`, `get_order` (orders:read)
- `list_blog_posts`, `get_blog_post`, `create_blog_post` (blog:read/write)
- `list_pages`, `get_page`, `get_page_content`, `update_page_content` (pages:read/write)
- `list_media` (media:read)
- `list_users` (users:read)
- `get_analytics_summary` (analytics:read)
- `get_settings`, `update_setting` (settings:read/write)
- `list_customers`, `get_customer` (customers:read)

| Capability | MCP Tool | Scope | Status |
|---|---|---|---|
| C01 brandPreset/density | `get_settings` (key=brand_preset) / `update_setting` | settings:read/write | ⚠️ Partial — generic settings read/write; no typed tool |
| C02 Product types | `get_product` includes type field | products:read | ✅ |
| C03 Custom fields (read) | ❌ No `list_custom_fields` or `get_product_custom_fields` | — | ❌ Missing |
| C03 Custom fields (write) | ❌ No `attach_custom_field` or `set_variant_field_value` | — | ❌ Missing |
| C04 Variant bulk ops | ❌ No `bulk_update_variants` | — | ❌ Missing |
| C05 Bundle composer | ❌ No `get_bundle_composition` or `update_bundle_items` | — | ❌ Missing |
| C06 Pricing tier | ❌ No `list_pricing_tiers` | — | ❌ Missing |
| C06 Sale schedule | ❌ No `get_sale_schedule` | — | ❌ Missing |
| C06 Discount codes | ❌ No `list_discount_codes` or `get_discount_code` | — | ❌ Missing |
| C07 Digital assets | ❌ No `get_digital_asset` or `list_license_keys` | — | ❌ Missing |
| C08 Sub-fulfillment | ❌ No `get_order_fulfillment_steps` | — | ❌ Missing |
| C10 Order stage moves | ❌ No `move_order_to_stage` | — | ❌ Missing |
| C11 Page tree | `list_pages` (no parent tree structure returned) | pages:read | ⚠️ Partial — tree not included |
| C13 Journal series | ❌ No `list_journal_series` | — | ❌ Missing |
| C16 Distribution channels | ❌ No `schedule_post_channels` | — | ❌ Missing |
| C17–C20 Analytics widgets | ❌ No analytics CRUD tools | — | ❌ Missing |
| C21 Customer lifecycle | `get_customer` (no lifecycle field yet) | customers:read | ❌ Missing field |
| C22 Customer notes | ❌ No `list_customer_notes` or `add_customer_note` | — | ❌ Missing |
| C23 Admin notifications | ❌ No `list_notifications` or `mark_notification_read` | — | ❌ Missing |
| C24 Customer inbox | ❌ No `list_customer_notifications` | — | ❌ Missing |

### 2.4 Internal Agent Tool Coverage

Existing agent tools in `lib/cms/ai/tools/` + `lib/ai/tools/dashboard/`:
- `product-tools.ts`: `createProduct`, `updateProduct`, `deleteProduct`, `manageProductVariant`, `syncProductToStripe`
- `order-tools.ts`: `updateOrderStatus`, `fulfillOrder`, `refundOrder`, `cancelOrder`
- `blog-tools.ts`: blog CRUD (assumed from file presence)
- `page-tools.ts`: page content tools
- `settings-tools.ts`: settings tools
- `entity-tools.ts`: `getEntityDetails`, `searchEntities`, `getEntityStats`
- `walkthrough-tools.ts`, `help-management-tools.ts`, `help-notification.ts`, `request-suggestions.ts`
- `create-document.ts`, `update-document.ts`

| Capability | Internal Tool | Status |
|---|---|---|
| C01 brandPreset read/write | `settings-tools.ts` (generic key/value) | ⚠️ Partial — no typed preset tool |
| C02 Product types | `createProduct` accepts type param | ✅ |
| C03 Custom fields | ❌ No custom field agent tools | ❌ Missing |
| C04 Variant bulk ops | `manageProductVariant` (single row) | ❌ Missing bulk operation |
| C05 Bundle composer | `updateProduct` (bundleItems via generic update) | ⚠️ Partial — no semantic bundle tool |
| C06 Pricing stack | `updateProduct` (basePrice only); no tier/schedule tools | ❌ Missing |
| C07 Digital assets | ❌ No digital asset or license key tools | ❌ Missing |
| C08 Sub-fulfillment | ❌ No sub-fulfillment step tools | ❌ Missing |
| C09 Order config items | ❌ No configurable item tools | ❌ Missing |
| C10 Order stage moves | `updateOrderStatus` (simple enum transition) | ⚠️ Partial — doesn't use workflow stages |
| C11 Page tree | `getEntityDetails` (page, no children) | ⚠️ Partial |
| C13 Journal series | ❌ No series tools | ❌ Missing |
| C16 Distribution channels | ❌ No channel scheduling tools | ❌ Missing |
| C17–C20 Analytics | ❌ No analytics widget tools | ❌ Missing |
| C21 Customer lifecycle | `getEntityDetails(customer)` — no lifecycle field | ❌ Missing field |
| C22 Customer notes | ❌ No structured notes tools | ❌ Missing |
| C23 Admin notifications | ❌ No notification tools | ❌ Missing |
| C24 Customer inbox | ❌ No customer notification tools | ❌ Missing |

---

## 3. Gap List (Prioritized)

### P0 — Blocks the redesign being agent-operable (no functional path via MCP or internal agent)

| ID | Gap | Impact |
|---|---|---|
| G01 | **No `OrderItemFulfillmentStep` model + no sub-fulfillment REST/MCP/agent tools** | AI agents cannot read or update per-line fulfillment state. The redesigned order editor's core feature is invisible to agents. |
| G02 | **No `AnalyticsDashboard` + `AnalyticsWidget` models; no analytics CRUD endpoints/tools** | The analytics dashboard editor is entirely agent-blind. Agents can't create widgets, query layouts, or access the query builder. |
| G03 | **No `BlogSeries` model + no journal series REST/MCP/agent tools** | Journal F3 (Structure) and F4 (Distribute) surfaces can't be managed by agents. Series grouping, contributor list, related entries all inaccessible. |
| G04 | **No `PostDistributionChannel` model + no multi-channel scheduling tools** | Journal F4 (Distribute — web/newsletter/RSS/X/Mastodon/Instagram) has no backing model and zero agent exposure. |
| G05 | **No customer `lifecycleStage` field; no lifecycle progression tool** | Customer lifecycle ribbon (NEW→LOYAL→VIP) — the redesign's primary customer insight widget — has no data backing or agent tools. |

### P1 — Important; the redesign is degraded without these

| ID | Gap | Impact |
|---|---|---|
| G06 | **No `PricingTier`, `MemberTierPrice`, `SaleSchedule` models; no pricing-stack REST/MCP/agent tools** | F9 (Pricing stack) — the multi-layer pricing screen — has no model backing. AI agents can't read or set tier/member/schedule pricing. |
| G07 | **No MCP tools for custom fields** (`list_custom_fields`, `get_product_custom_fields`, `set_variant_field_value`) | Agents cannot read or set the 10-type ACF-like custom fields that appear in F5/F6. |
| G08 | **No REST or MCP tools for digital assets + license keys** | DIGITAL product type (F8) — files, version history, license key pool — completely inaccessible via MCP. |
| G09 | **No `move_order_to_stage` MCP tool; no workflow-aware order-stage action endpoint** | Order kanban drag (move card between stages) has no MCP equivalent. Agents use simple enum status instead of workflow stages. |
| G10 | **No structured `CustomerNote` model; no `list_customer_notes`/`add_customer_note` tools** | Customer editor timeline (admin notes) is backed by a single text blob, not a timeline. Agents can't add timestamped notes. |
| G11 | **No MCP or agent tools for admin/customer notifications** | Notifications drawer (admin + customer inbox) has no agent read/write path despite the Notification model existing. |
| G12 | **No bulk-update variants endpoint or agent tool** | F1 (Spreadsheet) and F2 (Matrix) bulk-edit is unrepresentable in agent actions — only single-variant CRUD exists. |

### P2 — Nice to have; surfaces work without but agent UX is degraded

| ID | Gap | Impact |
|---|---|---|
| G13 | No typed `get_brand_preset`/`update_brand_preset` MCP tool (generic settings works but is unergonomic) | |
| G14 | No page tree-fetch MCP tool (list_pages doesn't return parent/children hierarchy) | |
| G15 | No `list_discount_codes` MCP tool (discount codes exist but aren't MCP-accessible) | |
| G16 | No bundle composition MCP tool (`get_bundle_composition`, `update_bundle_items`) | |
| G17 | No journal related-entries + shop-link REST/MCP tools | |
| G18 | `OrderItem` lacks `configOptions Json?` and `attachments Json?` for configurable items (C09) | |
| G19 | Analytics summary MCP tool (`get_analytics_summary`) is read-only counts only; no time-series, no per-widget data | |
| G20 | No `list_journal_contributors` or `set_post_contributors` tools | |

---

## 4. Implementation Plan

Each gap is given: file paths, method/signature, Zod input shape, scope, and whether a Prisma migration is needed.

---

### G01 — Order per-line sub-fulfillment

**Prisma migration needed:** Yes

**New model in `prisma/cms/schema.prisma`:**

```prisma
model OrderItemFulfillmentStep {
  id          String   @id @default(cuid())
  orderItemId String
  orderItem   OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  name        String  // "Pick blank", "Confirm spec", "Embroider", "QC", "Pack"
  position    Int
  completed   Boolean   @default(false)
  completedAt DateTime?
  completedBy String?   // userId
  notes       String?   @db.Text

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([orderItemId])
  @@map("order_item_fulfillment_steps")
}
```

Also add to `OrderItem`:

```prisma
fulfillmentSteps OrderItemFulfillmentStep[]
configOptions    Json?   // customer-selected config {key: value}
attachments      Json?   // [{name, url, mimeType, size}]
```

**Migration file:** `prisma/cms/sql/0002_atlas_order_fulfillment.sql`

```sql
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS config_options jsonb;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS attachments jsonb;

CREATE TABLE IF NOT EXISTS order_item_fulfillment_steps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_oifs_order_item ON order_item_fulfillment_steps(order_item_id);
```

**REST endpoint:** `app/api/cms/orders/[id]/fulfillment/route.ts`

```typescript
// GET  /api/cms/orders/[id]/fulfillment  — get all items with their steps
// POST /api/cms/orders/[id]/fulfillment/steps/[stepId]/complete  — toggle step

const completeStepSchema = z.object({
  completed: z.boolean(),
  notes: z.string().optional(),
})
```

**MCP tool additions** in `app/s/[subdomain]/mcp/route.ts`:

```typescript
server.tool(
  "get_order_fulfillment",
  "Get per-line-item fulfillment steps for an order",
  { orderId: z.string() },
  async ({ orderId }) => { /* query OrderItem + OrderItemFulfillmentStep */ }
)

server.tool(
  "update_fulfillment_step",
  "Mark a fulfillment step complete or incomplete",
  {
    stepId: z.string(),
    completed: z.boolean(),
    notes: z.string().optional(),
  },
  async ({ stepId, completed, notes }) => { /* update step */ }
)
```

**Scope additions** in `lib/cms/mcp/scopes.ts`:

```typescript
ORDERS_FULFILLMENT_READ: "orders:fulfillment:read",
ORDERS_FULFILLMENT_WRITE: "orders:fulfillment:write",
```

**Internal agent tool:** `lib/cms/ai/tools/fulfillment-tools.ts`

```typescript
export const getOrderFulfillment = tool({
  description: 'Get per-line fulfillment steps for an order',
  inputSchema: z.object({ orderId: z.string() }),
  execute: async ({ orderId }) => { /* ... */ }
})

export const toggleFulfillmentStep = tool({
  description: 'Mark a fulfillment sub-step complete or incomplete',
  inputSchema: z.object({
    stepId: z.string(),
    completed: z.boolean(),
    notes: z.string().optional(),
  }),
  execute: async ({ stepId, completed, notes }) => { /* ... */ }
})
```

---

### G02 — Analytics dashboard + widget CRUD

**Prisma migration needed:** Yes

**New models in `prisma/cms/schema.prisma`:**

```prisma
model AnalyticsDashboard {
  id       String @id @default(cuid())
  tenantId Int?
  tenant   Subdomain? @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name      String
  slug      String
  isDefault Boolean @default(false)
  layout    Json?   // grid layout (positions/sizes)
  pinnedBy  String[] // userIds who pinned
  sharedWith String[] // "public" or userIds

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  widgets AnalyticsWidget[]

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@map("analytics_dashboards")
}

model AnalyticsWidget {
  id          String @id @default(cuid())
  dashboardId String
  dashboard   AnalyticsDashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)

  title       String
  vizType     String  // "line", "bar", "donut", "kpi", "table", "funnel"
  query       Json    // { metric, dimension, filters, comparison, groupBy, dateRange }
  config      Json?   // chart-specific: axes, colors, drillEnabled
  position    Json    // { x, y, w, h } grid slot
  templateId  String? // if created from template

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([dashboardId])
  @@map("analytics_widgets")
}

model AnalyticsWidgetTemplate {
  id          String @id @default(cuid())
  tenantId    Int?
  name        String
  description String?
  vizType     String
  query       Json
  config      Json?
  thumbnail   String?
  category    String? // "Revenue", "Traffic", "Inventory"
  isSystem    Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@map("analytics_widget_templates")
}
```

**Migration file:** `prisma/cms/sql/0003_atlas_analytics_dashboard.sql`

```sql
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id INTEGER REFERENCES subdomains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  layout JSONB,
  pinned_by TEXT[] DEFAULT '{}',
  shared_with TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS analytics_widgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dashboard_id TEXT NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  viz_type TEXT NOT NULL,
  query JSONB NOT NULL,
  config JSONB,
  position JSONB NOT NULL,
  template_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_widget_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  viz_type TEXT NOT NULL,
  query JSONB NOT NULL,
  config JSONB,
  thumbnail TEXT,
  category TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**REST endpoints:**

- `app/api/cms/analytics/dashboards/route.ts` — GET (list), POST (create)
- `app/api/cms/analytics/dashboards/[id]/route.ts` — GET, PUT, DELETE
- `app/api/cms/analytics/dashboards/[id]/widgets/route.ts` — GET, POST
- `app/api/cms/analytics/dashboards/[id]/widgets/[widgetId]/route.ts` — PUT, DELETE
- `app/api/cms/analytics/widget-templates/route.ts` — GET, POST
- `app/api/cms/analytics/query/route.ts` — POST (run a query, returns data)

```typescript
// POST /api/cms/analytics/query
const analyticsQuerySchema = z.object({
  metric: z.string(),           // "revenue", "orders", "pageviews"
  dimension: z.string().optional(), // "date", "product", "channel"
  filters: z.array(z.object({
    field: z.string(),
    op: z.enum(["eq", "gt", "lt", "in", "contains"]),
    value: z.union([z.string(), z.number(), z.array(z.string())]),
  })).optional(),
  groupBy: z.string().optional(),
  dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
  comparison: z.enum(["previous_period", "previous_year"]).optional(),
  limit: z.number().optional().default(50),
})
```

**MCP tools** (add to `app/s/[subdomain]/mcp/route.ts`):

```typescript
server.tool("list_analytics_dashboards", "List analytics dashboards", { brief: z.boolean().optional() }, ...)
server.tool("get_analytics_dashboard", "Get dashboard with all widgets", { id: z.string() }, ...)
server.tool("create_analytics_widget", "Add a widget to a dashboard", {
  dashboardId: z.string(),
  title: z.string(),
  vizType: z.string(),
  query: z.any(),
  position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
}, ...)
server.tool("run_analytics_query", "Execute an analytics query and return data", {
  metric: z.string(),
  dimension: z.string().optional(),
  filters: z.array(z.any()).optional(),
  dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
}, ...)
```

**New scopes:**

```typescript
ANALYTICS_WRITE: "analytics:write",
```

**Internal agent tool:** `lib/cms/ai/tools/analytics-tools.ts`

```typescript
export const getAnalyticsDashboard = tool({ ... })
export const createAnalyticsWidget = tool({ ... })
export const runAnalyticsQuery = tool({ ... })
```

---

### G03 — Journal series + G04 distribution channels

**Prisma migration needed:** Yes

**New models:**

```prisma
model BlogSeries {
  id          String @id @default(cuid())
  tenantId    Int?
  tenant      Subdomain? @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title       String
  slug        String
  description String? @db.Text
  coverImageId String?
  postCount   Int @default(0)
  position    Int @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts BlogPostSeries[]

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@map("blog_series")
}

model BlogPostSeries {
  postId    String
  seriesId  String
  position  Int @default(0)  // chapter number in series
  post      BlogPost   @relation(fields: [postId], references: [id], onDelete: Cascade)
  series    BlogSeries @relation(fields: [seriesId], references: [id], onDelete: Cascade)

  @@id([postId, seriesId])
  @@map("blog_post_series")
}

model BlogContributor {
  postId      String
  userId      String
  role        String @default("author")  // "author", "editor", "photographer"
  position    Int @default(0)
  post        BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([postId, userId])
  @@map("blog_contributors")
}

model BlogPostRelated {
  postId        String
  relatedPostId String
  position      Int @default(0)
  post          BlogPost @relation("PostRelated", fields: [postId], references: [id], onDelete: Cascade)
  relatedPost   BlogPost @relation("RelatedPost", fields: [relatedPostId], references: [id], onDelete: Cascade)

  @@id([postId, relatedPostId])
  @@map("blog_post_related")
}

model PostDistributionChannel {
  id         String @id @default(cuid())
  postId     String
  post       BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  channel    DistributionChannel
  enabled    Boolean @default(false)
  copy       String? @db.Text  // per-channel copy override
  scheduledAt DateTime?
  publishedAt DateTime?
  status      ChannelPublishStatus @default(DRAFT)
  metadata   Json?  // {tweetId, instagramMediaId, rssGuid, etc.}

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([postId, channel])
  @@index([postId])
  @@map("post_distribution_channels")
}

enum DistributionChannel {
  WEB
  NEWSLETTER
  RSS
  TWITTER_X
  MASTODON
  INSTAGRAM
}

enum ChannelPublishStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  FAILED
}
```

Also add to `BlogPost`:

```prisma
series       BlogPostSeries[]
contributors BlogContributor[]
relatedPosts BlogPostRelated[] @relation("PostRelated")
relatedOf    BlogPostRelated[] @relation("RelatedPost")
channels     PostDistributionChannel[]
shopProductIds String[] // linked product IDs for shop links
```

**Migration file:** `prisma/cms/sql/0004_atlas_journal_series.sql`

**REST endpoints:**

- `app/api/cms/blog/series/route.ts` — GET/POST
- `app/api/cms/blog/series/[id]/route.ts` — GET/PUT/DELETE
- `app/api/cms/blog/posts/[id]/channels/route.ts` — GET/PUT (upsert channel config)
- `app/api/cms/blog/posts/[id]/series/route.ts` — GET/POST/DELETE
- `app/api/cms/blog/posts/[id]/contributors/route.ts` — GET/POST/DELETE
- `app/api/cms/blog/posts/[id]/related/route.ts` — GET/POST/DELETE

**MCP tools:**

```typescript
server.tool("list_blog_series", "List journal series", { brief: z.boolean().optional() }, ...)
server.tool("get_blog_series", "Get a series with its posts", { id: z.string() }, ...)
server.tool("get_post_distribution", "Get distribution channel state for a post", { postId: z.string() }, ...)
server.tool("schedule_post_channel", "Schedule a post for a distribution channel", {
  postId: z.string(),
  channel: z.enum(["WEB","NEWSLETTER","RSS","TWITTER_X","MASTODON","INSTAGRAM"]),
  scheduledAt: z.string().optional(),
  copy: z.string().optional(),
}, ...)
```

**New scopes:**

```typescript
JOURNAL_READ: "journal:read",
JOURNAL_WRITE: "journal:write",
```

**Internal agent tools:** `lib/cms/ai/tools/journal-tools.ts`

```typescript
export const getJournalSeries = tool({ ... })
export const schedulePostChannel = tool({ ... })
export const addRelatedPost = tool({ ... })
```

---

### G05 — Customer lifecycle stage

**Prisma migration needed:** Yes (add field to Customer)

**Schema change:**

```prisma
// In model Customer:
lifecycleStage   CustomerLifecycleStage @default(NEW)
lifecycleUpdatedAt DateTime?
```

```prisma
enum CustomerLifecycleStage {
  NEW
  RETURNING
  LOYAL
  VIP
  LAPSED
  CHURNED
}
```

**Migration:** `prisma/cms/sql/0005_atlas_customer_lifecycle.sql`

```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_lifecycle_stage') THEN
    CREATE TYPE customer_lifecycle_stage AS ENUM ('NEW','RETURNING','LOYAL','VIP','LAPSED','CHURNED');
  END IF;
END $$;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifecycle_stage customer_lifecycle_stage NOT NULL DEFAULT 'NEW';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifecycle_updated_at TIMESTAMPTZ;
```

**REST endpoint:** Extend `app/api/cms/admin/customers/route.ts` to include `lifecycleStage` in GET response and accept it in PATCH body:

```typescript
const updateLifecycleSchema = z.object({
  lifecycleStage: z.enum(["NEW","RETURNING","LOYAL","VIP","LAPSED","CHURNED"]),
})
```

**MCP tools** (extend `get_customer` + add `update_customer_lifecycle`):

```typescript
server.tool("update_customer_lifecycle", "Update a customer's lifecycle stage", {
  customerId: z.string(),
  stage: z.enum(["NEW","RETURNING","LOYAL","VIP","LAPSED","CHURNED"]),
}, ...)
```

**New scope:** `CUSTOMERS_WRITE` (already exists — reuse).

**Internal agent tool:** Extend `lib/cms/ai/tools/entity-tools.ts` `getEntityDetails(customer)` to include `lifecycleStage`. Add `updateCustomerLifecycle` tool.

---

### G06 — Pricing stack (tiers, member pricing, sale schedules)

**Prisma migration needed:** Yes

**New models:**

```prisma
model ProductPricingTier {
  id         String @id @default(cuid())
  productId  String
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  label      String  // "B2B Wholesale", "Studio Members"
  minQty     Int     // minimum quantity to qualify
  maxQty     Int?
  price      Int     // price in cents at this tier
  type       PricingTierType @default(QTY)
  enabled    Boolean @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([productId])
  @@map("product_pricing_tiers")
}

enum PricingTierType {
  QTY      // B2B quantity break
  MEMBER   // Member/loyalty tier pricing
}

model ProductSaleSchedule {
  id         String @id @default(cuid())
  productId  String
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId  String?
  salePrice  Int     // cents
  startsAt   DateTime
  endsAt     DateTime
  enabled    Boolean @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([productId])
  @@index([startsAt, endsAt])
  @@map("product_sale_schedules")
}
```

**Migration:** `prisma/cms/sql/0006_atlas_pricing_stack.sql`

**REST endpoints:**

- `app/api/cms/products/[id]/pricing-tiers/route.ts` — GET/POST/PUT/DELETE
- `app/api/cms/products/[id]/sale-schedules/route.ts` — GET/POST/PUT/DELETE

**MCP tools:**

```typescript
server.tool("get_product_pricing", "Get all pricing layers for a product (tiers, schedules, discounts)", {
  productId: z.string(),
}, ...)
server.tool("create_pricing_tier", "Create a qty-break or member-tier price", {
  productId: z.string(),
  label: z.string(),
  minQty: z.number(),
  price: z.number(),
  type: z.enum(["QTY","MEMBER"]),
}, ...)
server.tool("create_sale_schedule", "Schedule a sale price window", {
  productId: z.string(),
  salePrice: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
}, ...)
```

**New scopes:**

```typescript
PRICING_READ: "pricing:read",
PRICING_WRITE: "pricing:write",
```

**Internal agent tool:** `lib/cms/ai/tools/pricing-tools.ts`

---

### G07 — Custom field MCP + agent exposure

No Prisma migration needed (models exist).

**MCP tools** (add to `app/s/[subdomain]/mcp/route.ts`):

```typescript
server.tool("list_custom_fields", "List the custom field library for this tenant", {
  type: z.enum(["TEXT","NUMBER","BOOLEAN","SELECT","MULTISELECT","COLOR","IMAGE","DATE","URL","TEXTAREA"]).optional(),
  enabled: z.boolean().optional(),
}, ...)

server.tool("get_product_custom_fields", "Get custom fields attached to a product + their current values per variant", {
  productId: z.string(),
}, ...)

server.tool("set_variant_field_value", "Set a custom field value for a specific variant", {
  variantId: z.string(),
  customFieldId: z.string(),
  value: z.any(),
}, ...)

server.tool("attach_custom_field_to_product", "Attach a custom field from the library to a product", {
  productId: z.string(),
  customFieldId: z.string(),
  position: z.number().optional(),
}, ...)
```

**New scopes:**

```typescript
CUSTOM_FIELDS_READ: "custom_fields:read",
CUSTOM_FIELDS_WRITE: "custom_fields:write",
```

**Internal agent tools:** `lib/cms/ai/tools/custom-field-tools.ts`

```typescript
export const listCustomFields = tool({ ... })
export const getProductCustomFields = tool({ ... })
export const setVariantFieldValue = tool({ ... })
```

---

### G08 — Digital assets + license keys REST + MCP

No Prisma migration needed (models exist).

**REST endpoints:**

- `app/api/cms/digital-assets/route.ts` — GET/POST
- `app/api/cms/digital-assets/[id]/route.ts` — GET/PUT/DELETE
- `app/api/cms/digital-assets/[id]/license-keys/route.ts` — GET/POST (bulk import)
- `app/api/cms/digital-assets/[id]/license-keys/[keyId]/route.ts` — PATCH (revoke/status)

```typescript
// POST /api/cms/digital-assets/[id]/license-keys  — bulk import
const importLicenseKeysSchema = z.object({
  keys: z.array(z.string()).min(1).max(5000),
})
```

**MCP tools:**

```typescript
server.tool("list_digital_assets", "List digital assets", { productId: z.string().optional() }, ...)
server.tool("get_digital_asset", "Get a digital asset with license key stats", { id: z.string() }, ...)
server.tool("list_license_keys", "List license keys for a digital asset", {
  assetId: z.string(),
  status: z.enum(["AVAILABLE","ASSIGNED","ACTIVATED","EXPIRED","REVOKED"]).optional(),
  limit: z.number().optional(),
}, ...)
server.tool("revoke_license_key", "Revoke a license key", { keyId: z.string() }, ...)
```

**New scopes:**

```typescript
DIGITAL_ASSETS_READ: "digital_assets:read",
DIGITAL_ASSETS_WRITE: "digital_assets:write",
```

**Internal agent tool:** `lib/cms/ai/tools/digital-asset-tools.ts`

---

### G09 — Order workflow stage moves

No Prisma migration needed (workflow + progress models exist).

**REST endpoint:**

```typescript
// PATCH /api/cms/orders/[id]/stage
// app/api/cms/orders/[id]/stage/route.ts

const moveOrderStageSchema = z.object({
  stageId: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})
```

This endpoint: validates stageId belongs to order's workflow, creates `OrderProgress` record, updates `Order.currentStageId`.

**MCP tool:**

```typescript
server.tool("move_order_to_stage", "Move an order to a specific workflow stage", {
  orderId: z.string(),
  stageId: z.string(),
  reason: z.string().optional(),
}, ...)

server.tool("get_order_workflow", "Get the workflow and current stage for an order", {
  orderId: z.string(),
}, ...)
```

**Scope:** `orders:write` (already exists).

**Internal agent tool:** Extend `lib/cms/ai/tools/order-tools.ts`:

```typescript
export const moveOrderToStage = tool({
  description: 'Move an order to a specific workflow stage by stageId',
  inputSchema: z.object({
    orderId: z.string(),
    stageId: z.string(),
    reason: z.string().optional(),
  }),
  execute: async ({ orderId, stageId, reason }) => { /* ... */ }
})
```

---

### G10 — Structured customer notes

**Prisma migration needed:** Yes

**New model:**

```prisma
model CustomerNote {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  authorId   String?  // admin userId
  content    String   @db.Text
  pinned     Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([customerId])
  @@index([createdAt])
  @@map("customer_notes")
}
```

Also add `notes CustomerNote[]` to Customer model.

**Migration:** `prisma/cms/sql/0007_atlas_customer_notes.sql`

**REST endpoints:**

- `app/api/cms/admin/customers/[id]/notes/route.ts` — GET/POST
- `app/api/cms/admin/customers/[id]/notes/[noteId]/route.ts` — PUT/DELETE

**MCP tools:**

```typescript
server.tool("list_customer_notes", "List notes for a customer", { customerId: z.string() }, ...)
server.tool("add_customer_note", "Add a note to a customer record", {
  customerId: z.string(),
  content: z.string(),
  pinned: z.boolean().optional(),
}, ...)
```

**Scope:** `customers:write` (reuse).

---

### G11 — Notifications MCP + agent tools

No Prisma migration needed (Notification model exists).

**MCP tools:**

```typescript
server.tool("list_notifications", "List notifications for the current tenant", {
  unreadOnly: z.boolean().optional(),
  type: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
}, ...)

server.tool("mark_notification_read", "Mark a notification as read", {
  id: z.string(),
}, ...)

server.tool("mark_all_notifications_read", "Mark all notifications as read", {}, ...)
```

**New scopes:**

```typescript
NOTIFICATIONS_READ: "notifications:read",
NOTIFICATIONS_WRITE: "notifications:write",
```

**Internal agent tool:** `lib/cms/ai/tools/notification-tools.ts`

```typescript
export const listNotifications = tool({ ... })
export const markNotificationRead = tool({ ... })
```

---

### G12 — Bulk variant update endpoint

No Prisma migration needed.

**REST endpoint:**

```typescript
// POST /api/cms/products/[id]/variants/bulk-update
// app/api/cms/products/[id]/variants/bulk-update/route.ts

const bulkVariantUpdateSchema = z.object({
  updates: z.array(z.object({
    variantId: z.string(),
    price: z.number().optional(),
    stock: z.number().optional(),
    sku: z.string().optional(),
    enabled: z.boolean().optional(),
    customFieldValues: z.record(z.string(), z.any()).optional(), // {customFieldId: value}
  }))
})
```

**MCP tool:**

```typescript
server.tool("bulk_update_variants", "Update multiple product variants at once (price, stock, SKU, custom fields)", {
  productId: z.string(),
  updates: z.array(z.object({
    variantId: z.string(),
    price: z.number().optional(),
    stock: z.number().optional(),
    sku: z.string().optional(),
    enabled: z.boolean().optional(),
  })),
}, ...)
```

**Scope:** `products:write` (reuse).

**Internal agent tool:** Extend `lib/cms/ai/tools/product-tools.ts`:

```typescript
export const bulkUpdateVariants = tool({
  description: 'Update multiple variants at once — price, stock, SKU, or enabled state',
  inputSchema: z.object({
    productId: z.string(),
    updates: z.array(z.object({
      variantId: z.string(),
      price: z.number().optional(),
      stock: z.number().optional(),
      sku: z.string().optional(),
      enabled: z.boolean().optional(),
    })),
  }),
  execute: async ({ productId, updates }) => { /* prisma.productVariant.update × N in a transaction */ }
})
```

---

### P2 Gaps (lighter touch)

**G13 — Typed brand preset MCP tool:**

```typescript
// Add to mcp/route.ts
server.tool("get_brand_preset", "Get current Atlas brand preset and density", {}, ...)
server.tool("update_brand_preset", "Update Atlas brand preset and/or density", {
  preset: z.enum(["marigold","boreal","obsidian","meadow"]).optional(),
  density: z.enum(["compact","regular","spacious"]).optional(),
}, ...)
```

New scope: `settings:branding:write`.

**G14 — Page tree MCP tool:**

Extend `list_pages` to accept `tree: true` parameter that returns `{ id, title, slug, status, children[] }` recursively (max depth 3).

**G15 — Discount codes MCP tools:**

```typescript
server.tool("list_discount_codes", "List discount codes", { enabled: z.boolean().optional() }, ...)
server.tool("get_discount_code", "Get a discount code by ID or code string", {
  id: z.string().optional(),
  code: z.string().optional(),
}, ...)
server.tool("create_discount_code", "Create a new discount code", {
  code: z.string(),
  type: z.enum(["PERCENTAGE","FIXED","FREE_SHIPPING"]),
  value: z.number(),
  expiresAt: z.string().optional(),
}, ...)
```

**G16 — Bundle composition MCP:**

```typescript
server.tool("get_bundle_composition", "Get the items in a BUNDLE product", { productId: z.string() }, ...)
server.tool("update_bundle_items", "Set the items in a BUNDLE product", {
  productId: z.string(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number(), priceAdjustment: z.number().optional() })),
  priceMode: z.enum(["fixed","calculated"]).optional(),
}, ...)
```

**G18 — OrderItem config options + attachments:**

Already covered in G01 migration (configOptions Json? and attachments Json? on OrderItem).

**G19 — Analytics time-series in MCP:**

Extend `get_analytics_summary` to support `metric`, `dimension`, `groupBy` params, returning time-series arrays, not just scalar counts.

---

## 5. Sequencing

Post-teammate-merge integration order. Each item has an effort estimate (S = ~2h, M = ~4h, L = ~8h).

| Order | Gap | Deliverable | Effort | Depends on |
|---|---|---|---|---|
| 1 | G01 | `OrderItemFulfillmentStep` model + migration + REST `/orders/[id]/fulfillment/` | M | — |
| 2 | G05 | `lifecycleStage` on Customer + migration + lifecycle REST + MCP tool | S | — |
| 3 | G09 | `PATCH /orders/[id]/stage` REST + `move_order_to_stage` MCP tool | S | — |
| 4 | G03+G04 | BlogSeries + BlogContributor + PostDistributionChannel models + migration + REST endpoints | L | — |
| 5 | G02 | AnalyticsDashboard + AnalyticsWidget + template models + migration + REST CRUD + query endpoint | L | — |
| 6 | G06 | ProductPricingTier + ProductSaleSchedule models + migration + REST + MCP tools | M | — |
| 7 | G07 | Custom field MCP tools + agent tools (no migration) | S | — |
| 8 | G08 | Digital asset + license key REST routes + MCP tools (no migration) | M | — |
| 9 | G10 | CustomerNote model + migration + REST + MCP | S | G05 |
| 10 | G11 | Notification MCP tools + agent tools (no migration) | S | — |
| 11 | G12 | Bulk variant update REST + MCP tool | S | — |
| 12 | G13–G16 | P2 enhancements (brand preset tool, page tree, discounts, bundle MCP) | S each | — |

**Total estimated effort:** ~5 engineering days for all P0+P1 gaps post-merge.

---

## 6. New MCP Scope Additions

The following `resource:action` scopes must be registered in `lib/cms/mcp/scopes.ts`:

```typescript
// Add to MCP_SCOPES:
ORDERS_FULFILLMENT_READ: "orders:fulfillment:read",
ORDERS_FULFILLMENT_WRITE: "orders:fulfillment:write",
ANALYTICS_WRITE: "analytics:write",
ANALYTICS_DASHBOARDS_READ: "analytics:dashboards:read",
ANALYTICS_DASHBOARDS_WRITE: "analytics:dashboards:write",
JOURNAL_READ: "journal:read",
JOURNAL_WRITE: "journal:write",
CUSTOM_FIELDS_READ: "custom_fields:read",
CUSTOM_FIELDS_WRITE: "custom_fields:write",
DIGITAL_ASSETS_READ: "digital_assets:read",
DIGITAL_ASSETS_WRITE: "digital_assets:write",
NOTIFICATIONS_READ: "notifications:read",
NOTIFICATIONS_WRITE: "notifications:write",
PRICING_READ: "pricing:read",
PRICING_WRITE: "pricing:write",
```

Also add these scope groups in `SCOPE_GROUPS`:

```typescript
"Content Distribution": [
  MCP_SCOPES.JOURNAL_READ,
  MCP_SCOPES.JOURNAL_WRITE,
],
"Product Advanced": [
  MCP_SCOPES.CUSTOM_FIELDS_READ,
  MCP_SCOPES.CUSTOM_FIELDS_WRITE,
  MCP_SCOPES.DIGITAL_ASSETS_READ,
  MCP_SCOPES.DIGITAL_ASSETS_WRITE,
  MCP_SCOPES.PRICING_READ,
  MCP_SCOPES.PRICING_WRITE,
],
"Operations": [
  MCP_SCOPES.ORDERS_FULFILLMENT_READ,
  MCP_SCOPES.ORDERS_FULFILLMENT_WRITE,
  MCP_SCOPES.NOTIFICATIONS_READ,
  MCP_SCOPES.NOTIFICATIONS_WRITE,
],
"Analytics": [
  MCP_SCOPES.ANALYTICS_READ,  // existing
  MCP_SCOPES.ANALYTICS_WRITE,
  MCP_SCOPES.ANALYTICS_DASHBOARDS_READ,
  MCP_SCOPES.ANALYTICS_DASHBOARDS_WRITE,
],
```

---

## 7. Summary

| Count | Category |
|---|---|
| 25 | Total redesign capabilities inventoried |
| 5 | P0 gaps (block agent-operability) |
| 7 | P1 gaps (degraded without) |
| 8 | P2 gaps (nice-to-have) |
| 20 | Total gaps |
| 5 | Prisma migrations required (G01, G02, G03+G04, G05, G06, G10) |
| 15 | New MCP scope strings |
| ~25 | New MCP tools needed |
| ~20 | New/extended internal agent tools needed |
| ~20 | New REST route files needed |
