# Atlas Redesign — Completeness & Client-Readiness Audit

**Author:** Atlas A10 (audit agent)
**Date:** 2026-05-17
**Branch:** `feat/atlas-redesign` (Phase 0 + A1–A6 integrated; A7 platform-admin + A9 API layer in progress)
**Source of truth:** `docs/designs/ATLAS-SPEC.md`, `docs/designs/ATLAS-API-PLAN.md`, design chats `cms-ui/chats/chat1–6.md`, `cncpt-web-admin-ui/chats/chat1–3.md`, primary HTML wireframes under `docs/designs/`.

---

## §1 Per-Surface Wireframe Fidelity Gaps

Gaps between what the design + chats specified and what the current implementation delivers. API-layer gaps are already covered by `ATLAS-API-PLAN.md` — those are referenced by gap ID (G01–G20) and not repeated here.

### A1 — Admin Shell + List Pages

Design source: `Atlas v2.html`, `atlas-v2-chrome.jsx`, `atlas-v2-main.jsx`, `atlas-v2-pages.jsx`
Implementation: `app/s/[subdomain]/admin/AdminShell.tsx`, `admin/page.tsx`, `admin/orders/page.tsx`, `admin/pages/page.tsx`, `admin/customers/page.tsx`, `admin/settings/page.tsx`

| # | Design Element | Design Source | Implementation File | Priority |
|---|---|---|---|---|
| A1-01 | **Notifications drawer:** bell pip shows REAL unread count (not static `4`); real-time tab counts (All/Unread/Orders/Stock/Payments/Tickets) from `Notification` table. Bell shows `0` correctly when empty. | `atlas-v2-chrome.jsx` `NotifDrawerAdmin` / chat5 | `components/cms/admin/NotifDrawerAdmin.tsx` — `ADMIN_NOTIFS` is a hardcoded static array; bell badge is hard-wired to `4` | P0 |
| A1-02 | **Dashboard home:** "The almanac." headline with Spectral italic on last word, KPI bricks with sparklines (revenue/orders/customers/conversion), editorial 14-day cadence chart — all using real data, not shadcn card grid | `atlas-v2-main.jsx` Dashboard | `app/s/[subdomain]/admin/page.tsx` — currently renders shadcn `Card` grid layout, not the Atlas editorial main-head + bricks structure. DashboardMetrics widget component is pre-Atlas. | P0 |
| A1-03 | **Orders Board view:** kanban cards must show real per-order workflow stage (`Order.currentStageId`), not just status enum; drag between lanes must call stage-move API (API plan G09) | `atlas-v2-pages.jsx` OrdersBoard | `admin/orders/page.tsx` OrdersBoard — lanes are filtered by `status` enum, not workflow stages; no drag-to-stage action | P0 |
| A1-04 | **Pages Map view:** chapter grouping must use real `Page.parentId` hierarchy — children nest under parents with tree-lines (`└─`); currently groups by a heuristic not hierarchy | `atlas-v2-pages.jsx` PagesMap | `admin/pages/page.tsx` PagesMap `buildMapGroups` — groups root pages but does not properly render grandchildren or show the tree-line visual | P1 |
| A1-05 | **Orders Ledger:** bottom action-bar with keyboard hints `[E] edit [D] duplicate [⌘↩] ship` when rows selected | `atlas-v2-pages.jsx` OrdersLedger + design chat1 | `admin/orders/page.tsx` — selected-row action bar exists but no keyboard hints chips (`.at-kbd`) as designed | P1 |
| A1-06 | **Sidebar "Inbox" section:** lives above numbered nav as a "Quick" group with ✦ glyph and unread count; count comes from real unread `Notification` rows | `atlas-v2-chrome.jsx` sidebar | `AdminShell.tsx` on feat/atlas-redesign — Inbox entry exists in the sidebar but count is static `4` | P1 |
| A1-07 | **Sidebar nav badge on "Orders":** should show real count of open/pending orders from API | `atlas-v2-chrome.jsx` | `AdminShell.tsx` — hardcoded `badge: '12'` on Orders nav item | P1 |
| A1-08 | **Settings page editorial main-head:** eyebrow + italic-accent `h1` layout per Atlas pattern | `atlas-v2-main.jsx` Settings | `admin/site-settings/page.tsx` — fixed in latest commit (38ed1d3); `admin/settings/page.tsx` still uses pre-Atlas heading structure | P2 |
| A1-09 | **Search command bar:** `⌘K` global search hint in topbar should open a real search modal or omnibox, not just focus the input | design chat1, `atlas-v2-chrome.jsx` | `AdminShell.tsx` — `⌘K` chip is rendered but does not trigger any modal | P2 |

### A2 — CMS Editors (Page, Order, Customer)

Design source: `Atlas Editors.html`, `atlas-editors-page.jsx`, `atlas-editors-order.jsx`, `atlas-editors-customer.jsx`
Implementation: `components/cms/editor/PageSettingsEditor.tsx`, `OrderEditor.tsx`, `CustomerEditor.tsx`

| # | Design Element | Design Source | Implementation File | Priority |
|---|---|---|---|---|
| A2-01 | **Order editor sub-fulfillment persist:** step checkboxes toggle optimistically but `handleStepToggle` is a no-op (`await Promise.resolve()`) — changes are lost on refresh. Needs `PATCH /api/cms/orders/[id]/fulfillment/steps/[stepId]` (API plan G01) | `atlas-editors-order.jsx` sub-flow checkboxes / chat2 | `app/s/[subdomain]/admin/orders/[id]/page.tsx` line ~204 | P0 |
| A2-02 | **Order editor aggregate progress strip:** "6/11 sub-tasks" banner at top using real sub-step data | `atlas-editors-order.jsx` progress strip | `components/cms/editor/OrderEditor.tsx` — renders steps from `order.items[].fulfillmentSteps` but the backing model doesn't exist yet (API plan G01) | P0 |
| A2-03 | **Order editor configurable items + attachments:** per-line config options grid, attachment pills (SVG/PDF/IMG), customer note — backed by `OrderItem.configOptions` / `.attachments` JSON | `atlas-editors-order.jsx` chat2 | `OrderEditor.tsx` — renders attachment section; `OrderItem` model still lacks `configOptions`/`attachments` fields (API plan G18) | P1 |
| A2-04 | **Customer editor KPI bricks + cadence chart:** 5 KPI tiles (LTV / orders / AOV / returns / loyalty) + 14-bar monthly chart use hardcoded arrays from the component, not live customer data | `atlas-editors-customer.jsx` / chat2 | `components/cms/editor/CustomerEditor.tsx` lines 109–130 — `kpis` array and `plate` array are computed from whatever the API returns but do not map all 5 KPI bricks correctly; cadence chart has no data-fetch | P1 |
| A2-05 | **Customer editor lifecycle stepper:** shows 5-step ribbon (New→Repeat→Regular→Loyal→VIP) driven by `customer.lifecycleStage` field | `atlas-editors-customer.jsx` / chat5 | `CustomerEditor.tsx` — lifecycle component imported but `lifecycleStage` field doesn't exist on Customer yet (API plan G05) | P1 |
| A2-06 | **Page settings editor:** magazine-style preview pane on the left (read-only render of the actual page) — currently shows a static placeholder, not a real iframe or SSR-rendered preview | `atlas-editors-page.jsx` / chat2 | `components/cms/editor/PageSettingsEditor.tsx` — left pane is static HTML scaffold | P2 |
| A2-07 | **Customer editor: admin notes timeline:** structured list of timestamped notes, not just the single `notes` text field — needs `CustomerNote` model (API plan G10) | `atlas-editors-customer.jsx` chat5 | `CustomerEditor.tsx` — notes section renders; backend is single text blob | P2 |

