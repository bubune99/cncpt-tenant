# Atlas Redesign — Implementation Contract

**Authoritative spec for every implementation agent.** Read this fully before touching code.
Branch: `feat/atlas-redesign`. Base commit must include Phase 0 (design-system foundation).

---

## 0. Source of truth

Two handoff bundles from Claude Design live under `docs/designs/`:

| Bundle | Surface it drives | Primary file |
|---|---|---|
| `cms-ui/` | Per-tenant CMS admin, editors, storefront, customer account | `cms-ui/project/Atlas v2.html` |
| `cncpt-web-admin-ui/` | Platform / super-admin (manage subdomains, tenants, teams, comms) | `cncpt-web-admin-ui/project/Tenant Admin Canvas.html` |

**Per-bundle protocol (from each bundle's README — non-negotiable):**
1. Read every chat transcript in `<bundle>/chats/` first — that is where intent lives.
2. Read the primary HTML file top to bottom, then follow its imports (`<script src=...>` JSX, CSS).
3. Recreate **pixel-perfectly** in Next.js/React/Tailwind. Match the visual output; do not copy prototype internal structure unless it fits.
4. Do not render in a browser for specs — read the HTML/CSS/JSX directly.

---

## 1. Design language — Atlas (cms-ui)

Editorial warm-paper magazine aesthetic. Borrowed: Console's dense tables, Stage's kanban. Slight radius only.

### Fonts (loaded in Phase 0 via `next/font`)
- **Display / headings:** Spectral (serif). CSS var `--font-display`. Weights 400–700, italics. Headlines use the "The pages." pattern: roman text + last word `.display-i` italic in accent.
- **Body / UI:** Geist (sans). CSS var `--font-geist`.
- **Labels / mono / numerics:** Geist Mono. CSS var `--font-geist-mono`.
- Alternates available (display only): EB Garamond, Cormorant Garamond, Fraunces, DM Serif Display.

### Atlas core tokens (default = Marigold preset)
```
--paper:#efe7d8  --paper-2:#f5efe2  (page canvas behind frame #e0d9c9)
--ink:#1a1410    --ink-soft:rgba(26,20,16,.65)   --ink-faint:rgba(26,20,16,.35)
--rule:rgba(26,20,16,.2)   --rule-soft:rgba(26,20,16,.12)
--accent:#8b2c1f (oxblood)  --accent-2:#c8443a  --gold:#b58730  --moss:#4f5e3a  --hot:#c8443a
--r:4px (frames)  --r-sm:3px (cards/buttons/pills)   tables, rules, wordmark dot stay SHARP
```

### The 4 brand presets — the user-selectable "design system picker"
Each rewrites the `--wl-*` set. **Marigold is the default.** Source: `cms-ui/project/atlas-customer-main.jsx` (PRESETS object) and the `<style>` block of `Atlas Customer Dashboard.html`.

| var | Marigold (default) | Boreal | Obsidian (dark) | Meadow |
|---|---|---|---|---|
| `--wl-canvas` | `#d9d3c2` | `#e8e8e6` | `#1a1a1d` | `#e6dfd1` |
| `--wl-bg` | `#faf7ef` | `#ffffff` | `#0f0f12` | `#f7f3e9` |
| `--wl-surface` | `#ffffff` | `#ffffff` | `#16161a` | `#fffdf6` |
| `--wl-surface-2` | `#f5f1e6` | `#f6f6f4` | `#1c1c20` | `#f0ead7` |
| `--wl-surface-3` | `#ebe5d4` | `#eceae6` | `#22222a` | `#e2dabd` |
| `--wl-text` | `#1a1410` | `#0d1f1c` | `#f0ede5` | `#2d2918` |
| `--wl-text-soft` | `rgba(26,20,16,.62)` | `rgba(13,31,28,.62)` | `rgba(240,237,229,.68)` | `rgba(45,41,24,.66)` |
| `--wl-text-faint` | `rgba(26,20,16,.40)` | `rgba(13,31,28,.40)` | `rgba(240,237,229,.42)` | `rgba(45,41,24,.42)` |
| `--wl-rule` | `rgba(26,20,16,.18)` | `rgba(13,31,28,.14)` | `rgba(240,237,229,.16)` | `rgba(45,41,24,.18)` |
| `--wl-rule-soft` | `rgba(26,20,16,.10)` | `rgba(13,31,28,.08)` | `rgba(240,237,229,.08)` | `rgba(45,41,24,.10)` |
| `--wl-accent` | `#8b2c1f` | `#1a4d3a` | `#d4a84b` | `#5c7548` |
| `--wl-accent-fg` | `#ffffff` | `#ffffff` | `#0f0f12` | `#fffdf6` |
| `--wl-accent-soft` | `rgba(139,44,31,.10)` | `rgba(26,77,58,.10)` | `rgba(212,168,75,.14)` | `rgba(92,117,72,.12)` |
| `--wl-success` | `#4f5e3a` | `#1a4d3a` | `#7faa55` | `#5c7548` |
| `--wl-warning` | `#b58730` | `#b89031` | `#d4a84b` | `#c08a2e` |
| `--wl-error` | `#b53d2f` | `#b53d2f` | `#b53d2f` | `#b53d2f` |

Density via `body[data-density]`: compact / regular(default) / spacious — drives `--wl-pad/--wl-gap/--wl-card-pad/--wl-row-h`. Geometry: `--wl-radius:8px --wl-radius-sm:4px --wl-radius-lg:12px`.

### Shared editorial component classes (Phase 0 ships these in `app/atlas.css`)
Agents REUSE these — never re-derive. `.eyebrow` `.eyebrow-ink` `.small-caps` `.display` `.display-i` `.mono` `.fig` `.accent` `.soft` · shells `.page-frame .topbar .sidebar .main .main-head` · `.btn .btn-solid` (kbd chips) · `.tabs .tab.on` · `.tbl` (small-caps mono headers, sort `↓`, `tr.sel` accent stripe) · `.pill` + `pill-solid-ink|accent|gold|moss` `pill-out` `pill-out-accent` `pill-soft` · `.panel .kbn-lane-h .kbn-card .kbn-card.alert` · `.action-bar` (kbd hints). Exact CSS = `Atlas v2.html` `<style>` (lines 11–213). Notifications drawer CSS/markup = `atlas-v2-chrome.jsx` (`.adm-drawer`, bell, Inbox).

---

## 2. Phase 0 — shared foundation (landed before any surface agent)

Owned by orchestrator only. Surface agents must NOT edit these:
- `app/layout.tsx` — Spectral + Geist + Geist Mono via `next/font/google`, vars on `<body>`.
- `app/globals.css` — shadcn semantic tokens **remapped** to Atlas/Marigold (so the existing component tree reskins via cascade), `--wl-*` default + `[data-brand="marigold|boreal|obsidian|meadow"]` blocks, `[data-density]`.
- `app/atlas.css` — the editorial component layer (§1) imported by `globals.css`.
- `lib/cms/branding/types.ts` — `brandPreset` + `density` on `TenantBranding` (default `'marigold'`, `'regular'`).
- `prisma/cms/schema.prisma` — `brandPreset`, `density` on `TenantSetting` (+ migration).
- `lib/cms/branding/index.ts`, `lib/cms/theme/color-utils.ts`, `components/cms/ThemeInjector.tsx`, `app/s/[subdomain]/layout.tsx` — emit chosen preset's `--wl-*` block + `data-brand`/`data-density` server-side (zero JS), tenant primary/accent still override on top.

---

## 3. Surface → agent → file ownership (disjoint; no two agents share a file)

| # | Agent | Design source | Owns (write) | Reads only |
|---|---|---|---|---|
| A1 | Tenant admin shell + list pages | `cms-ui` Atlas v2.html, atlas-v2-chrome/pages/main.jsx | `app/s/[subdomain]/admin/AdminShell.tsx`, `AdminShellWrapper.tsx`, `admin/layout.tsx`, `admin/page.tsx`, `admin/orders/`, `admin/pages/` (list), `admin/customers/`, `admin/settings/`, `admin/site-settings/`, notifications drawer component under `components/cms/admin/` | spec, atlas.css |
| A2 | CMS editors (page/order/customer) | `cms-ui` Atlas Editors.html, atlas-editors-page/order/customer.jsx | `app/s/[subdomain]/admin/pages/[id]/editor/`, order detail/editor pages, customer editor page; `components/cms/editor/` (non-TipTap), order/customer editor components | spec, atlas.css |
| A3 | Product editor | `cms-ui` Atlas Product Editor.html, atlas-product-editor/advanced.jsx | `components/cms/products/*`, `app/s/[subdomain]/admin/products/[id]/` | spec, atlas.css |
| A4 | Journal / blog editor | `cms-ui` Atlas Journal Editor.html, atlas-journal-editor.jsx | `app/s/[subdomain]/admin/blog/*`, `components/cms/editor/TipTapEditor.tsx`, `EditorToolbar.tsx`, journal components | spec, atlas.css |
| A5 | Analytics dashboard | `cms-ui` Atlas Analytics Dashboard.html, atlas-analytics-dashboard/charts.jsx | `app/s/[subdomain]/admin/analytics/*`, `components/cms/analytics/*`, `lib/cms/dashboard/widgets` | spec, atlas.css |
| A6 | Storefront + customer account | `cms-ui` Atlas Customer Dashboard.html, atlas-customer-*.jsx | `app/s/[subdomain]/(storefront)/*`, `app/s/[subdomain]/(account)/*`, `app/s/[subdomain]/(storefront)/mobile-nav.tsx`, storefront/account components | spec, atlas.css |
| A7 | Platform / super-admin | `cncpt-web-admin-ui` Tenant Admin Canvas.html + direction-*/tenant-*.jsx + tokens.css | `app/admin/*`, `app/(super-admin)/*`, platform-admin components | spec, atlas.css |

Shared primitives (`components/ui/*`, `components/cms/ui/*`, `app/globals.css`, `app/atlas.css`, branding lib) are **read-only** for surface agents. Need a shared change? Note it in §5 and keep going with a local fallback.

---

## 4. Rules for every surface agent

- Branch off the Phase-0 commit (worktree isolation). Final deliverable: a clean branch + a 10-line summary of files changed and any §5 escalations.
- Recreate the design **pixel-perfectly** using the Phase-0 fonts, tokens, presets, and `app/atlas.css` classes. Do not introduce new color values — use `--accent/--ink/--paper/--wl-*`.
- Keep all existing data wiring (Prisma queries, server actions, API routes, auth guards). This is a **reskin + structure** change, not a data-layer rewrite. Preserve props/exports other modules import.
- Default theme = **Marigold**; ensure your surface also renders correctly under Boreal/Obsidian(dark)/Meadow (use tokens, not hardcoded colors).
- TypeScript strict (see `~/.claude/rules/typescript/*`): explicit public types, no `any`, immutable updates, no `console.log`, validate boundaries.
- Verify before "done": `pnpm tsc --noEmit` clean for your files + the surface renders (dev server / runtime check). State explicitly if a runtime check was not possible.
- CMS priority is **structure** (toggles, kanban/table, grid editors, view modes) with brand/style as configurable options — match the intent in the chats, not just the screenshots.

## 5. Cross-agent escalations / shared-change requests
(append-only; orchestrator reconciles)
