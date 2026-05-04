/**
 * Tenant Context Utility for CMS API Routes
 *
 * Provides a simple way to resolve tenant context in API routes that don't
 * use the withPermission/withTenantContext higher-order wrappers.
 *
 * Uses the same underlying resolution as resolveCmsTenantContext and
 * runWithTenant to ensure the Prisma tenant middleware auto-filters queries.
 *
 * Usage:
 * ```ts
 * import { getTenantContext, requireTenantContext, withTenant } from '@/lib/cms/api/tenant'
 * import { runWithTenant } from '@/lib/cms/db'
 *
 * // Option 1: Manual resolution + runWithTenant
 * export async function GET(request: NextRequest) {
 *   const tenant = await requireTenantContext(request)
 *   return runWithTenant(tenant.tenantId, async () => {
 *     const items = await prisma.page.findMany()
 *     return NextResponse.json(items)
 *   })
 * }
 *
 * // Option 2: withTenant wrapper (recommended)
 * export async function GET(request: NextRequest) {
 *   return withTenant(request, async (tenant) => {
 *     const items = await prisma.page.findMany()
 *     return NextResponse.json(items)
 *   })
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { runWithTenant } from '@/lib/cms/db'
import {
  resolveCmsTenantContext,
  tenantRequiredResponse,
  type CmsTenantContext,
} from '@/lib/cms/tenant-context'
import { stackServerApp } from '@/lib/cms/stack'
import { canAccessSubdomain } from '@/lib/team-auth'
import { isSuperAdmin } from '@/lib/super-admin'
import {
  rateLimitCheck,
  getClientIp,
  type RateLimitConfig,
} from '@/lib/cms/rate-limit'

export type { CmsTenantContext }
export { tenantRequiredResponse }

/**
 * Resolve tenant context from the current request.
 * Returns null if no tenant context can be determined.
 *
 * NOTE: This does NOT set the Prisma tenant context automatically.
 * You must wrap your queries in runWithTenant(tenant.tenantId, ...) yourself,
 * or use withTenant() instead.
 */
export async function getTenantContext(
  request?: NextRequest
): Promise<CmsTenantContext | null> {
  return resolveCmsTenantContext(request)
}

/**
 * Require tenant context - throws TenantContextError if not available.
 *
 * NOTE: This does NOT set the Prisma tenant context automatically.
 * You must wrap your queries in runWithTenant(tenant.tenantId, ...) yourself,
 * or use withTenant() instead.
 */
export async function requireTenantContext(
  request?: NextRequest
): Promise<CmsTenantContext> {
  const tenant = await getTenantContext(request)
  if (!tenant) {
    throw new TenantContextError()
  }
  return tenant
}

/**
 * Error class for missing tenant context.
 */
export class TenantContextError extends Error {
  constructor() {
    super('Tenant context required')
    this.name = 'TenantContextError'
  }

  toResponse(): NextResponse {
    return tenantRequiredResponse()
  }
}

/**
 * Check if an error is a TenantContextError.
 */
export function isTenantContextError(error: unknown): error is TenantContextError {
  return error instanceof TenantContextError
}

/**
 * Wrap an API route handler with automatic tenant context resolution.
 * Returns 400 if tenant context cannot be resolved.
 * Runs the handler within runWithTenant() so Prisma queries are auto-scoped.
 *
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   return withTenant(request, async (tenant) => {
 *     const items = await prisma.page.findMany() // auto-scoped
 *     return NextResponse.json(items)
 *   })
 * }
 * ```
 */