### A3 — Product Editor

Design source: `Atlas Product Editor.html`, `atlas-product-editor.jsx`, `atlas-product-advanced.jsx`
Implementation: `components/cms/products/ProductEditorAtlas.tsx`, `SpreadsheetGrid.tsx`, `MatrixView.tsx`, `MediaBulkAssign.tsx`, `TypeMorph.tsx`, `CustomFieldsBuilder.tsx`, `BundleComposer.tsx`, `DigitalEditor.tsx`, `PricingStack.tsx`

| # | Design Element | Design Source | Implementation File | Priority |
|---|---|---|---|---|
| A3-01 | **PricingStack — tier/member/sale data:** the four pricing layer sections (base price, qty breaks, member tiers, sale schedule) render correct UI but data arrays are empty `[]` — no Prisma models yet and no API endpoints (API plan G06) | `atlas-product-advanced.jsx` F9 | `ProductEditorAtlas.tsx` lines ~448–460 `pricingTiers`, `memberPricing`, `discountCodes`, `saleSchedule` all hardcoded as empty | P0 |
| A3-02 | **BundleComposer — bundleItems data:** renders correctly but `bundleItems` is always `[]` — `Product.bundleItems` JSON field exists but is never fetched/mapped to the component | `atlas-product-advanced.jsx` F7 | `ProductEditorAtlas.tsx` line ~465 `bundleItems = []` | P1 |
| A3-03 | **SpreadsheetGrid drag-fill + fill-down:** UI cells are selectable but the drag-fill handle and bulk-fill gesture are visual only — no actual data propagation across cells | `atlas-product-editor.jsx` F1 / chat3 | `components/cms/products/SpreadsheetGrid.tsx` — no drag event handlers for fill | P1 |
| A3-04 | **MatrixView heat-coloring:** stock-heat coloring on cells (low stock = amber, OOS = crimson) requires real per-variant stock data | `atlas-product-editor.jsx` F2 | `components/cms/products/MatrixView.tsx` — heat colors are computed from variant stock but require the `SpreadsheetGrid` → API save path to be complete | P1 |
| A3-05 | **CustomFieldsBuilder — field CRUD save path:** field library panel renders; new fields can be composed in the UI but POST/PUT to `/api/cms/custom-fields/` is not wired | `atlas-product-advanced.jsx` F5 / chat3 | `components/cms/products/CustomFieldsBuilder.tsx` — no save handler | P1 |
| A3-06 | **DigitalEditor license key pool:** renders key table but no data fetch; needs `/api/cms/digital-assets/[id]/license-keys/` (API plan G08) | `atlas-product-advanced.jsx` F8 | `components/cms/products/DigitalEditor.tsx` | P1 |
| A3-07 | **TypeMorph migration warning:** gold warning banner when switching between types (e.g. VARIABLE → BUNDLE) with consequences explanation — UI renders but `onTypeChange` should call a validation endpoint before allowing the switch | `atlas-product-advanced.jsx` F4 | `components/cms/products/TypeMorph.tsx` — no server-side migration check | P2 |
| A3-08 | **Bulk variant update endpoint:** SpreadsheetGrid and MatrixView cell edits have no atomic bulk-save — each edit is queued locally but there's no `POST /api/cms/products/[id]/variants/bulk-update` (API plan G12) | chat3 | `SpreadsheetGrid.tsx` `MatrixView.tsx` — no bulk-update call | P1 |

### A4 — Journal / Blog Editor

Design source: `Atlas Journal Editor.html`, `atlas-journal-editor.jsx`
Implementation: `components/cms/editor/journal/`, `admin/blog/[id]/page.tsx`, `admin/blog/new/page.tsx`

| # | Design Element | Design Source | Implementation File | Priority |
|---|---|---|---|---|
| A4-01 | **DistributeTab channel state:** six channel toggles (Web/Newsletter/RSS/X/Mastodon/Instagram) render correctly but no `PostDistributionChannel` model exists — saves are no-ops (API plan G04) | `atlas-journal-editor.jsx` F4 / chat4 | `components/cms/editor/journal/DistributeTab.tsx` — channel data is local state only | P0 |
| A4-02 | **StructureTab series assignment:** series picker renders but `BlogSeries` model doesn't exist (API plan G03) — cannot save or load series membership | `atlas-journal-editor.jsx` F3 / chat4 | `components/cms/editor/journal/StructureTab.tsx` | P0 |
| A4-03 | **StructureTab contributors:** contributor list renders but `BlogContributor` junction model doesn't exist (API plan G03) | `atlas-journal-editor.jsx` F3 | `StructureTab.tsx` | P1 |
| A4-04 | **StructureTab related entries + shop links:** related posts picker and product-link section render but no `BlogPostRelated` / shop link fields (API plan G03, G17) | `atlas-journal-editor.jsx` F3 | `StructureTab.tsx` | P1 |
| A4-05 | **WriteTab prose canvas:** magazine-typography prose area with drop-cap lede, pull-quote block, and floating selection bubble — current TipTap implementation is a toolbar-style editor without these editorial typography affordances | `atlas-journal-editor.jsx` F1 / chat4 | `components/cms/editor/journal/WriteTab.tsx`, `components/cms/editor/TipTapEditor.tsx` | P1 |
| A4-06 | **Distribute schedule strip:** 6-day × 6-channel schedule matrix in F4 is purely visual — no backend scheduling | F4 | `DistributeTab.tsx` | P2 |

### A5 — Analytics Dashboard

Design source: `Atlas Analytics Dashboard.html`, `atlas-analytics-dashboard.jsx`, `atlas-analytics-charts.jsx`
Implementation: `app/s/[subdomain]/admin/analytics/page.tsx`, `components/cms/analytics/`

