# cncpt-tenant Production Runbook

Operational guide for deploying, debugging, and recovering the
multi-tenant CNCPT Web platform. Audience: anyone with admin access to
the Vercel project, the Neon DB, and the GitHub repo.

---

## Production at a glance

| Layer | What | Where |
|-------|------|-------|
| Code | `bubune99/cncpt-tenant` | https://github.com/bubune99/cncpt-tenant |
| Hosting | Vercel project `prj_VSnykCh7XBefHshJ7cHZcsUdtCel` (team `far-grace`) | https://vercel.com/far-grace/v0-platformsmain |
| Apex | `cncptweb.com` | Vercel alias `cncptweb.com` |
| Subdomains | `*.cncptweb.com` (wildcard) | Vercel alias `*.cncptweb.com` |
| Custom domains | `*.farcncpt.com` (wildcard) + per-tenant aliases | Edge Config `domain:<host>` mapping |
| DB | Neon Postgres (account: bubuneo99) | `ep-soft-lab-adomu3yn.us-east-1.aws.neon.tech` |
| Edge Config | `cncpt-domain-routing` | Vercel Edge Config |
| Auth | Stack Auth project `b522fdad-…` | https://app.stack-auth.com |
| Storage | Cloudflare R2 bucket `cncptweb` | r2.dev |
| Payments | Stripe (live keys in production env) | https://dashboard.stripe.com |

---

## Deploy a change

1. Branch from `main` and open a PR. Direct push to `main` is blocked by
   branch protection; CI must pass before merge.
2. Vercel automatically builds a preview for every push on every branch
   and adds a status check to the PR.
3. CI workflow at `.github/workflows/ci.yml` runs:
   - `pnpm install --ignore-scripts`
   - `pnpm exec tsc --noEmit --skipLibCheck` (one known dompurify warning is
     allowed — any new TS error fails CI)
   - `pnpm lint` (informational only for now)
4. Merge the PR (squash). Vercel deploys to production automatically on
   merge to `main`.
5. **Verify the production deploy:**
   - Use the Vercel MCP / dashboard to wait for `state: READY` on the new
     deployment.
   - `curl https://cncptweb.com/api/health` should return `{"ok":true,
     "version":"<7-char SHA>", ...}`. Compare the `version` field to the
     latest commit SHA on `main`. Match = the new code is serving.
   - Open `cncptweb.com` and a representative tenant (e.g.
     `dzidzor.cncptweb.com`) in a real browser and confirm the change
     you intended.

If the production build is `READY` but `/api/health` reports an old SHA,
the CDN may be serving a cached function — wait 30 seconds and re-check.
If it still mismatches, check the Vercel deployment alias to confirm
production points at the latest deployment.

---

## Roll back

1. Find the most recent known-good deployment in the Vercel deployments
   list (filter by `target: production` and `state: READY`).
2. Promote it via Vercel UI: deployment menu → Promote to Production. Or
   via CLI: `vercel promote <deployment-url>`.
3. Open a follow-up PR that reverts the bad change in code so the next
   merge does not silently re-ship it.

Rollback takes ~30 seconds (just an alias swap, no rebuild).

---

## Hotfix flow

For urgent production fixes:

1. Branch from `main` (e.g. `hotfix/<issue>`).
2. Push the smallest possible change.
3. Open the PR, watch CI go green, merge.
4. Run the verification chain above.
5. If you cannot wait for the standard flow, you can use the Vercel CLI
   to deploy a built artifact directly (`vercel --prod`) — but then open
   a PR after the fact so `main` stays in sync. Never let production
   diverge from `main` for more than the duration of the incident.

---

## Database migrations

Schema lives in `prisma/cms/schema.prisma`. Migrations live in
`prisma/migrations/`.

**Workflow:**

1. Edit `schema.prisma`.
2. Run `npx prisma migrate dev --schema=prisma/cms/schema.prisma --name
   <change>` against a local Neon branch. This generates a migration
   folder and updates the dev DB.
3. Commit both the schema and the migration folder. Open a PR.
4. On merge, the production DB is **not** automatically migrated. To
   apply: from a developer machine pointing at the production DB:
   `npx prisma migrate deploy --schema=prisma/cms/schema.prisma`.
