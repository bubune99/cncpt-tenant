# CMS-to-Tenant Integration: Refactor Analysis Report

**Date**: 2026-02-27
**Analyzer**: refactor-agent using refactor-runtime MCP tools

---

## Executive Summary

The tenant project at `/mnt/c/Users/bubun/CascadeProjects/cncpt-tenant` has a **triple-copy problem**: CMS code exists in three places simultaneously, with only one copy actually being used. The `@cncpt/cms` workspace package (`packages/cms/`) has **zero imports** from application code - everything runs through manually-copied top-level directories via `@/` path aliases.

---

## 1. The Dual Import Situation

### Finding: `@cncpt/cms` workspace package is completely unused

**Zero imports from `@cncpt/cms`** exist in any `.ts` or `.tsx` source file. The only references to `@cncpt/cms` are:
- `package.json` line 23: `"@cncpt/cms": "workspace:*"` (dependency declaration)
- `package.json` line 12: `build` script filters it (`pnpm --filter @cncpt/cms build && next build`)
- `packages/cms/package.json` line 2: package name declaration
- Comment strings in `lib/cms/index.ts`, `packages/cms/types/index.d.ts`, `packages/cms/src/index.ts`

### What IS being used: `@/components/cms/`, `@/lib/cms/`, `@/puck/`, `@/hooks/`

The `tsconfig.json` maps `@/*` to `./*` (project root) and **excludes** `packages/` from compilation. All active imports use:

| Import Pattern | Approx. Import Count | Source Directory |
|---|---|---|
| `@/components/cms/*` | 80+ unique imports | `components/cms/` (217 files) |
| `@/lib/cms/*` | 200+ unique imports | `lib/cms/` (248 files) |
| `@/puck/*` | 39 occurrences in 20 files | `puck/` (132 files) — **removed, migrated to block editor** |
| `@/hooks/*` | Various | `hooks/` (13 files) |
| `@/exports/cms/*` | Various | `exports/cms/` (7 files) |

### Recommendation: **DELETE `packages/cms/` entirely**

The workspace package is dead weight:
- 895 TypeScript files that are never imported
- Maintains outdated editor dependencies (`@puckeditor/core`, `@puckeditor/cloud-client`, `@puckeditor/plugin-ai`) — **now removed**
- Has its own `prisma/` schema, `node_modules/`, build config (tsup, tsconfig.build)
- The `build` script in root `package.json` runs `pnpm --filter @cncpt/cms build` for nothing
- Remove `@cncpt/cms` from `package.json` dependencies
- Remove `packages/cms/` from `pnpm-workspace.yaml`

---

## 2. Code Duplication Between Top-Level and packages/cms/

The top-level directories are nearly identical copies of `packages/cms/src/`:

| Top-Level Directory | packages/cms/src/ Equivalent | Files (top) | Files (pkg) | Divergence |
|---|---|---|---|---|
| `components/cms/` | `src/components/` | 217 | 216 | +1 (DemoBanner.tsx, McpApiKeysSettings.tsx); -1 (MediaHelpPanel.tsx) |
| `lib/cms/` | `src/lib/` | 248 | 232 | +16 tenant-specific files (tenant-context.ts, mcp/analytics.ts, mcp/rate-limit.ts, mcp/scopes.ts, middleware.ts, index.ts) |
| `puck/` | `src/puck/` | 132 | 132 | Identical |
| `hooks/` | `src/hooks/` | 13 | 11 | +2 tenant-specific (use-demo-mode.ts, use-subdomain-access.ts) |

The top-level copies ARE the canonical source. `packages/cms/src/` is the stale original.

---

## 3. Hostinger/VPS/Dokploy References

### packages/dokploy-mcp/

The `pnpm-lock.yaml` references `packages/dokploy-mcp` at line 687, but the **directory does not exist on disk** - it appears to have been partially cleaned up already. However:
- `pnpm-lock.yaml` still references it
- The lock file needs regeneration after removing the workspace reference