| # | Design Element | Design Source | Implementation File | Priority |
|---|---|---|---|---|
| A5-01 | **WidgetGrid and all 5 widgets render DEMO_DATA:** F1 view mode shows revenue line chart, orders bar chart, channels donut, top-products table, conversion funnel, and alerts — ALL driven by `DEMO_DATA` from `lib/cms/analytics/demo-data.ts`, not real API data | `atlas-analytics-dashboard.jsx` F1 / chat4 | `components/cms/analytics/widgets.tsx` — all chart data is `DEMO_DATA.*` | P0 |
| A5-02 | **No `AnalyticsDashboard` + `AnalyticsWidget` Prisma models:** widget layout is in-memory (`DEFAULT_ATLAS_LAYOUT`) — adding widgets, changing positions, or saving a custom layout is lost on page refresh (API plan G02) | chat4 | `app/s/[subdomain]/admin/analytics/page.tsx` `useState(DEFAULT_ATLAS_LAYOUT)` | P0 |
| A5-03 | **KPI card sparklines:** `WidgetGrid` KPI sparklines use `DEMO_DATA.revenue30` | chat4 | `components/cms/analytics/WidgetGrid.tsx` line 60 | P0 |
| A5-04 | **QueryBuilder (F4) is visual only:** schema browser, query canvas, and SQL preview are rendered but the "Run" action has no backend endpoint (`POST /api/cms/analytics/query` — API plan G02) | `atlas-analytics-dashboard.jsx` F4 | `components/cms/analytics/QueryBuilder.tsx` | P1 |
| A5-05 | **TemplateLibrary (F5) is visual only:** template tiles and saved-dashboard table are static; no persistence layer | `atlas-analytics-dashboard.jsx` F5 | `components/cms/analytics/TemplateLibrary.tsx` | P1 |
| A5-06 | **Real-time alerts row in F1:** "Low stock" and "Abandoned cart" alert items use `DEMO_DATA.alerts` | atlas-analytics-dashboard.jsx | `components/cms/analytics/widgets.tsx` | P1 |

### A6 — Storefront + Customer Account

Design source: `Atlas Customer Dashboard.html`, `atlas-customer-*.jsx`
Implementation: `app/s/[subdomain]/(storefront)/`, `app/s/[subdomain]/(account)/`, `components/cms/account/`, `components/cms/storefront-wl/`

| # | Design Element | Design Source | Implementation File | Priority |
|---|---|---|---|---|
| A6-01 | **Account Inbox (`/account/inbox`):** `MESSAGES` const array is fully hardcoded — not fetched from `Notification` table | `atlas-customer-main.jsx` bell / chat5 | `app/s/[subdomain]/(account)/account/inbox/page.tsx` — `MESSAGES` is a static const | P0 |
| A6-02 | **NotifDrawer (storefront):** `SAMPLE_NOTIFS` is a hardcoded static array | `atlas-customer-main.jsx` bell / chat5 | `components/cms/account/NotifDrawer.tsx` | P0 |
| A6-03 | **Account home — AccountBricks data:** `storeCredit`, `loyaltyPts`, `activeSubs`, `openOrders` props are hardcoded as `$0.00` / `0` / `0` / `0` — never fetched | `atlas-customer-home.jsx` D1 / chat5 | `app/s/[subdomain]/(account)/account/page.tsx` — props passed as literals | P0 |
| A6-04 | **Account home — LifecycleRibbon:** `current` prop is not passed — defaults to `'loyal'`; needs real `customer.lifecycleStage` from API (API plan G05) | `atlas-customer-home.jsx` D1 / chat5 | `account/page.tsx` — `<LifecycleRibbon />` rendered without `current` prop | P0 |
| A6-05 | **Account home — OwnerGreeting:** `message`, `ownerName`, `ownerInitial` are hardcoded strings — should come from `TenantSetting.ownerGreeting` or a CMS field | chat5 | `account/page.tsx` | P1 |
| A6-06 | **Loyalty page (D7):** fully hardcoded — `TIERS`, `CURRENT_TIER`, `CURRENT_PTS`, `REWARDS`, `ACTIVITY` are all static consts. No loyalty model exists at all. | `atlas-customer-returns-loyalty.jsx` / chat6 | `account/loyalty/page.tsx` | P0 |
| A6-07 | **Returns page (D6):** `ELIGIBLE` and `PAST_RETURNS` are hardcoded consts — not fetched from Orders or any returns model | `atlas-customer-returns-loyalty.jsx` / chat6 | `account/returns/page.tsx` | P1 |
| A6-08 | **Wishlist page (D5):** `ITEMS` const is fully hardcoded — no `Wishlist` model or `/api/cms/account/wishlist` route exists | `atlas-customer-wishlist.jsx` / chat6 | `account/wishlist/page.tsx` | P1 |
| A6-09 | **Subscriptions page (D4):** page renders layout shell but has no data fetch — no subscription model is wired | `atlas-customer-subs.jsx` / chat6 | `account/subscriptions/page.tsx` | P1 |
| A6-10 | **Storefront chrome — mobile nav missing notification bell:** design shows bell with pip in mobile header | `atlas-customer-mobile.jsx` / chat5 | `app/s/[subdomain]/(storefront)/mobile-nav.tsx` — no bell | P2 |
| A6-11 | **Account sidebar — missing nav items:** Subscriptions, Wishlist, Loyalty, Returns, Reviews, Inbox not all consistently linked in the account layout sidebar | `atlas-customer-shared.jsx` / chat5 | `components/cms/account/AccountSidebar.tsx` — verify all 10 sections linked | P2 |
| A6-12 | **Desktop account layout — no sidebar rendered:** `app/s/[subdomain]/(account)/layout.tsx` wraps in `PageWrapper` only; `AccountSidebar` is not rendered in the layout — each page must include it manually or it's missing | `atlas-customer-main.jsx` D1 | `(account)/layout.tsx` | P1 |

---

## §2 Client-Readiness Functional Gaps

The bar is: the owner can onboard real paying customers/clients on this site.

### 2.1 System Pages (404 / 500 / Maintenance)

| # | Gap | Route/File | Priority |
|---|---|---|---|
| R01 | **404 page customizable framework: EXISTS** — `app/s/[subdomain]/not-found.tsx` + `app/api/cms/admin/system-pages/` + `admin/pages/_components/system-pages-section.tsx` (commit `8a50b0f`). Atlas-styled with `BlockPageRenderer`. Functional. | `not-found.tsx`, system-pages API | — DONE |
| R02 | **500 error page: NOT customizable** — Next.js uses `app/error.tsx` globally. No tenant-specific customizable 500 page exists. The `system-pages-section.tsx` has UI rows for 500 and Maintenance (marked `comingSoon: true`) but no `__system/server-error` Page row or `app/s/[subdomain]/error.tsx` handler | `app/s/[subdomain]/error.tsx` — does not exist | P1 |
| R03 | **Maintenance page: framework exists** (storefront layout checks `shouldShowMaintenance()` and renders `<MaintenancePage />`). However the maintenance page content is not Atlas-styled and is not editable by the tenant — it shows a generic fallback, not a block-editor customizable page | `(storefront)/layout.tsx`, `components/cms/storefront/MaintenancePage` | P1 |
| R04 | **404 default fallback is not Atlas-styled** — when a tenant has NOT customized their 404, the fallback in `not-found.tsx` uses a `bg-gradient-to-b from-gray-50` + blue `bg-blue-600` button, which does not use `--wl-*` tokens or Atlas typography | `app/s/[subdomain]/not-found.tsx` lines 131–149 | P1 |

### 2.2 Automations / Workflows Depth

