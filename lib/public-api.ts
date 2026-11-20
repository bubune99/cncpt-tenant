/**
 * Public API allowlist — the middleware backstop for /api/*.
 *
 * Every route under /api requires a session cookie (Stack Auth or the legacy
 * platform session) unless it matches a rule here. Listed routes either serve
 * the anonymous storefront / booking widget, or verify their own credentials
 * (webhook signatures, cron secrets, CMS API keys, agent-commerce protocols).
 *
 * This is a backstop only: per-route handlers still enforce real permissions
 * (withPermission / withTenantAuth / requireTenantMember / isSuperAdmin). The
 * allowlist stops a forgotten guard from being reachable anonymously.
 *
 * Built from this repo's own callers:
 *   grep -rhoE "['\"\`]/api/[a-zA-Z0-9_\-/\[\]\$\{\}\.]+" app/s components lib hooks \
 *     --include=*.ts --include=*.tsx --exclude-dir=admin | tr -d "'\"\`" | sort -u
 * plus the server-to-server callers in lib/cms/stripe/elements/checkout.ts.
 *
 * Table test: `npx tsx scripts/check-public-api.ts`
 */
type Rule = { test: RegExp; methods?: ReadonlyArray<string> }

const RULES: ReadonlyArray<Rule> = [
  // ---- Self-authenticating or intrinsically public (any method) ----
  // health; OAuth callbacks + session sync (handlers derive identity from the
  // session themselves); signature-verified webhooks; API-key routes
  // (platform MCP, demo setup, edge-config sync); cron (secret-verified).
  { test: /^\/api\/(health|auth|webhooks|platform\/mcp|setup\/demo|admin\/sync-edge-config)(\/|$)/ },
  { test: /^\/api\/bookings\/reminders$/ },
  { test: /^\/api\/(platform\/billing|dashboard\/subscription)\/webhook$/ },
  // CMS: csrf token, captcha config, session sync, webhooks, cron, content
  // delivery API (API-key), agent commerce (storefront MCP, UCP), socket.io.
  { test: /^\/api\/cms\/(csrf|captcha|auth|webhooks|cron|content|storefront\/mcp|ucp|socketio)(\/|$)/ },

  // ---- Platform (root domain) public reads/writes ----
  { test: /^\/api\/dashboard\/subdomain\/check$/, methods: ['GET'] },
  { test: /^\/api\/teams\/invitations\/[^/]+$/, methods: ['GET'] },
  { test: /^\/api\/bookings\/availability$/, methods: ['GET'] },
  { test: /^\/api\/bookings$/, methods: ['POST'] },
  { test: /^\/api\/bookings\/[^/]+$/, methods: ['GET'] },

  // ---- Tenant storefront reads ----
  { test: /^\/api\/cms\/(products|shop|events\/public|navigation|merchant-feed|images|features|admin\/branding|reviews\/product|reviews\/stats|vote)(\/|$)/, methods: ['GET'] },
  { test: /^\/api\/cms\/events\/[^/]+(\/(schedule|speakers|ticket-types))?$/, methods: ['GET'] },
  { test: /^\/api\/cms\/forms\/[^/]+$/, methods: ['GET'] },
  { test: /^\/api\/cms\/email\/(track|confirm)(\/|$)/, methods: ['GET'] },
  { test: /^\/api\/cms\/shipping\/tracking$/, methods: ['GET'] },
  { test: /^\/api\/cms\/checkout\/session$/, methods: ['GET', 'POST'] },
  { test: /^\/api\/cms\/payments\/intent$/, methods: ['GET', 'POST', 'PUT'] },

  // ---- Tenant storefront writes (checkout, cart, lead capture, opt-in) ----
  { test: /^\/api\/cms\/cart(\/|$)/ },
  { test: /^\/api\/cms\/checkout$/, methods: ['POST'] },
  { test: /^\/api\/cms\/discounts\/validate$/, methods: ['POST'] },
  { test: /^\/api\/cms\/shipping\/(rates|validate-address|elements\/auth)$/, methods: ['POST'] },
  { test: /^\/api\/cms\/inventory\/back-in-stock$/, methods: ['POST', 'DELETE'] },
  { test: /^\/api\/cms\/analytics$/, methods: ['POST'] },
  { test: /^\/api\/cms\/forms\/[^/]+\/submit$/, methods: ['POST'] },
  { test: /^\/api\/cms\/events\/[^/]+\/register$/, methods: ['POST'] },
  { test: /^\/api\/cms\/reviews\/[^/]+\/vote$/, methods: ['POST'] },
  { test: /^\/api\/cms\/vote$/, methods: ['GET', 'PATCH'] },
  { test: /^\/api\/cms\/email\/subscribe$/, methods: ['POST'] },
  { test: /^\/api\/cms\/email\/(unsubscribe|preferences)$/, methods: ['GET', 'POST'] },
]

export function isPublicApi(pathname: string, method: string): boolean {
  if (!pathname.startsWith('/api/')) return true
  const m = method.toUpperCase()
  if (m === 'OPTIONS' || m === 'HEAD') return true
  return RULES.some((r) => r.test.test(pathname) && (!r.methods || r.methods.includes(m)))
}

/**
 * Session cookies that prove "some user is signed in". Stack Auth, now named
 * Hexclave (tokenStore: nextjs-cookie), sets `hexclave-access` and
 * `hexclave-refresh-<projectId>`; sessions from before the rename carry
 * `stack-access` / `stack-refresh-<projectId>`. The legacy platform auth sets
 * `session`. Production may prefix with __Host-/__Secure-. Utility cookies
 * (…-is-https, oauth state) are ignored. Check: lib/public-api.assert.ts
 */
export const AUTH_COOKIE_RE = /^(?:__Host-|__Secure-)?(?:(?:stack|hexclave)-(?:access|refresh)|session)(?:-|$)/
