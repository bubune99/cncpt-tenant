# cncpt-tenant Architecture

A high-level map of how the multi-tenant CNCPT Web platform is wired
together. Pair with `runbook.md` for operational guidance.

---

## Tenancy model

The platform serves three classes of host:

1. **Apex** (`cncptweb.com`, `www.cncptweb.com`) — marketing site,
   sign-up / login, the platform-owner dashboard, and platform-wide
   super-admin pages. No tenant scoping.
2. **Subdomain** (`<tenant>.cncptweb.com`) — per-tenant storefront and
   admin. The `<tenant>` slug is the primary tenant identifier across
   the codebase.
3. **Custom domain** (e.g. `mybrand.com`) — a tenant-owned domain
   pointing at Vercel. Resolved to its tenant via Vercel Edge Config.

Every request flows through `middleware.ts` which figures out which of
the three host classes the request is on, derives the tenant slug if
applicable, and rewrites or forwards the request accordingly.

---

## Request flow

```
incoming request
      ↓
middleware.ts
      ↓
  hostname split
      ↓
┌───────────────────────────────────────────────────────────────────┐
│  Apex / www                                                       │
│    → no rewrite, normal app routing                               │
│                                                                   │
│  Subdomain (foo.cncptweb.com)                                     │
│    → x-subdomain header injected (server-derived, never trusted   │
│      from client input on non-content APIs)                       │
│    → /api/...   passes through with header                        │
│    → /          rewrite → /s/foo                                  │
│    → /admin/*   rewrite → /s/foo/admin/*                          │
│    → /handler/* rewrite → /s/foo/handler/* (Stack Auth on tenant) │
│    → favicon/manifest/icon → tenant-branded variants              │
│    → everything else → /s/foo/*                                   │
│                                                                   │
│  Custom domain (mybrand.com)                                      │
│    → Edge Config lookup `domain:mybrand.com`                      │
│    → if mapped to tenant `foo`:                                   │
│       - /admin redirects to foo.cncptweb.com/admin (admin not     │
│         supported on custom domains; force tenant subdomain)      │
│       - /api passes with x-subdomain=foo                          │
│       - everything else rewrites to /s/foo                        │
│    → if not mapped, fall through (likely 404)                     │
└───────────────────────────────────────────────────────────────────┘
      ↓
app/s/[subdomain]/...  OR  app/...
      ↓
React Server Component renders → response
```

Critical security property: **the `x-subdomain` request header is the
only authoritative source of tenant context inside API routes and
server components.** The middleware always strips client-supplied
values (except on the public content-delivery API, which is API-key
authed). Code that derives tenancy from request body, query string, or
cookies bypasses tenant isolation and must be treated as a vulnerability.

---

## Authentication

Stack Auth handles all auth — sign in, sign up, OAuth callbacks, email
verification, session management. Configuration lives in `stack.tsx`
(server) and is loaded into the React tree via `<StackProvider>` in the
root layout.

- `/handler/sign-in`, `/handler/sign-up`, `/handler/oauth-callback/*`
  are all owned by Stack Auth's React Router-style handler.
- `useUser()` (Stack Auth hook) returns the current user in client
  components.
- `stackServerApp.getUser()` returns the user in server components and
  server actions.

**Stack Auth's `userId` is the global identifier for a person across
all tenants.** Tenant ownership is recorded in the `subdomains` table
(`subdomains.userId` references `User.stackAuthId`). A single user can
own multiple tenants.

---

## Authorization

Three concentric levels:

1. **Authentication** — am I signed in? Done by Stack Auth.
2. **Tenant ownership** — does this signed-in user own / belong to the
   tenant whose data I'm reading or mutating? Enforced by the
   `withTenantAuth` helper in `lib/cms/permissions/middleware.ts`.
   This was added in PR #7 to close a CRITICAL data-leak hole where any
   logged-in user could mutate any tenant's data simply by hitting that
   tenant's hostname.
3. **Permissions / role** — within a tenant, does this user have the
   specific permission required (view/edit/admin)? Layered on top of
   `withTenantAuth` via `withPermission`.

