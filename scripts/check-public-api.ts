/**
 * Table test for the /api allowlist in lib/public-api.ts.
 * Run: npx tsx scripts/check-public-api.ts
 * A mismatch here is cheaper than a broken checkout or an open admin route.
 */
import { isPublicApi, AUTH_COOKIE_RE } from '../lib/public-api'

const cases: Array<[path: string, method: string, expectPublic: boolean]> = [
  // ---- must be guarded (session cookie required) ----
  ['/api/cms/env', 'GET', false], ['/api/cms/env', 'PUT', false],
  ['/api/cms/settings', 'GET', false], ['/api/cms/settings/ai', 'GET', false],
  ['/api/cms/orders', 'GET', false], ['/api/cms/orders', 'POST', false],
  ['/api/cms/orders/abc', 'GET', false], ['/api/cms/orders/abc/progress', 'POST', false],
  ['/api/cms/emails/campaigns', 'GET', false], ['/api/cms/emails/campaigns/x/send', 'POST', false],
  ['/api/cms/emails/subscribers', 'GET', false], ['/api/cms/email/send', 'POST', false],
  ['/api/cms/email/send', 'GET', false],
  ['/api/cms/media', 'GET', false], ['/api/cms/media/abc', 'DELETE', false],
  ['/api/cms/media/generate', 'GET', false], ['/api/cms/images/upload', 'POST', false],
  ['/api/cms/discounts', 'GET', false], ['/api/cms/discounts', 'POST', false],
  ['/api/cms/workflows', 'GET', false], ['/api/cms/plugins/workflows/execute', 'POST', false],
  ['/api/cms/analytics', 'GET', false], ['/api/cms/analytics/query', 'POST', false],
  ['/api/cms/analytics/dashboards', 'GET', false], ['/api/cms/analytics/settings', 'GET', false],
  ['/api/cms/digital-assets', 'GET', false], ['/api/cms/api-keys', 'POST', false],
  ['/api/cms/customers/abc/sync-stripe', 'GET', false], ['/api/cms/admin/customers/abc/notes', 'GET', false],
  ['/api/cms/admin/customers/abc', 'GET', false], ['/api/cms/admin/site-settings', 'PUT', false],
  ['/api/cms/admin/pages', 'GET', false], ['/api/cms/admin/__probe', 'GET', false],
  ['/api/cms/blog/posts', 'GET', false], ['/api/cms/blog/posts', 'POST', false],
  ['/api/cms/products', 'POST', false], ['/api/cms/products/abc', 'PUT', false],
  ['/api/cms/products/abc/sync-stripe', 'POST', false], ['/api/cms/products/abc/variants', 'POST', false],
  ['/api/cms/reviews', 'GET', false], ['/api/cms/reviews/abc', 'DELETE', false],
  ['/api/cms/forms', 'GET', false], ['/api/cms/forms/abc', 'PATCH', false],
  ['/api/cms/forms/abc/submissions', 'GET', false],
  ['/api/cms/events', 'POST', false], ['/api/cms/events/abc', 'PUT', false],
  ['/api/cms/events/abc/registrations', 'GET', false],
  ['/api/cms/custom-fields', 'GET', false], ['/api/cms/templates', 'GET', false],
  ['/api/cms/screenshots', 'POST', false], ['/api/cms/v0', 'GET', false], ['/api/cms/v0', 'POST', false],
  ['/api/cms/v0/components', 'POST', false], ['/api/cms/help/tours', 'GET', false],
  ['/api/cms/shipping/label', 'POST', false], ['/api/cms/shipping/refund', 'POST', false],
  ['/api/cms/shipping/settings', 'GET', false], ['/api/cms/discounts/import', 'POST', false],
  ['/api/cms/customer/profile', 'GET', false], ['/api/cms/account/summary', 'GET', false],
  ['/api/cms/notifications', 'GET', false], ['/api/cms/chat', 'POST', false],
  ['/api/cms/vote', 'POST', false], ['/api/cms/__probe', 'GET', false],
  ['/api/admin/announcements', 'GET', false], ['/api/admin/clients', 'GET', false],
  ['/api/admin/tiers', 'GET', false], ['/api/admin/__probe', 'GET', false],
  ['/api/super-admin/users', 'GET', false], ['/api/super-admin/rate-limits', 'POST', false],
  ['/api/super-admin/__probe', 'GET', false],
  ['/api/teams', 'GET', false], ['/api/teams/abc/members', 'POST', false],
  ['/api/teams/invitations/abc/accept', 'POST', false],
  ['/api/dashboard/subdomain', 'POST', false], ['/api/dashboard/credits', 'GET', false],
  ['/api/dashboard/subscription/checkout', 'POST', false],
  ['/api/feedback', 'GET', false], ['/api/feedback', 'POST', false],
  ['/api/bookings', 'GET', false], ['/api/bookings/abc', 'PATCH', false], ['/api/bookings/abc', 'DELETE', false],
  ['/api/subdomains/abc/auth-config', 'PUT', false], ['/api/credits/purchase', 'POST', false],
  ['/api/user/data-export', 'GET', false], ['/api/dashboard-chat', 'POST', false],

  // ---- must be public (self-authenticating or storefront) ----
  ['/api/health', 'GET', true],
  ['/api/auth/sync-platform', 'POST', true], ['/api/auth/github/callback', 'GET', true],
  ['/api/cms/auth/sync', 'POST', true], ['/api/cms/csrf', 'GET', true], ['/api/cms/captcha/config', 'GET', true],
  ['/api/webhooks/stripe', 'POST', true], ['/api/webhooks/shopify', 'POST', true],
  ['/api/webhooks/stack-auth', 'POST', true], ['/api/cms/webhooks/stripe', 'POST', true],
  ['/api/cms/webhooks/email/resend', 'POST', true], ['/api/cms/webhooks/shippo', 'POST', true],
  ['/api/platform/billing/webhook', 'POST', true], ['/api/dashboard/subscription/webhook', 'POST', true],
  ['/api/cms/cron/inventory', 'POST', true], ['/api/bookings/reminders', 'GET', true],
  ['/api/platform/mcp', 'POST', true], ['/api/setup/demo', 'POST', true],
  ['/api/admin/sync-edge-config', 'POST', true],
  ['/api/cms/content/pages', 'GET', true], ['/api/cms/content/pages/home', 'PUT', true],
  ['/api/cms/content/config', 'GET', true],
  ['/api/cms/storefront/mcp', 'POST', true], ['/api/cms/ucp/checkout', 'POST', true],
  ['/api/cms/ucp/checkout/abc', 'GET', true], ['/api/cms/ucp/catalog/products', 'GET', true],
  ['/api/dashboard/subdomain/check', 'GET', true], ['/api/teams/invitations/tok', 'GET', true],
  ['/api/bookings/availability', 'GET', true], ['/api/bookings', 'POST', true], ['/api/bookings/abc', 'GET', true],
  ['/api/cms/products', 'GET', true], ['/api/cms/products/abc', 'GET', true],
  ['/api/cms/products/abc/variants', 'GET', true], ['/api/cms/products/abc/images', 'GET', true],
  ['/api/cms/products/abc/pricing-tiers', 'GET', true], ['/api/cms/products/abc/custom-fields', 'GET', true],
  ['/api/cms/shop/products', 'GET', true], ['/api/cms/shop/collections', 'GET', true],
  ['/api/cms/events/public', 'GET', true], ['/api/cms/events/abc', 'GET', true],
  ['/api/cms/events/abc/schedule', 'GET', true], ['/api/cms/events/abc/register', 'POST', true],
  ['/api/cms/forms/abc', 'GET', true], ['/api/cms/forms/abc/submit', 'POST', true],
  ['/api/cms/navigation/header', 'GET', true], ['/api/cms/merchant-feed', 'GET', true],
  ['/api/cms/images', 'GET', true], ['/api/cms/features/dzidzor', 'GET', true],
  ['/api/cms/admin/branding', 'GET', true],
  ['/api/cms/reviews/product/abc', 'GET', true], ['/api/cms/reviews/stats', 'GET', true],
  ['/api/cms/reviews/abc/vote', 'POST', true], ['/api/cms/vote', 'GET', true], ['/api/cms/vote', 'PATCH', true],
  ['/api/cms/email/track/open', 'GET', true], ['/api/cms/email/confirm', 'GET', true],
  ['/api/cms/email/subscribe', 'POST', true], ['/api/cms/email/unsubscribe', 'GET', true],
  ['/api/cms/email/preferences', 'POST', true],
  ['/api/cms/cart', 'GET', true], ['/api/cms/cart', 'POST', true], ['/api/cms/cart/items', 'POST', true],
  ['/api/cms/cart/items/abc', 'DELETE', true], ['/api/cms/cart/merge', 'POST', true],
  ['/api/cms/cart/recover/tok', 'GET', true],
  ['/api/cms/checkout', 'POST', true], ['/api/cms/checkout/session', 'POST', true],
  ['/api/cms/checkout/session', 'GET', true],
  ['/api/cms/payments/intent', 'POST', true], ['/api/cms/payments/intent', 'GET', true],
  ['/api/cms/payments/intent', 'PUT', true],
  ['/api/cms/discounts/validate', 'POST', true],
  ['/api/cms/shipping/rates', 'POST', true], ['/api/cms/shipping/validate-address', 'POST', true],
  ['/api/cms/shipping/tracking', 'GET', true], ['/api/cms/shipping/elements/auth', 'POST', true],
  ['/api/cms/inventory/back-in-stock', 'POST', true], ['/api/cms/analytics', 'POST', true],
  ['/api/anything', 'OPTIONS', true], ['/admin', 'GET', true], ['/dashboard', 'GET', true],
]

let bad = 0
for (const [p, m, exp] of cases) {
  const got = isPublicApi(p, m)
  if (got !== exp) {
    bad++
    console.log('MISMATCH', m, p, 'expected public=' + exp, 'got', got)
  }
}

const cookieCases: Array<[name: string, expect: boolean]> = [
  ['stack-access', true], ['stack-refresh-2ab8f3d1-0000-4000-8000-000000000000', true],
  ['__Host-stack-access', true], ['__Secure-stack-refresh-x', true], ['session', true],
  ['stack-is-https', false], ['stack-oauth-state', false], ['sessionid', false], ['_ga', false],
]
for (const [name, exp] of cookieCases) {
  const got = AUTH_COOKIE_RE.test(name)
  if (got !== exp) {
    bad++
    console.log('COOKIE MISMATCH', name, 'expected', exp, 'got', got)
  }
}

console.log(
  bad === 0
    ? `all ${cases.length} route cases + ${cookieCases.length} cookie cases pass`
    : `${bad} mismatches`,
)
process.exit(bad === 0 ? 0 : 1)