| # | Gap | Route/File | Priority |
|---|---|---|---|
| R05 | **Cron automations exist (3 of 6 needed):** `cart-abandonment`, `inventory`, `review-requests` cron routes exist. Missing: order-status email triggers (order placed, shipped, delivered), low-stock notification push to admin, and abandoned-cart to customer notifications. The existing `cart-abandonment` cron marks carts and calls `getAbandonedCartsForRecovery` but the actual email-send step is stubbed with a `TODO` comment | `app/api/cms/cron/cart-abandonment/route.ts` | P0 |
| R06 | **Workflows (general) are MANUAL/SCHEDULE/WEBHOOK/EVENT/AI_AGENT triggers only** — no pre-built "order status changed" trigger type. Merchants need order-lifecycle automations (e.g., "when order ships → send email") without writing code. The workflow editor at `/admin/workflows/[id]/edit` is a form, not a visual no-code builder. | `app/s/[subdomain]/admin/workflows/[id]/edit/page.tsx` | P1 |
| R07 | **Order-workflow kanban drag doesn't email customers** — when a merchant drags an order to a stage that has `customerMessage`, no email/notification is triggered. The `OrderWorkflowStage.customerMessage` field exists in the schema but no event fires on stage change. | `app/api/cms/workflows/`, `OrderEditor.tsx` | P1 |
| R08 | **No abandoned-cart email sender wired** — the cron route identifies abandoned carts and calls `markRecoveryEmailSent` but the actual email delivery (via email provider settings) is not implemented | `app/api/cms/cron/cart-abandonment/route.ts` | P0 |
| R09 | **Review-requests cron exists** but does not wire to email provider — `review-requests/route.ts` exists but the email send is presumably also stubbed | `app/api/cms/cron/review-requests/route.ts` | P1 |

### 2.3 Cross-Cutting Readiness

| # | Gap | Route/File | Priority |
|---|---|---|---|
| R10 | **Empty states missing on most Atlas surfaces:** orders board shows no "No orders" message when filtered lanes are empty; products spreadsheet has no zero-state; analytics shows DEMO_DATA instead of a "connect your data" empty state | Multiple admin pages | P1 |
| R11 | **Loading states:** most Atlas surface pages use a simple text spinner; the design shows editorial `atlas`-class loading skeletons with paper background. Pages with sub-component data fetches (CustomerEditor, OrderEditor) show blank areas during fetch | `admin/orders/page.tsx`, `admin/customers/[id]/page.tsx` | P1 |
| R12 | **Error boundaries missing on Atlas surfaces:** no `error.tsx` or `<ErrorBoundary>` wrapping the analytics, product editor, or customer dashboard — a failed API call will throw an uncaught React error | `admin/analytics/page.tsx`, `products/ProductEditorAtlas.tsx` | P1 |
| R13 | **Auth/onboarding flow into admin:** new tenant after sign-up lands at `/admin` — the `BusinessOwnerWizard` exists (`components/cms/admin/BusinessOwnerWizard.tsx`) but is not shown unless explicitly triggered. No forced onboarding flow for first-time admins. | `admin/page.tsx` | P1 |
| R14 | **Cart → checkout → order flow:** storefront layout, cart page, checkout success/cancel pages exist. The `CartMergeOnLogin` component handles anonymous cart merge. This flow is functionally complete. Stripe checkout is wired. **Atlas brand tokens are NOT applied to cart/checkout pages** — they use `bg-background` shadcn classes, not `--wl-*` tokens. | `(storefront)/cart/page.tsx`, `(storefront)/checkout/` | P1 |
| R15 | **Notifications drawer admin: not wired to real data** — the admin bell shows `4 unread` and renders `ADMIN_NOTIFS` static array even for tenants with real notifications (see A1-01). Blocking for any client-facing deployment. | `NotifDrawerAdmin.tsx`, `admin/AdminShell.tsx` | P0 |
| R16 | **Settings save paths:** `admin/settings/page.tsx` has extensive tabs (general, branding, email, shipping, SEO, etc.). Branding save path (`PATCH /api/cms/admin/branding`) exists and is verified. Email provider settings (`EmailProviderSettings.tsx`) save path exists. **`brandPreset` and `density` controls in BrandingSettings need to confirm they write `brandPreset`/`density` to `TenantSetting` and that `ThemeInjector` picks them up per the Phase-0 spec.** | `admin/settings/page.tsx`, `components/cms/admin/BrandingSettings.tsx` | P1 |
| R17 | **Mobile/responsive of new desktop-fixed designs:** A1 AdminShell has mobile sidebar with backdrop — verified present. Atlas product editor (SpreadsheetGrid, MatrixView) uses overflow-x scroll on mobile. Customer account pages use `--wl-*` inline styles without responsive breakpoints. The designs are explicitly desktop-first; mobile is stated as "companion" but the account pages have no responsive layout adaptation below 640px | All Atlas surfaces | P1 |
| R18 | **Accessibility — Atlas surfaces:** `.atlas` shell removes icon-only buttons from the pre-Atlas shell (no icon-label pairs). The notification bell has `title` but no `aria-label`. `NotifDrawerAdmin` has no focus trap when open. `.tbl` tables in OrdersLedger and CustomersPage have `sort ↓` markers that are not `aria-sort` attributes. | `AdminShell.tsx`, `NotifDrawerAdmin.tsx`, `admin/orders/page.tsx` | P1 |
| R19 | **A11y — Obsidian dark preset:** the Obsidian preset (`--wl-canvas:#1a1a1d`, `--wl-text:#f0ede5`) is dark. Atlas accent in Obsidian is `#d4a84b` (gold). `pill-out-accent` + `pill-out` borders use `--rule` with `rgba(240,237,229,.16)` which is ~3:1 contrast on `#1a1a1d` background — below WCAG AA for normal text | `app/atlas.css`, `globals.css` `[data-brand="obsidian"]` | P1 |
| R20 | **Dead/placeholder routes:** `/admin/discounts/page.tsx`, `/admin/email-marketing/page.tsx`, `/admin/events/page.tsx`, `/admin/features/page.tsx`, `/admin/marketplace/page.tsx` — these pages likely render pre-Atlas shells or placeholders. Not yet Atlas-reskinned. | Multiple admin pages | P2 |
| R21 | **`/admin/products/[id]/page.tsx` is a stub** — only 27 lines of changes in the integration commit; it wraps `ProductEditorAtlas` but the product route at `[id]` needs the full atlas product editor, not a thin shell. Verify the product `[id]` route is fully functional. | `app/s/[subdomain]/admin/products/[id]/page.tsx` | P0 |
| R22 | **`/account/reviews/page.tsx` is purely structural** — no API endpoint exists to fetch customer-authored reviews or allow writing a new one. | `account/reviews/page.tsx` | P2 |
| R23 | **`/account/communications/page.tsx` and `/account/notifications/page.tsx`** — `communications` was added but may overlap with `inbox`; need to verify these are distinct and wired | `account/communications/`, `account/notifications/` | P2 |

---

## §2b Mock-Data → Real-Source Wiring Map

**Authoritative spec for the data-wiring phase.** Every hardcoded / demo / placeholder data source in integrated Atlas surfaces, with its real backing target.