Super admins (rows in the `super_admins` table, plus the
`SUPER_ADMIN_EMAILS` env var) bypass tenant ownership for cross-tenant
operations like the platform admin pages.

API routes that mutate tenant data (POST/PUT/PATCH/DELETE) must use
`withTenantAuth`. PR #7 also extended this to GET handlers under
admin-only paths since several were exposing PII to anyone on the
tenant's hostname.

---

## Data model

Database is Postgres (Neon). Schema lives at
`prisma/cms/schema.prisma`. Key tables:

- `User` — Stack Auth–synced users
- `subdomains` — one row per tenant. `subdomain` is the slug, `userId`
  is the Stack Auth user who owns it.
- `super_admins` — emails / user IDs that bypass tenant scoping.
- `custom_domains` — tenant-claimed custom domains plus verification
  state. Mapped into Edge Config for the middleware lookup.
- A wide collection of CMS tables (`pages`, `posts`, `products`,
  `orders`, `customers`, `media`, `forms`, `bookings`, …) that are all
  tenant-scoped via a `subdomain` or `tenantId` column.

Prisma is used for the ORM; many older queries use direct SQL via
`@neondatabase/serverless` for low-latency edge access.

---

## Rate limiting

`@upstash/ratelimit` + Upstash Redis (`KV_REST_API_*` env). Applied at
the API route level on the routes that need it (auth, AI generation,
admin write paths). Tenant-scoped quotas live in `subscription_tiers`
table.

---

## Storage

Media uploads go to Cloudflare R2 (S3-compatible) in bucket `cncptweb`.
Public reads are served via the R2 public URL
(`pub-...r2.dev`); the application keeps a `media` table for metadata
(alt text, dimensions, tenant ownership).

---

## Background work

- **Stripe webhooks** at `/api/webhooks/stripe`. Verified via
  `STRIPE_WEBHOOK_SECRET`.
- **Booking reminders** at `/api/bookings/reminders` — invoked by a
  cron / scheduled function (Vercel Cron). Authenticated via
  `CRON_SECRET`.
- **Stack Auth webhooks** at `/api/auth/sync-platform` — keeps the
  application's `User` rows in sync with Stack Auth's user store.

---

## Health & observability

- `GET /api/health` returns
  `{ ok: true, version: <commit SHA>, env, region, ts }`. Use this for
  uptime probes and to verify a deploy actually shipped a particular
  commit.
- No application-side error tracking yet (Sentry / Axiom / Datadog).
  Runtime errors surface only in Vercel function logs and the user's
  browser console. This is the largest remaining production-readiness
  gap and tracking it requires owner sign-off on the third-party tool.

---

## Security headers

Set in `next.config.js` and applied to every response:

- `Content-Security-Policy` (custom; allows Stripe, Shippo, Stack Auth,
  Vercel Live, v0, GA, Plausible, R2/S3, YouTube — see the file for the
  exact directive list)
- `X-Frame-Options: SAMEORIGIN` (legacy fallback for browsers that
  don't honour CSP `frame-ancestors`)
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `X-XSS-Protection: 0` (CSP is the modern replacement)

---

## Where to look when …

- **A subdomain user logs in and is sent to the wrong dashboard** —
  `stack.tsx` `urls.afterSignIn` (currently `/dashboard` on the apex).
  Per-tenant landing requires a per-tenant Stack Auth project.
- **A specific block type renders wrong** — `lib/cms/blocks/` has the
  block renderer registry. Each block type has its own component plus
  a schema entry for the editor.
- **AI chat produces unexpected output** — `app/api/cms/block-editor-chat`
  for the editor; `app/api/dashboard-chat` for the assistant. Both use
  the AI SDK with the AI Gateway.
- **A migration won't apply** — see `runbook.md` "Database migrations".
- **Custom-domain SSL is broken** — Vercel project → Domains → check the
  domain's certificate status. Vercel handles cert provisioning
  automatically once DNS is verified.