export async function withTenant(
  request: NextRequest,
  handler: (tenant: CmsTenantContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const tenant = await getTenantContext(request)
  if (!tenant) {
    return tenantRequiredResponse()
  }
  return runWithTenant(tenant.tenantId, () => handler(tenant))
}

// ---------------------------------------------------------------------------
// Default per-IP / per-IP+user rate limits applied to every withTenantAuth
// route. Tunable via the options arg; pass `{ rateLimit: false }` to opt out
// (e.g. long-poll / SSE / streaming endpoints) or `{ rateLimit: <config> }`
// for a custom config (e.g. burst-friendly admin export jobs).
//
// NOTE on storage: these limits ride on the existing Upstash Redis-backed
// limiter (`lib/cms/rate-limit`). It works across serverless instances and
// survives deploys. If the Upstash env vars are missing the limiter calls
// will throw — callers can either set `KV_REST_API_URL`/`KV_REST_API_TOKEN`
// or pass `{ rateLimit: false }` until the credentials are wired up.
// ---------------------------------------------------------------------------

/** Default rate-limit presets, by required access level. */
const DEFAULT_AUTH_RATE_LIMITS: Record<
  'view' | 'edit' | 'admin',
  RateLimitConfig
> = {
  view: { maxRequests: 60, windowMs: 60_000 },
  edit: { maxRequests: 30, windowMs: 60_000 },
  admin: { maxRequests: 30, windowMs: 60_000 },
}

export interface WithTenantAuthOptions {
  /**
   * Per-IP rate-limit config. Pass `false` to disable. Pass a RateLimitConfig
   * to override the default for the level (e.g. tighter / looser bucket).
   * Default: see DEFAULT_AUTH_RATE_LIMITS — view=60/min, edit=30/min,
   * admin=30/min. Admin/edit also keys on the authenticated user id, not
   * just IP, to defeat shared-NAT bypass.
   */
  rateLimit?: false | RateLimitConfig
}

/**
 * Wrap an API route handler with:
 * - Tenant context resolution (from x-subdomain header)
 * - Default per-IP (and per-user for edit/admin) rate limit (429 on exceed)
 * - Authentication requirement (returns 401 if not signed in)
 * - Tenant ownership/access check (returns 403 if user is not owner / team
 *   member with sufficient access level / super admin)
 *
 * This is the recommended wrapper for any tenant-scoped admin/mutation route.
 * It closes the cross-tenant data leak where any authenticated user could read
 * or write to any tenant's data simply by hitting <victim>.cncptweb.com/api/...
 *
 * Usage:
 * ```ts
 * export const POST = (req: NextRequest) =>
 *   withTenantAuth(req, 'edit', async (tenant, user) => {
 *     // user has at least edit-level access to tenant.subdomain
 *     const product = await prisma.product.create(...)
 *     return NextResponse.json(product, { status: 201 })
 *   })
 *
 * // Disable default rate limit (e.g. for SSE / streaming endpoints):
 * export const POST = (req: NextRequest) =>
 *   withTenantAuth(req, 'edit', async (tenant, user) => { ... }, { rateLimit: false })
 * ```
 */
export async function withTenantAuth(
  request: NextRequest,
  requiredLevel: 'view' | 'edit' | 'admin',
  handler: (
    tenant: CmsTenantContext,
    user: { id: string; email: string },
  ) => Promise<NextResponse>,
  options: WithTenantAuthOptions = {},
): Promise<NextResponse> {
  const tenant = await getTenantContext(request)
  if (!tenant) {
    return tenantRequiredResponse()
  }

  // Pre-auth IP rate limit. Doing this before user lookup means an
  // unauthenticated attacker can't DOS the user-lookup path either.
  if (options.rateLimit !== false) {
    const config: RateLimitConfig = options.rateLimit ?? {
      ...DEFAULT_AUTH_RATE_LIMITS[requiredLevel],
      // Per-route default: include the route path + tenant subdomain in
      // the key prefix so noisy /api/cms/orders traffic doesn't drain the
      // /api/cms/products budget for the same caller.
      keyPrefix: `tenant-auth:${tenant.subdomain}:${new URL(request.url).pathname}:${requiredLevel}`,
    }
    try {
      const limited = await rateLimitCheck(request, config)
      if (limited) return limited
    } catch (err) {
      // If the rate-limit backend is unreachable (Redis down, env missing)
      // we fail open — security-critical access checks still run below.
      // This is intentional: we'd rather degrade rate-limiting than 500
      // every request and break the platform.
      console.warn('[withTenantAuth] rate-limit backend unavailable:', err)
    }
  }

  const user = await stackServerApp.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Stronger second-tier limit for edit/admin: include the user id in the
  // key so a single attacker behind a CGNAT / corporate proxy can't pool
  // their attempts under one IP. View-level reads keep the IP-only key
  // since the cost of a read is much lower.
  if (
    options.rateLimit !== false &&
    (requiredLevel === 'edit' || requiredLevel === 'admin')
  ) {
    try {
      const ip = getClientIp(request)
      const userKeyConfig: RateLimitConfig = {
        ...DEFAULT_AUTH_RATE_LIMITS[requiredLevel],
        keyPrefix: `tenant-auth:${tenant.subdomain}:${new URL(request.url).pathname}:${requiredLevel}:user:${user.id}:ip:${ip}`,
      }
      const limited = await rateLimitCheck(request, userKeyConfig)
      if (limited) return limited
    } catch (err) {
      console.warn('[withTenantAuth] per-user rate-limit backend unavailable:', err)
    }
  }

  // Super admins bypass tenant ownership checks
  const superAdmin = await isSuperAdmin(user.id)

  if (!superAdmin) {
    const access = await canAccessSubdomain(user.id, tenant.subdomain, requiredLevel)
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient access to this site' },
        { status: 403 },
      )
    }
  }

  return runWithTenant(tenant.tenantId, () =>
    handler(tenant, { id: user.id, email: user.primaryEmail || '' }),
  )
}