> Legend: P0 = on a core client flow (orders, products, customers, checkout, notifications, analytics a merchant relies on) | P1 = important | P2 = deferred

### Admin Notification Drawer

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `components/cms/admin/NotifDrawerAdmin.tsx` | `ADMIN_NOTIFS` — static readonly array of 8 admin notifications | ~40–90 | `GET /api/cms/notifications?type=admin&limit=50` → `Notification` table, filtered to current tenant. Endpoint exists at `app/api/cms/notifications/route.ts`. Bell badge count: `GET /api/cms/notifications/unread-counts`. | P0 |
| `AdminShell.tsx` (feat/atlas-redesign) | `badge: '12'` on Orders nav item | sidebar DEFAULT_NAV | `GET /api/cms/admin/stats-simple` (already fetched on dashboard) — re-use `totalOrders` or add `pendingOrders` field | P1 |
| `AdminShell.tsx` | `badge: '4'` on Inbox / bell pip | bell button hard-wired | Same as ADMIN_NOTIFS unread-counts endpoint above | P0 |

### Analytics Dashboard

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `components/cms/analytics/widgets.tsx` | `DEMO_DATA.revenue30`, `DEMO_DATA.prevRevenue30`, `DEMO_DATA.days` (revenue line chart) | ~92–95 | `GET /api/cms/analytics?range=30d` — existing endpoint. Response needs `timeSeries: {date, revenue}[]` field. Currently the endpoint returns scalar `overview.revenue` only. Extend to include time-series. | P0 |
| `components/cms/analytics/widgets.tsx` | `DEMO_DATA.ordersDays` (orders bar chart) | ~128 | Same endpoint, add `timeSeries: {date, orders}[]` field | P0 |
| `components/cms/analytics/widgets.tsx` | `DEMO_DATA.channels` (donut chart) | ~142–149 | `salesByChannel` array already in analytics endpoint response (`GET /api/cms/analytics`) | P0 |
| `components/cms/analytics/widgets.tsx` | `DEMO_DATA.topProducts` (top-products table) | ~184 | `topProducts` array already in analytics endpoint response | P0 |
| `components/cms/analytics/widgets.tsx` | `DEMO_DATA.funnel` (conversion funnel) | ~218 | No backing data — needs new `conversionFunnel` field in analytics endpoint: `[{label:'Visits',v:N},{label:'Add to cart',v:N},{label:'Checkout',v:N},{label:'Paid',v:N}]` derived from `AnalyticsEvent` or cart/order counts | P1 |
| `components/cms/analytics/widgets.tsx` | `DEMO_DATA.activity` (activity feed) | ~249 | `recentActivity` array already in analytics endpoint response | P1 |
| `components/cms/analytics/widgets.tsx` | `DEMO_DATA.alerts` (alert items) | ~268 | New field in analytics endpoint — derive from `Notification` rows with `type IN ('STOCK','ORDER')` flagged as urgent | P1 |
| `components/cms/analytics/WidgetGrid.tsx` | `DEMO_DATA.revenue30` (KPI sparkline) | ~60 | Same time-series extension as above | P0 |
| `app/s/[subdomain]/admin/analytics/page.tsx` | `DEFAULT_ATLAS_LAYOUT` in `useState` (layout lost on refresh) | top-level state | `GET /api/cms/analytics/dashboards` → `AnalyticsDashboard` model (API plan G02 — not yet implemented). Until G02 lands: store layout in `localStorage` keyed by `tenantId` as interim. | P0 |

### Customer Account — Notifications / Inbox

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `components/cms/account/NotifDrawer.tsx` | `SAMPLE_NOTIFS` — 5 hardcoded notification items | ~14–60 | `GET /api/cms/notifications?userId={currentUser}` → `Notification` table filtered by current user. Endpoint exists. | P0 |
| `app/s/[subdomain]/(account)/account/inbox/page.tsx` | `MESSAGES` — 7 hardcoded InboxMessage items | ~24–50 | Same as above — `GET /api/cms/notifications?userId={currentUser}` with `entityType` to differentiate kind | P0 |

### Customer Account — Dashboard Home (AccountBricks, LifecycleRibbon, OwnerGreeting)

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `app/s/[subdomain]/(account)/account/page.tsx` | `storeCredit="$0.00"` `loyaltyPts={0}` `activeSubs={0}` `openOrders={0}` passed to `AccountBricks` | ~65–70 | New customer account summary endpoint: `GET /api/cms/account/summary` returning `{storeCredit, loyaltyPoints, activeSubs, openOrders}`. No such endpoint exists — create it under `app/api/cms/account/summary/route.ts` using: store credit from `Customer.storeCredit`, loyalty from `Customer.loyaltyPoints`, subs from `Order` subscription count, open orders from `Order` with `status NOT IN (delivered, cancelled)`. NOT in API plan — needs planning. | P0 |
| `account/page.tsx` | `<LifecycleRibbon />` with no `current` prop (defaults to `'loyal'`) | ~80 | `GET /api/cms/account/summary` (above) or `GET /api/cms/admin/customers/me` — include `lifecycleStage` field. Requires API plan G05 (`CustomerLifecycleStage` enum on Customer model). | P0 |
| `account/page.tsx` | `<OwnerGreeting ownerName="Marisol" ownerInitial="M" message="hardcoded text" />` | ~90 | `GET /api/cms/settings?key=owner_greeting` or a new `TenantSetting.ownerGreeting` field. No existing endpoint — add key to `update_setting` MCP tool spec. Not in API plan. | P1 |

### Customer Account — Loyalty

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `app/s/[subdomain]/(account)/account/loyalty/page.tsx` | `TIERS`, `CURRENT_TIER`, `CURRENT_PTS`, `NEXT_TIER_PTS`, `REWARDS`, `ACTIVITY` — fully hardcoded | entire file | No loyalty model exists in the schema. Requires new design decision: implement a lightweight loyalty table or integrate with existing `Customer.loyaltyPoints` field. Minimum: `GET /api/cms/account/loyalty` returning `{tier, points, nextTierPts, rewards[], activityLog[]}`. **No Prisma model, no endpoint — this is a net-new capability not in the API plan.** | P0 |

### Customer Account — Returns

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `app/s/[subdomain]/(account)/account/returns/page.tsx` | `ELIGIBLE`, `PAST_RETURNS`, `STEPS` — all static | ~14–30 | No returns model. Minimum: `GET /api/cms/account/returns` returning `{eligible: Order.items[], pastReturns: ReturnRequest[]}`. Requires a `ReturnRequest` model (not in schema, not in API plan). Interim: derive eligible items from `Order` rows within return window. | P1 |

### Customer Account — Wishlist

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `app/s/[subdomain]/(account)/account/wishlist/page.tsx` | `ITEMS` — 8 hardcoded wishlist items with stock tags | ~28–45 | No `Wishlist`/`WishlistItem` model in schema. Requires new model + `GET /api/cms/account/wishlist`. The tags (BACK IN STOCK, SALE, OOS) must be derived from live `Product.stock`/`ProductVariant.stock`. **Not in API plan.** | P1 |