### Remaining VPS/Self-Host References

**Benign references** (analytics descriptions, not infrastructure):
- `packages/cms/src/lib/env/types.ts` line 435: `'Self-hosted Matomo server URL'` (Matomo analytics config description)
- `packages/cms/src/app/admin/analytics/page.tsx` line 655: `'Self-hosted analytics with full data ownership'` (UI text)

**No active Dokploy/Hostinger/Docker infrastructure code remains** in `app/`, `lib/`, `components/`, or `middleware.ts`. The cleanup-agent may have already addressed this.

### docs/dashboard-ai-chat-spec.md

Contains `getDokployStatus` tool specification (lines 168-172). This spec document references a Dokploy VPS tool that should be removed or replaced with Vercel deployment tools.

---

## 4. Dependency Health (deps_audit)

### Unused Dependencies in Root package.json (34 packages)

**Should definitely remove** (not used anywhere):
- `@cncpt/cms` - workspace package, zero imports
- `@sveltejs/kit`, `svelte`, `vue`, `vue-router` - wrong framework entirely
- `@radix-ui/react-aspect-ratio`, `@radix-ui/react-menubar`, `@radix-ui/react-toast`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group` - UI components not imported
- `autoprefixer` - PostCSS plugin, not needed with Tailwind v4
- `axios` - no imports found
- `cmdk`, `frimousse`, `input-otp`, `vaul` - unused UI libraries
- `react-day-picker`, `react-resizable-panels`, `recharts` - unused
- `tailwindcss-animate` - replaced by `tw-animate-css`
- `@vercel/sdk` - no imports
- `@vercel/analytics` - no imports in app code

**Keep but verify** (may be used transitively):
- `@hookform/resolvers`, `geist` - may be imported from cms code

### Undeclared Dependencies (68 packages)

These are used in code but declared only in `packages/cms/package.json`, not in root. Since `packages/cms/` code is being deleted, these need to be moved to root `package.json`:

**Critical to add to root**:
- `@prisma/client`, `@prisma/adapter-pg`, `prisma`
- `@tiptap/*` (all 11 packages) - blog editor
- `@codemirror/*` - code editor
- ~~`@puckeditor/core`~~ - **removed** (migrated to custom block editor)
- `@stripe/react-stripe-js`, `@stripe/stripe-js` - payment UI
- `@xyflow/react` - workflow editor (may be removable per n8n decision)
- `shippo` - shipping
- `socket.io`, `socket.io-client` - real-time
- `react-dropzone` - file uploads
- `uuid`, `ajv`, `fast-deep-equal`, `classnames`

---

## 5. Environment Variable Drift (env_audit)

### 36 variables used in code but missing from .env files

Key missing variables:
- `NEXT_PUBLIC_ROOT_DOMAIN` - critical for subdomain routing (used in middleware.ts)
- `VERCEL_API_TOKEN`, `VERCEL_PROJECT_NAME` - Vercel deployment integration
- `SUPER_ADMIN_EMAILS`, `SUPER_ADMIN_MCP_KEY` - admin access
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Redis caching
- `MCP_API_KEY` - MCP integration
- `EDGE_CONFIG_ID` - Vercel Edge Config
- Various shipping (`SHIP_FROM_*`), storage (`R2_*`, `STORAGE_PROVIDER`), and webhook verification keys

### 32 variables in .env files but unused in code

Notable dead env vars:
- `POSTGRES_*` (8 vars) - old Postgres connection strings (replaced by DATABASE_URL via Neon)
- `VERCEL_ACCESS_TOKEN`, `VERCEL_TEAM_ID` - superseded by `VERCEL_API_TOKEN`
- `STRIPE_API_KEY`, `STRIPE_PUBLIC_KEY` - may be renamed
- `STACK_SECRET_SERVER_KEY` - possibly renamed
- Various debug/rate-limit vars

---

## 6. Circular Dependencies (12 cycles detected)

Notable cycles that should be resolved:
1. **Chat SDK**: `visibility-selector.tsx` <-> `use-chat-visibility.ts` <-> `chatsdk/actions.ts`
2. **Help System**: `help-message-bar.tsx` <-> `help-provider.tsx` <-> `help-overlay.tsx` <-> `help-tooltip.tsx`
3. **Builder**: 7-file cycle through `activity-panel`, `page-builder`, `builder-header`, `builder-canvas`, `canvas-element`, `bottom-panel`, `right-panel`
4. **Editor**: `functions.tsx` <-> `config.ts`
5. **Artifacts**: `artifacts/server.ts` <-> `app/artifacts/*/server.ts` (3 files)

---

## 7. Orphan Files (170+ files)

170+ files detected as orphans (not imported by any other file). Key categories:
- **Entire packages/cms/src/exports/** - barrel files for the unused workspace package
- **Entire packages/cms/src/app/** - API routes and pages in the unused package
- **Various index.ts barrel files** that re-export but are never imported
- **packages/cms/ config files** - `tsup.config.ts`, `eslint.config.mjs`, `prisma.config.ts`

---

## 8. Puck Visual Editor: Removed from Tenant

Puck has been fully removed from the tenant project and replaced with the custom block editor:
- `puck/` directory (132 files) — **deleted**
- `@puckeditor/core` dependency — **removed**
- All `@/puck/` imports (20 files) — **migrated to block editor**
- API routes migrated to `/api/cms/blocks/` and `/api/admin/pages/`
- Page builder uses custom block editor at `admin/pages/[id]/editor`

**Decision completed**: Tenant uses the custom block editor (same as CMS project).

---

## Recommended Action Plan

### Phase 1: Remove Dead Weight (Safe, No Functionality Change)
1. **Delete `packages/cms/`** entirely (895 unused files)
2. **Remove from `pnpm-workspace.yaml`**: Remove the `packages/*` entry or scope it to exclude `cms`
3. **Update root `package.json`**:
   - Remove `@cncpt/cms` from dependencies
   - Remove `pnpm --filter @cncpt/cms build &&` from build script
   - Remove 34 unused dependencies (svelte, vue, etc.)
   - Add ~20 undeclared dependencies that tenant code actually uses
4. **Remove `packages/dokploy-mcp/`** reference from lockfile (regenerate lockfile)
5. **Clean `docs/dashboard-ai-chat-spec.md`** - remove `getDokployStatus` section

### Phase 2: Fix Env Variables
1. Add 36 missing env vars to `.env.example`
2. Remove 32 unused env vars from `.env` files
3. Document which vars are required vs optional

### Phase 3: Block Editor Migration ✅
- ~~Puck removed~~ — all 20 files migrated to custom block editor
- `@puckeditor/core` and related deps removed from project

### Phase 4: Code Quality
1. Resolve 12 circular dependency cycles
2. Clean up 170+ orphan files
3. Consolidate the remaining copy directories - consider if `components/cms/`, `lib/cms/` etc. should drop the `cms/` nesting since there's no longer a competing source

---

## File Counts Summary

| Location | Files | Status |
|---|---|---|
| `packages/cms/src/` | 895 | **DELETE** - unused |
| `components/cms/` | 217 | KEEP - canonical |
| `lib/cms/` | 248 | KEEP - canonical |
| `puck/` | 132 | **REMOVED** — migrated to block editor |
| `hooks/` | 13 | KEEP - canonical |
| `exports/cms/` | 7 | KEEP - barrel files |
| `app/` (tenant routes) | ~200 | KEEP - tenant app |
| `packages/dokploy-mcp/` | ~50 | **DELETE** - VPS remnant |

**Total files to remove**: ~945 files (packages/cms/ + packages/dokploy-mcp/)
