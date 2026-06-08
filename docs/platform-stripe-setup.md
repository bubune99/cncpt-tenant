# Platform Stripe Setup (tenant-of-platform billing)

This wires the **platform** Stripe account (the one that bills *tenants* for their
CNCPT plans) to the per-tenant tier system. It is intentionally **one step away
from live** — nothing here touches Stripe until the owner confirms the account
and sets the env vars.

## Status: NOT YET ACTIVATED

The webhook and tier-application logic are deployed and inert. They activate only
once the platform Stripe env vars are present.

## What's already built

- `app/api/platform/billing/webhook/route.ts` — receives the platform account's
  `customer.subscription.created|updated|deleted` events and applies the matching
  tier to the tenant. Returns **503 (no-op)** while `STRIPE_SECRET_KEY` /
  `STRIPE_WEBHOOK_SECRET` are unset, so it cannot affect any tenant before setup.
- `lib/cms/billing/apply-tier.ts` — maps a Stripe price id → tier (via
  `subscription_tiers.stripe_price_id_monthly|yearly`) and writes
  `subdomains.subscription_tier_id` + `subscription_status`.
- `lib/cms/billing/tenant-tier.ts` — resolves a tenant's tier + limits at request
  time; feeds quotas and the rate-limit config.
- `scripts/platform-stripe-setup.mjs` — creates Products + monthly Prices for the
  active paid tiers and persists the ids back. **Dry-run by default.**

## Activation steps (run in order, by the owner)

1. **Confirm the platform Stripe account** and grab its API keys (test first).
2. Set env vars on Vercel (`v0-platformsmain`):
   - `STRIPE_SECRET_KEY` = the platform account secret key (`sk_test_…` then `sk_live_…`)
   - `STRIPE_WEBHOOK_SECRET` = the signing secret from step 4
   > Do **not** overwrite any tenant-scoped Stripe config (e.g. tenant `dzidzor`'s
   > live keys live in tenant settings, not these env vars).
3. **Create products/prices** (skips the existing `pro` tier which already has ids):
   ```bash
   node scripts/platform-stripe-setup.mjs            # review the plan
   node scripts/platform-stripe-setup.mjs --apply    # create + persist
   ```
4. **Register the webhook** in the Stripe dashboard:
   - Endpoint: `https://cncptweb.com/api/platform/billing/webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET` (step 2) and redeploy.
5. **Set checkout metadata**: when creating a tenant's subscription checkout
   session, include `metadata.subdomain = <tenant subdomain>` (and/or on the
   customer) so the webhook can map the subscription back to the tenant.

## Verification after activation

- Stripe CLI: `stripe listen --forward-to https://cncptweb.com/api/platform/billing/webhook`
  then `stripe trigger customer.subscription.created`.
- Confirm `subdomains.subscription_tier_id` updated for the test tenant and the
  `platform_billing.subscription.apply` row appears in the platform activity log.

## Tier ladder (current, in DB)

| name        | display      | $/mo | active | stripe ids |
|-------------|--------------|------|--------|------------|
| free        | Free         | 0    | yes    | — |
| starter     | Starter      | 29   | yes    | — (created by script) |
| pro         | Pro          | 99   | yes    | **already set — do not overwrite** |
| enterprise  | Enterprise   | 299  | yes    | — (created by script) |
| professional| Professional | 29   | **no** (deactivated duplicate) | — |
