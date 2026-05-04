/**
 * Tenant Resolution for Media API Routes
 *
 * Provides a single helper to resolve the current tenant (subdomain + numeric ID)
 * from an incoming request. Used by all media API routes to enforce tenant isolation.
 *
 * Resolution: `x-subdomain` header only (set by middleware from hostname).
 * Query parameter fallback was removed to prevent cross-tenant access via
 * ?subdomain= spoofing.
 *
 * After resolving the subdomain name, we look up the numeric tenant ID and
 * validate that the authenticated user owns or has access to the subdomain.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sql } from '@/lib/neon'
import { canAccessSubdomain } from '@/lib/team-auth'
import { isSuperAdmin } from '@/lib/super-admin'

// Cache tenant ID lookups for 60 seconds to avoid repeated DB hits
const tenantIdCache = new Map<string, { id: number; timestamp: number }>()
const TENANT_CACHE_TTL = 60_000

export interface TenantContext {
  subdomain: string
  tenantId: number
}

/**
 * Extract the subdomain from the x-subdomain request header.
 *
 * SECURITY: Only reads from x-subdomain header (set by middleware from hostname).
 * Does NOT accept query params to prevent cross-tenant spoofing.
 */
export async function getSubdomainFromRequest(_request: NextRequest): Promise<string | null> {
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
    const result = await sql`
      SELECT id FROM subdomains
      WHERE subdomain = ${sanitized}
      LIMIT 1
    `
    if (result.length === 0) return null

    const id = result[0].id as number
    tenantIdCache.set(sanitized, { id, timestamp: Date.now() })
    return id
  } catch (error) {
    console.error('Tenant ID lookup error:', error)
    return null
  }
}

/**
 * Validate that a user owns, has team access to, or is a platform super admin
 * for a subdomain.
 *
 * Previously this only matched `subdomains.user_id = userId` (owner-only),
 * which silently locked out:
 *   - Team members with edit/admin access to a tenant
 *   - Platform super admins (who have a global bypass everywhere else)
 *
 * Now uses the canonical `canAccessSubdomain` + `isSuperAdmin` helpers so the
 * media routes match the rest of the per-tenant admin (withTenantAuth, etc.).
 *
 * `level` defaults to `'edit'` because all current callers are write paths
 * (upload, presign, complete). Read paths can pass `'view'`.
 */
export async function validateTenantOwnership(
  userId: string,
  subdomain: string,
  level: 'view' | 'edit' | 'admin' = 'edit'
): Promise<boolean> {
  try {
    if (await isSuperAdmin(userId)) return true
    const access = await canAccessSubdomain(userId, subdomain, level)
    return access.hasAccess
  } catch (error) {
    console.error('Tenant ownership validation error:', error)
    return false
  }
}

/**
 * Resolve full tenant context from a request + authenticated user.
 * Returns null if tenant cannot be resolved or user doesn't have access.
 *
 * Usage in API routes:
 * ```ts
 * const tenant = await resolveTenantContext(request, user.id)
 * if (!tenant) {
 *   return NextResponse.json({ error: 'Tenant required' }, { status: 400 })
 * }
 * ```
 */
export async function resolveTenantContext(
  request: NextRequest,
  userId: string
): Promise<TenantContext | null> {
  const subdomain = await getSubdomainFromRequest(request)
  if (!subdomain) return null

  // Validate ownership
  const owns = await validateTenantOwnership(userId, subdomain)
  if (!owns) return null

  // Look up numeric ID
  const tenantId = await getTenantIdBySubdomain(subdomain)
  if (!tenantId) return null

  return { subdomain, tenantId }
}

/**
 * Return an error response when tenant context is missing.
 */
export function tenantRequiredResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Subdomain is required. Request must originate from a tenant subdomain.' },
    { status: 400 }
  )
}

/**
 * Return an error response when tenant ownership fails.
 */
export function tenantAccessDeniedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Access denied: you do not own this subdomain' },
    { status: 403 }
  )
}
