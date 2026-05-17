# Atlas Redesign — Immediate Tweaks Report

**Branch:** `feat/atlas-redesign` · **Date:** 2026-05-17 · **Scope:** what needs tweaking **now** to onboard real paying clients. Everything else is explicitly **deferred**.

---

## 1. What is DONE and integrated

The full Atlas editorial redesign is integrated across all 7 surfaces, the API layer is wired, and **all mock/demo data has been removed** (the explicit "no mock data" directive).

| Area | State |
|---|---|
| **Phase 0 foundation** | Spectral/Geist/Geist-Mono fonts, `--wl-*` tokens, 4 brand presets (Marigold default + Boreal/Obsidian/Meadow), `[data-density]`, `.atlas` component layer — all live; brand picker persists to `TenantSetting.brandPreset`/`density` |
| **A1 admin shell + lists** | Editorial shell, dashboard "almanac" with real KPIs, orders ledger/board, pages map |
| **A2 CMS editors** | Page / order / customer editors; order sub-fulfillment **persists** (real `PATCH`) |
| **A3 product editor** | Excel-grid, TypeMorph, BundleComposer, PricingStack on **real** tier/member/sale data |
| **A4 journal** | Write/Structure/Distribute on real `BlogSeries`/contributors/distribution-channel models |
| **A5 analytics** | All 5 widgets + sparklines on **real API data** (DEMO_DATA deleted); layout persists |
| **A6 storefront + account** | Account bricks, lifecycle ribbon, inbox, loyalty — all real-data |
| **A7 platform/super-admin** | Tenant Admin Canvas redesign |
| **A9 API layer** | New Prisma models + REST + MCP tools + internal-agent tools (per ATLAS-API-PLAN) |
| **CMS system pages** | 404 / 500 / maintenance framework **restored** (was a missing-module build-breaker) |

**Type safety:** zero net-new TypeScript errors from the entire integration; every branch-owned file is clean. (~414 pre-existing errors remain in legacy areas — book/docs/old-admin/marketplace/super-admin — out of Atlas scope and ignored by the production build.)

**Auth hardening:** the 22 new mutation routes are gated by a real `withTenantAuth` wrapper (authenticated CMS user + tenant scope + acting user) — anonymous mutations are not possible.

---

## 2. IMMEDIATE tweaks — do these before onboarding paying clients

Ordered by priority. These are the residual gaps from the completeness audit that materially affect a paying client's day-one experience.

### P0 — functional blockers

| # | Tweak | Where | Why it matters now |
|---|---|---|---|
| T-01 | **Font build robustness** — Inter/Spectral still fetched from Google at build time. A gstatic outage or a network-restricted CI fails the production build. Self-host via `@fontsource/inter` + `@fontsource/spectral` (Geist already self-hosted via the `geist` package). | `app/layout.tsx`, `app/globals.css` | A paying-client platform must not have deploys that can fail on a third-party CDN. ~1–2h, low risk. |
| T-02 | **Run the Atlas API migrations against production DB** — A9 added Prisma models + SQL (`prisma/migrations/system-pages/*`, pricing tiers, blog series, distribution channels, analytics dashboards, customer notes, lifecycle). They must be applied to the tenant DB before those surfaces work for real clients. | `prisma/cms/sql/*`, `prisma/migrations/*` | The redesigned editors will 500 against a DB missing the new tables/columns. |
| T-03 | **Smoke-test the brand-preset picker end-to-end** with a real tenant: switch Marigold→Boreal→Obsidian→Meadow + density, confirm persistence + SSR `data-brand` emission across admin + storefront. | site-settings → `ThemeInjector` → tenant layout | This is the headline client-facing customization promise. |

### P1 — quality gaps clients will notice

| # | Tweak | Where |
|---|---|---|
| T-04 | Orders **Board** drag-between-stages should call the stage-move API (currently lanes filter by `status` enum, not real `Order.currentStageId` workflow). | `admin/orders/page.tsx` (API G09 exists) |
| T-05 | Pages **Map** view: render real `Page.parentId` hierarchy with tree-lines (grandchildren nest), not the heuristic grouping. | `admin/pages/page.tsx` |
| T-06 | Product editor: **SpreadsheetGrid drag-fill / bulk-update** — cell edits are local-only; wire to `POST /api/cms/products/[id]/variants/bulk-update` (endpoint exists). | `SpreadsheetGrid.tsx`, `MatrixView.tsx` |
| T-07 | Customer editor: 5 KPI bricks + lifecycle stepper + admin-notes timeline on real `CustomerNote`/`lifecycleStage` (models exist via A9; verify mapping). | `CustomerEditor.tsx` |
| T-08 | CustomFieldsBuilder + DigitalEditor license-key pool: wire CRUD save paths to their (existing) endpoints. | `CustomFieldsBuilder.tsx`, `DigitalEditor.tsx` |
| T-09 | `⌘K` global search: currently focuses the input; wire to a real search modal/omnibox. | `AdminShell.tsx` |
| T-10 | Sidebar nav badges (Orders count, Inbox count) — confirm all are live counts, no remaining hardcoded values. | `AdminShell.tsx` |

### P2 — polish (nice before launch, not blocking)

- Page-settings editor live preview pane (real SSR/iframe, not placeholder).
- Journal WriteTab editorial typography (drop-cap, pull-quote, selection bubble).
- Distribute schedule matrix backend (6×6 grid is visual).
- TypeMorph server-side migration validation before type switch.

---

## 3. DEFERRED — explicitly LATER (tracked, not built)

Per owner direction these are **not** in the "now" scope:

- **Marketplace / addons system** (the "include addons and features as a marketplace" idea).
- **Marketing-pages redesign** (public site stays on the existing design).
- **Deep block-editor feature expansion** (owner will revisit the block editor separately).
- The ~414 pre-existing legacy TypeScript errors (book/docs/old-admin/marketplace/super-admin/chat-streaming) — pre-date this work, ignored by the build, unrelated to Atlas.

---

## 4. Verification status

- **TypeScript:** scoped typecheck — zero net-new errors; all branch-owned files clean.
- **Build:** Vercel preview build of `feat/atlas-redesign` (the real deploy target, network available) — see PR. Local build is blocked only by the offline sandbox's inability to reach `fonts.gstatic.com` (T-01 makes this moot).
- **Runtime:** verify on the Vercel preview URL per the deploy-verification protocol (DOM markers on redesigned surfaces with real data).
