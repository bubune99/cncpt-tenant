/**
 * Tenant Context Resolution for CMS API Routes
 *
 * Provides helpers to resolve the current tenant (subdomain + numeric ID)
 * from an incoming request. Used by all CMS admin API routes to enforce
 * tenant isolation.
 *
 * Resolution: `x-subdomain` header only (set by middleware from hostname).
 * The middleware strips any client-supplied x-subdomain header before setting
 * its own, preventing spoofing. Query parameter fallback was removed to close
 * a cross-tenant access vector.
 *
 * After resolving the subdomain name, we look up the numeric tenant ID
 * from the database and cache it for 60 seconds.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma, runWithTenant } from './db'

// Cache tenant ID lookups for 60 seconds to avoid repeated DB hits
const tenantIdCache = new Map<string, { id: number; timestamp: number }>()
const TENANT_CACHE_TTL = 60_000

export interface CmsTenantContext {
  subdomain: string
  tenantId: number
}

/**
 * Extract the subdomain from the x-subdomain request header.
 *
 * SECURITY: The subdomain is ONLY read from the x-subdomain header, which is
 * set exclusively by the middleware from the hostname. We intentionally do NOT
 * accept a `subdomain` query parameter here, as that would allow clients to
 * spoof tenant context by passing `?subdomain=victim-tenant` to any API route
 * wrapped with withPermission/withTenantContext.
 *
 * Routes that need to accept a subdomain from query params (e.g., public branding
 * reads) should handle that explicitly in the route handler with their own auth checks.
 */
export async function getSubdomainFromRequest(_request?: NextRequest): Promise<string | null> {
  const headersList = await headers()
  return headersList.get('x-subdomain')
}

/**
 * Look up the numeric tenant ID for a subdomain.
 * Results are cached for 60 seconds.
 */
export async function getTenantIdBySubdomain(subdomain: string): Promise<number | null> {
  const sanitized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')

  // Check cache
  const cached = tenantIdCache.get(sanitized)
  if (cached && Date.now() - cached.timestamp < TENANT_CACHE_TTL) {
    return cached.id
  }

  try {
    const result = await prisma.subdomain.findUnique({
      where: { subdomain: sanitized },
      select: { id: true },
    })

    if (!result) return null

    tenantIdCache.set(sanitized, { id: result.id, timestamp: Date.now() })
    return result.id
  } catch (error) {
    console.error('[cms-tenant] Tenant ID lookup error:', error)
    return null
  }
}

/**
 * Resolve full tenant context from a request.
 * Returns null if tenant cannot be resolved.
 *
 * Usage in API routes:
 * ```ts
 * const tenant = await resolveCmsTenantContext(request)
 * if (!tenant) {
 *   return tenantRequiredResponse()
 * }
 * ```
 */
export async function resolveCmsTenantContext(
  request?: NextRequest
): Promise<CmsTenantContext | null> {
  const subdomain = await getSubdomainFromRequest(request)
  if (!subdomain) return null

  const tenantId = await getTenantIdBySubdomain(subdomain)
  if (!tenantId) return null

  return { subdomain, tenantId }
}

/**
 * Return an error response when tenant context is missing.
 */
export function tenantRequiredResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Tenant context required. Request must originate from a tenant subdomain (x-subdomain header set by middleware).' },
    { status: 400 }
  )
}

/**
 * Higher-order function that wraps an API route handler to automatically
 * resolve tenant context and set it before executing the handler.
 *
 * This ensures the Prisma tenant middleware automatically scopes all queries.
 *
 * If no tenant context can be resolved, the handler still runs (for
 * platform-level operations). If you want to REQUIRE tenant context,
 * use `withRequiredTenantContext` instead.
 *
 * Usage:
 * ```ts
 * export const GET = withTenantContext(async (request, tenantContext) => {
 *   // tenantContext is { subdomain, tenantId } or null
 *   const pages = await prisma.page.findMany() // auto-scoped if tenant set
 *   return NextResponse.json({ pages })
 * })
 * ```
 */
export function withTenantContext<T extends unknown[]>(
  handler: (
    request: NextRequest,
    tenantContext: CmsTenantContext | null,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const tenantContext = await resolveCmsTenantContext(request)

    if (tenantContext) {
      return runWithTenant(tenantContext.tenantId, () =>
        handler(request, tenantContext, ...args)
      )
    }

    return handler(request, null, ...args)
  }
}

/**
 * Like `withTenantContext`, but returns 400 if no tenant context can be resolved.
 */
export function withRequiredTenantContext<T extends unknown[]>(
  handler: (
    request: NextRequest,
    tenantContext: CmsTenantContext,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const tenantContext = await resolveCmsTenantContext(request)

    if (!tenantContext) {
      return tenantRequiredResponse()
    }

    return runWithTenant(tenantContext.tenantId, () =>
      handler(request, tenantContext, ...args)
    )
  }
}
