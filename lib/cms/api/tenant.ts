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
import {
  requireAuth,
  handleAuthError,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'

export type { CmsTenantContext }
export { tenantRequiredResponse }

/** Acting CMS user resolved by {@link withTenantAuth}. */
export type TenantAuthUser = AuthContext['user']

/**
 * Coarse action gate for {@link withTenantAuth}. Both values currently require
 * an authenticated CMS staff user (a row in `User` with a permissions record);
 * the distinction is kept so call sites document intent and so finer-grained
 * per-resource permission gates can be layered in later without touching the
 * 22 mutation routes that consume this wrapper.
 */
export type TenantAuthAction = 'view' | 'edit'

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

/**
 * Wrap an API route handler with authentication + tenant context resolution.
 *
 * - Requires an authenticated CMS staff user (401 if not logged in, 403 if the
 *   user has no permissions record) — never allows anonymous mutations.
 * - Resolves tenant context from the x-subdomain header (400 if missing).
 * - Runs the handler inside `runWithTenant()` so all Prisma queries are
 *   automatically scoped to the current tenant.
 * - Passes the resolved `tenant` and acting `user` to the handler.
 *
 * Usage:
 * ```ts
 * export async function PATCH(request: NextRequest) {
 *   return withTenantAuth(request, 'edit', async (tenant, user) => {
 *     await prisma.order.update({ data: { updatedById: user.id } }) // auto-scoped
 *     return NextResponse.json({ success: true })
 *   })
 * }
 * ```
 */
export async function withTenantAuth(
  request: NextRequest,
  _action: TenantAuthAction,
  handler: (
    tenant: CmsTenantContext,
    user: TenantAuthUser
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authContext = await requireAuth()

    const tenant = await getTenantContext(request)
    if (!tenant) {
      return tenantRequiredResponse()
    }

    return runWithTenant(tenant.tenantId, () =>
      handler(tenant, authContext.user)
    )
  } catch (error) {
    return handleAuthError(error)
  }
}
