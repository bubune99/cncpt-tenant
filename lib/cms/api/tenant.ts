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