### Customer Account — Subscriptions

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `app/s/[subdomain]/(account)/account/subscriptions/page.tsx` | Entire page is layout scaffold with no data | entire file | `GET /api/cms/account/subscriptions` → Orders with `type=SUBSCRIPTION` or a `Subscription` model. Currently no subscription-specific route for the customer side. | P1 |

### Order Editor — Sub-Fulfillment

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `app/s/[subdomain]/admin/orders/[id]/page.tsx` | `handleStepToggle` is `await Promise.resolve()` (no-op) | ~204 | `PATCH /api/cms/orders/[id]/fulfillment/steps/[stepId]` — per API plan G01. Model (`OrderItemFulfillmentStep`) does not exist yet. | P0 |

### Product Editor — Pricing Stack

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `components/cms/products/ProductEditorAtlas.tsx` | `pricingTiers = []`, `memberPricing = []`, `discountCodes = []`, `saleSchedule = null` | ~448–460 | `GET /api/cms/products/[id]/pricing-tiers` and `GET /api/cms/products/[id]/sale-schedules` — per API plan G06. Models (`ProductPricingTier`, `ProductSaleSchedule`) do not exist yet. `discountCodes` can come from existing `GET /api/cms/discounts`. | P0 |
| `components/cms/products/ProductEditorAtlas.tsx` | `bundleItems = []` | ~465 | `product.bundleItems` JSON field exists in schema; must be fetched as part of `GET /api/cms/products/[id]` response and mapped to `AtlasBundleItem[]`. REST endpoint exists; verify `bundleItems` is included in the response payload. | P1 |

### Dashboard Home — Admin

| File | Mock Symbol | Lines | Real Source | Priority |
|---|---|---|---|---|
| `app/s/[subdomain]/admin/page.tsx` (Atlas version) | `DEMO_USER.displayName` used in display name when `isDemo` | ~106 | `lib/demo.ts` — demo mode only; real auth path is correct. Not a client-data issue. | — |
| `admin/page.tsx` | Hardcoded `badge: '12'` on Orders in AdminShell nav | `AdminShell.tsx` DEFAULT_NAV | `GET /api/cms/admin/stats-simple` `totalOrders` field. Add `pendingOrders` count to the endpoint. | P1 |

### Missing Wiring Not Covered in ATLAS-API-PLAN.md (Net-New)

These mock sources have no existing API plan item:

| # | File | Mock | Required Endpoint | Priority |
|---|---|---|---|---|
| NW-01 | `account/loyalty/page.tsx` | `TIERS`, `CURRENT_PTS`, `REWARDS`, `ACTIVITY` | `GET /api/cms/account/loyalty` — new, requires `LoyaltyTier` + `LoyaltyReward` + `LoyaltyActivity` models or a lightweight JSON config. Add to API plan. | P0 |
| NW-02 | `account/page.tsx` | `AccountBricks` zeroed props | `GET /api/cms/account/summary` — new | P0 |
| NW-03 | `account/page.tsx` | `OwnerGreeting` hardcoded strings | `TenantSetting.ownerGreeting` field + settings endpoint | P1 |
| NW-04 | `account/returns/page.tsx` | `ELIGIBLE`, `PAST_RETURNS` | `GET /api/cms/account/returns` — requires `ReturnRequest` model. Add to API plan. | P1 |
| NW-05 | `account/wishlist/page.tsx` | `ITEMS` | `GET /api/cms/account/wishlist` — requires `WishlistItem` model. Add to API plan. | P1 |
| NW-06 | `account/subscriptions/page.tsx` | empty layout | `GET /api/cms/account/subscriptions` | P1 |
| NW-07 | `admin/analytics/page.tsx` | `DEFAULT_ATLAS_LAYOUT` in state | `GET /api/cms/analytics/dashboards` (part of G02) OR `localStorage` interim | P0 |
| NW-08 | `analytics/widgets.tsx` | `DEMO_DATA.funnel` (no backing query) | Extend analytics endpoint with funnel data from cart + order counts | P1 |
| NW-09 | `analytics/widgets.tsx` | `DEMO_DATA.alerts` | Derive from `Notification` rows in analytics endpoint | P1 |

---

## §3 Explicitly Out of Scope — Defer

The following are confirmed deferred by owner direction. Listed here so they are tracked but not actioned now.

| Item | Reason for Deferral |
|---|---|
| **Marketplace / addons system** — `/admin/marketplace/page.tsx`, plugin install/uninstall, third-party integrations directory | Future phase; no current design spec beyond placeholder |
| **Marketing pages redesign** — `app/page.tsx`, `/pricing`, `/about`, `/blog` (root, not tenant) | Separate design cycle; Atlas is scoped to tenant admin/storefront |
| **Deep block-editor feature expansion** — new block types, animation blocks, collaborative editing, version history diff viewer | Core block-editor is functional; expansions are post-launch |
| **A7 Platform-admin** — `cncpt-web-admin-ui` surfaces (Tenant Admin Canvas, All Tabs Wireframe) | In progress in parallel worktree; audit separately when complete |
| **A9 API layer** — all items in `ATLAS-API-PLAN.md` (G01–G20) | Being built in parallel; this audit references gap IDs but does not re-plan them |
| **Subscription editor (F10)** — the only product type not yet wireframed | Noted in chat3 as a future frame |
| **Email campaign composer** (`/admin/email-marketing/`) | Requires a third-party integration (Resend/Mailchimp); not in Atlas design scope |

---

## §4 Execution Plan

For every P0 and P1 item above. Each row: files to create/modify, concrete change description, effort S(~2h)/M(~4h)/L(~8h), sequence.

### Phase 1 — P0 Blockers (do first, in this order)