5. Verify with `npx prisma migrate status` and a quick smoke check on
   the affected tables.

**Safety:**

- Never write a destructive migration (DROP COLUMN, DROP TABLE) without
  first running it on a Neon branch and verifying the app still works.
- Add a feature flag if the new column is read in code but the migration
  is not deployed yet.
- Keep migrations forward-compatible — previous deployments must still
  function on the new schema for the duration of the deploy window.

---

## Edge Config (custom-domain routing)

Custom domains route via `EDGE_CONFIG` lookups in `middleware.ts`. Keys
are `domain:<lowercased-hostname>`, values are the tenant subdomain.

Writes happen automatically when a tenant verifies a custom domain in
the dashboard (`syncDomainToEdgeConfig` in `app/domain-actions.ts`),
gated on Vercel reporting `verified === true`.

**Inspect Edge Config:**

- Vercel dashboard → Storage → Edge Config `cncpt-domain-routing` → Items.
- Or via API: `GET https://edge-config.vercel.com/<id>/items?token=...`

**Manual fix:** if a domain is stuck in an inconsistent state, edit the
key directly via the Vercel UI. The middleware re-reads on every request
(P99 < 15ms), so changes are visible within seconds.

---

## Common incidents

### "Subdomain works but the /admin page shows 403"
Stack Auth user is signed in but does not own the tenant. Confirm by
checking `subdomains` table — `userId` must match the Stack Auth user's
ID for ownership. Or confirm `super_admins` has the user's email if
they are expected to bypass tenancy.

### "Custom domain returns 404"
1. Confirm DNS is set up (CNAME or A pointing at Vercel).
2. Confirm the domain is `verified: true` in Vercel (project → Domains).
3. Confirm the Edge Config key `domain:<host>` exists and maps to the
   correct subdomain.
4. Confirm the subdomain in the mapping exists in the `subdomains`
   table.

### "CI is red on a PR"
Check the actions log. Most common: a new TS error introduced by the
PR (the workflow will print only the new errors, ignoring the known
dompurify warning). Fix locally with `pnpm exec tsc --noEmit
--skipLibCheck`.

### "Stripe Elements throw 'Invalid publishable key'"
Stripe Elements run in the browser and need the key prefixed with
`NEXT_PUBLIC_`. The correct env var is `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
NOT `STRIPE_PUBLISHABLE_KEY`. If the latter is set in Vercel and the
former is not, the element will fail silently. See the OWNER ACTIONS
section in the readiness PR description for the current state.

### "/api/health returns the wrong SHA"
The deployment alias is pointing at an older deployment. Check
`https://vercel.com/far-grace/v0-platformsmain/deployments` and confirm
the most recent production deployment is the one aliased to
`cncptweb.com`. If not, promote the correct one.

---

## Observability

The application currently has **no error tracking** (no Sentry, Datadog,
Axiom, or Logtail integration). Errors surface only in:

- Vercel build logs (build-time errors)
- Vercel runtime function logs (uncaught exceptions in API routes)
- Browser console (client errors — not collected anywhere)

This is a known production-readiness gap. Sentry is the recommended
next step but installation requires owner sign-off — see the readiness
PR description.

For now, the recommended observability workflow is:

1. **Uptime probe** — point UptimeRobot or Better Uptime at
   `https://cncptweb.com/api/health` with a 1-minute interval. Alert if
   `ok !== true` or status is non-200 for 2 consecutive checks.
2. **Vercel function logs** — set up alerting via Vercel for 5xx spikes.
3. **Stripe dashboard** — watch for payment failures / declined charges
   that don't surface in the app logs.
4. **Manual** — if a user reports an issue, reproduce in a browser and
   check the Network tab for the failing request, then look up the
   request ID in Vercel function logs.

---

## Escalation

If production is down (apex unreachable / wildcard DNS failing / DB
inaccessible):

1. Check the Vercel status page: https://www.vercel-status.com
2. Check Neon status: https://neonstatus.com
3. Check Cloudflare R2 (storage) status if media uploads fail.
4. Check Stack Auth status if auth fails.

If Vercel/Neon/Cloudflare are healthy but the app is still failing,
likely cause is a bad deploy or a bad migration. Roll back per the
"Roll back" section above.