| Seq | Item(s) | Files to Create/Modify | Change | Effort |
|---|---|---|---|---|
| 1 | A1-01, R15 — Admin notification drawer real data | `components/cms/admin/NotifDrawerAdmin.tsx` | Replace `ADMIN_NOTIFS` static array with a `useEffect` that fetches `GET /api/cms/notifications?limit=20&unreadOnly=false` on mount. Use the existing endpoint. Map response `Notification[]` to `AdminNotif[]`. Replace hardcoded bell badge with unread count from `GET /api/cms/notifications/unread-counts`. Add SWR or polling every 30s. | M |
| 2 | A6-01, A6-02 — Customer notification drawer + inbox real data | `components/cms/account/NotifDrawer.tsx`, `account/inbox/page.tsx` | Replace `SAMPLE_NOTIFS` and `MESSAGES` static consts with `useEffect` fetch `GET /api/cms/notifications?userId=me`. Create a shared `useCustomerNotifications` hook analogous to `useCustomerOrders`. | M |
| 3 | A6-03, A6-04 — AccountBricks + LifecycleRibbon real data | `account/page.tsx`, `app/api/cms/account/summary/route.ts` (create) | Create `GET /api/cms/account/summary` route: query `Customer` for `storeCredit`, `loyaltyPoints` (if field exists), count `Order WHERE status NOT IN (delivered,cancelled)` for openOrders, count subscription orders for activeSubs. Pass result props to `AccountBricks`. Pass `lifecycleStage` (after G05) or `'new'` as default to `LifecycleRibbon`. | M |
| 4 | A6-06 — Loyalty page real data | `account/loyalty/page.tsx`, `app/api/cms/account/loyalty/route.ts` (create), schema: add `Customer.loyaltyPoints Int @default(0)`, `LoyaltyReward` model | Create endpoint + data model. Rewards can be JSON config in `TenantSetting.loyaltyRewards`. Tier thresholds hardcoded as tenant-configurable defaults. | L |
| 5 | A5-01, A5-03 — Analytics WidgetGrid/widgets real data | `components/cms/analytics/widgets.tsx`, `components/cms/analytics/WidgetGrid.tsx`, `app/api/cms/analytics/route.ts` | Extend analytics API to include `timeSeries` (daily revenue + orders for date range), expand `channels` to map to donut. Replace all `DEMO_DATA.*` calls with props passed from `analytics/page.tsx` which fetches the API. Keep `DEMO_DATA` as a fallback for new tenants with no data. | L |
| 6 | A5-02, NW-07 — Analytics layout persistence | `account/analytics/page.tsx` | Interim: `localStorage` keyed `atlas-dashboard-layout-{tenantId}` until G02 lands. Replace `useState(DEFAULT_ATLAS_LAYOUT)` with a `useLocalStorageState` hook. | S |
| 7 | A3-01 — PricingStack real data | `components/cms/products/ProductEditorAtlas.tsx`, `app/api/cms/products/[id]/route.ts` | Map `product.discountCodes` (existing `DiscountCode[]` relation) to `discountCodes` prop. `pricingTiers`, `memberPricing`, `saleSchedule` remain `[]`/`null` until G06 ships. Remove "mock data" comment and add TODO linking to API plan G06. | S |
| 8 | A2-01 — Order sub-fulfillment step toggle | `app/s/[subdomain]/admin/orders/[id]/page.tsx` | Wire `handleStepToggle` to `PATCH /api/cms/orders/{id}/fulfillment/steps/{stepId}` per API plan G01 ONCE G01 endpoint is built. Until then: show "Saving disabled — fulfillment API pending" toast. Remove silent no-op. | S |
| 9 | R05, R08 — Cart abandonment email sender | `app/api/cms/cron/cart-abandonment/route.ts` | Implement the email-send step using the tenant's configured email provider (`EmailProvider` settings). Use `@sendgrid/mail` or `resend` SDK. Send to `customer.email` from abandoned cart. | M |
| 10 | R21 — Products `[id]` route verify | `app/s/[subdomain]/admin/products/[id]/page.tsx` | Read current file (only 27 lines post-integration). Ensure it correctly renders `ProductEditorAtlas` with product data from `GET /api/cms/products/[id]`. Verify all 9 tabs are accessible. | S |

### Phase 2 — P1 Notable (after Phase 1)

| Seq | Item(s) | Files to Create/Modify | Change | Effort |
|---|---|---|---|---|
| 11 | A1-02 — Dashboard home Atlas layout | `admin/page.tsx` (atlas version) | Replace shadcn card grid with Atlas editorial main-head ("The almanac." + italic last word), KPI bricks row (4 bricks: revenue/orders/customers/conversion), and 14-day cadence SVG chart using existing `DashboardMetrics` data. Use atlas.css classes `.main-head`, `.eyebrow`, `.display`, `.display-i`. | M |
| 12 | A1-03 — Orders Board kanban stages | `admin/orders/page.tsx` OrdersBoard | Fetch tenant's active `OrderWorkflow` + stages. Map orders to lanes by `order.currentStageId` instead of status enum. Lane headers show stage name. | M |
| 13 | A6-12 — Account layout sidebar | `(account)/layout.tsx`, `components/cms/account/AccountSidebar.tsx` | Add `<AccountSidebar />` into the layout so all account pages share it without re-including it. Verify all 10 sections are linked. | S |
| 14 | R02 — 500 error page customizable | `app/s/[subdomain]/error.tsx` (create), `admin/pages/_components/system-pages-section.tsx`, `app/api/cms/admin/system-pages/` | Follow the same pattern as 404: `error.tsx` at `app/s/[subdomain]/` level loads `__system/server-error` Page row if published, else falls back to default. Add to `system-pages-section.tsx` as live (remove `comingSoon: true`). | M |
| 15 | R03, R04 — 404 + Maintenance Atlas styling | `app/s/[subdomain]/not-found.tsx`, `components/cms/storefront/MaintenancePage` | Change fallback `not-found.tsx` to use `--wl-*` tokens (`background: var(--wl-bg)`, `color: var(--wl-text)`, button `background: var(--wl-accent)`). Atlas-style `MaintenancePage`. | S |
| 16 | A2-05 — Customer lifecycle stepper | `components/cms/editor/CustomerEditor.tsx` | After G05 lands: pass `customer.lifecycleStage` to `LifecycleRibbon`; add "Update stage" dropdown with `PATCH /api/cms/admin/customers/[id]` save. | S |
| 17 | A3-05 — CustomFieldsBuilder save | `components/cms/products/CustomFieldsBuilder.tsx` | Wire "Create field" to `POST /api/cms/custom-fields/` (existing endpoint). Wire "Attach field to product" to `POST /api/cms/products/[id]/custom-fields/`. | S |
| 18 | R12 — Error boundaries | `admin/analytics/page.tsx`, `products/[id]/page.tsx`, `customers/[id]/page.tsx` | Wrap each surface page in a local `<ErrorBoundary fallback={<AtlasErrorState />}>`. Create `components/cms/admin/AtlasErrorState.tsx` using atlas.css classes. | S |
| 19 | R10 — Empty states | `admin/orders/page.tsx`, `admin/products/page.tsx`, `admin/analytics/page.tsx` | Add `EmptyState` components: orders board empty lane ("No orders in this stage"), product list empty ("Add your first product →"), analytics "No data yet — your first order will appear here." Use atlas.css typography. | S |
| 20 | R18 — A11y fixes | `AdminShell.tsx`, `NotifDrawerAdmin.tsx`, `admin/orders/page.tsx` | Add `aria-label` to bell button; add `role="dialog" aria-modal="true"` + focus trap to notification drawer; add `aria-sort` to sortable `<th>` in `.tbl` tables. | S |
| 21 | A4-05 — WriteTab editorial typography | `components/cms/editor/journal/WriteTab.tsx`, `TipTapEditor.tsx` | Add TipTap `Drop Cap` extension or CSS `first-letter::` rule on `.ProseMirror p:first-of-type`. Add pull-quote block type to block palette. These are TipTap extension additions, not schema changes. | M |
| 22 | A1-04 — Pages Map hierarchy | `admin/pages/page.tsx` `buildMapGroups` | Fix `buildMapGroups` to recursively place children under their parents using `page.parentId`, rendering up to 2 levels with tree-line CSS (`│ └─`). | S |
| 23 | R14 — Cart/checkout Atlas brand tokens | `(storefront)/cart/page.tsx`, `checkout/success/page.tsx` | Apply `--wl-*` CSS variables to cart and checkout pages. Replace `bg-background`/`text-foreground` Tailwind classes with inline `style={{ background: 'var(--wl-bg)', color: 'var(--wl-text)' }}` or add `data-brand` scope. | M |
| 24 | A6-07, NW-04 — Returns real data | `account/returns/page.tsx`, `app/api/cms/account/returns/route.ts` (create) | Create endpoint: query `Order.items` within configurable return window (default 30 days from delivery). Past returns: if no `ReturnRequest` model, query `Refund` table as proxy. | M |
| 25 | A6-08, NW-05 — Wishlist real data | `account/wishlist/page.tsx`, `app/api/cms/account/wishlist/route.ts` (create), schema: new `WishlistItem` model | Minimum model: `WishlistItem { id, userId, productId, variantId?, addedAt }`. Create endpoint. Tags derived from live product stock. | M |

### Phase 3 — P2 Polish (after Phase 2)

| Seq | Item(s) | Files | Change | Effort |
|---|---|---|---|---|
| 26 | A1-08 — Settings heading Atlas | `admin/settings/page.tsx` | Add editorial `main-head` with eyebrow + `.display` `.display-i` h1 per atlas.css spec | S |
| 27 | A1-09 — ⌘K modal | `AdminShell.tsx`, new `components/cms/admin/CommandModal.tsx` | Wire ⌘K to open cmdk command palette with search across products/orders/customers | M |
| 28 | A3-03 — SpreadsheetGrid drag-fill | `SpreadsheetGrid.tsx` | Implement cell drag-fill handle: mousedown on handle → mousemove to select range → mouseup to propagate active cell value | M |
| 29 | A2-06 — Page settings preview | `PageSettingsEditor.tsx` | Replace static scaffold with `<iframe>` pointing to `/?preview=true&pageId={id}` using Next.js preview mode | M |
| 30 | R19 — Obsidian contrast fix | `app/globals.css` Obsidian block | Increase `--wl-rule-soft` opacity in Obsidian to `rgba(240,237,229,.28)` and verify pill-out borders meet 3:1+ contrast. Add a11y comment. | S |
| 31 | R20 — Placeholder routes | `admin/discounts/`, `admin/email-marketing/`, `admin/events/`, `admin/features/`, `admin/marketplace/` pages | Apply Atlas editorial `main-head` and "coming soon" placeholder copy using atlas.css classes | S |

---

## §5 Summary Counts

### Fidelity Gaps (§1)

| Surface | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| A1 Admin Shell | 3 | 4 | 2 | 9 |
| A2 Editors | 2 | 3 | 2 | 7 |
| A3 Product Editor | 1 | 5 | 2 | 8 |
| A4 Journal Editor | 2 | 3 | 1 | 6 |
| A5 Analytics | 3 | 3 | 0 | 6 |
| A6 Storefront + Account | 4 | 5 | 3 | 12 |
| **Fidelity totals** | **15** | **23** | **10** | **48** |

### Client-Readiness Gaps (§2 / §2b)

| Category | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| System Pages | 0 | 3 | 0 | 3 |
| Automations / Workflows | 2 | 3 | 0 | 5 |
| Cross-Cutting | 3 | 10 | 5 | 18 |
| Mock-Data Wiring (§2b) | 9 | 8 | 2 | 19 |
| **Readiness totals** | **14** | **24** | **7** | **45** |

**Grand totals: P0 = 29, P1 = 47, P2 = 17, Total = 93**

Note: several P0 fidelity gaps and P0 readiness gaps are the same underlying issue counted once (e.g., A1-01/R15 = notification drawer mock data). Unique P0 blockers ≈ 18 after deduplication.

---

### Top 10 P0 Items (verbatim)

1. **Admin notification drawer (bell + `NotifDrawerAdmin`)** — `ADMIN_NOTIFS` is a hardcoded static array of 8 items; bell badge is hard-wired to `4`. Replace with real-time fetch from `GET /api/cms/notifications` (existing endpoint). Blocks every live tenant deployment. (`NotifDrawerAdmin.tsx`)

2. **Analytics WidgetGrid and all 5 widget types render `DEMO_DATA`** — revenue chart, orders bar, channels donut, top-products table, conversion funnel, activity feed all use `lib/cms/analytics/demo-data.ts`. A merchant sees fake data, not their own. (`components/cms/analytics/widgets.tsx`, `WidgetGrid.tsx`)

3. **Analytics layout state lost on refresh** — widget layout lives in `useState(DEFAULT_ATLAS_LAYOUT)`; any customisation made in Edit mode (F2) is lost on page reload. Interim fix: persist to `localStorage` keyed by tenant until G02 (AnalyticsDashboard model) lands. (`admin/analytics/page.tsx`)

4. **Customer account Inbox and NotifDrawer — `MESSAGES` / `SAMPLE_NOTIFS` hardcoded** — customer bell and `/account/inbox` show static fake notifications, not real `Notification` rows for the logged-in user. Blocks any customer self-service. (`NotifDrawer.tsx`, `account/inbox/page.tsx`)

5. **AccountBricks props zeroed + LifecycleRibbon defaults to `'loyal'`** — store credit, loyalty points, active subs, open orders all show `0` / `$0.00`; lifecycle ribbon always shows "Loyal" regardless of customer data. Requires new `GET /api/cms/account/summary` endpoint. (`account/page.tsx`)

6. **Loyalty page fully hardcoded** — `TIERS`, `CURRENT_PTS`, `REWARDS`, `ACTIVITY` are static consts. No loyalty Prisma model, no endpoint. A merchant with loyalty features on their site serves fake data to customers. (`account/loyalty/page.tsx` — net-new capability NW-01)

7. **Order sub-fulfillment step toggle is a no-op** — `handleStepToggle` calls `await Promise.resolve()` silently; any pack/prepare/QC check the merchant clicks is lost on refresh. Waiting on API plan G01 (`OrderItemFulfillmentStep` model + endpoint). (`admin/orders/[id]/page.tsx` line ~204)

8. **PricingStack renders empty** — `pricingTiers`, `memberPricing`, `discountCodes`, `saleSchedule` are always `[]`/`null`. A merchant with B2B pricing or a sale schedule sees nothing. `discountCodes` can be wired immediately to existing `GET /api/cms/discounts`; tiers and schedules need API plan G06. (`ProductEditorAtlas.tsx` lines ~448–460)

9. **Cart abandonment cron emails never sent** — the cron marks abandoned carts and calls `markRecoveryEmailSent` but the actual email delivery step is unimplemented (no email SDK call). Every abandoned cart silently goes unrecovered. (`app/api/cms/cron/cart-abandonment/route.ts`)

10. **Admin dashboard home is not Atlas-styled** — the dashboard page still renders a shadcn card grid, not the Atlas editorial `main-head` ("The almanac.") + KPI bricks + cadence chart that the spec and design chat mandated. Visual mismatch undermines the entire Atlas rebrand. (`admin/page.tsx` on the Atlas branch)

---

**Doc path:** `docs/designs/ATLAS-COMPLETENESS-AUDIT.md`
