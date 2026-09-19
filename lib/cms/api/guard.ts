/**
 * requireTenantMember — route-level guard for tenant-scoped admin handlers
 * that were written with `withTenant()` (tenant scoping only, no auth) or a
 * bare `stackServerApp.getUser()` (session only, no tenant access check).
 *
 * It enforces, in order:
 *   1. tenant context (x-subdomain set by middleware) → 400 if missing
 *   2. a signed-in Stack Auth user → 401
 *   3. platform super admin OR owner / team access to THIS tenant at the
 *      requested level (view | edit | admin) → 403
 *
 * The wrapped handler runs unchanged afterwards, so existing `withTenant()`
 * scoping inside it keeps working.
 *
 * Usage:
 * ```ts
 * async function _GET(request: NextRequest, context: RouteContext) { ... }
 * export const GET = requireTenantMember('view', _GET)
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/lib/cms/stack'
import { canAccessSubdomain } from '@/lib/team-auth'
import { isSuperAdmin } from '@/lib/super-admin'
import { resolveCmsTenantContext, tenantRequiredResponse } from '@/lib/cms/tenant-context'

export type TenantAccessLevel = 'view' | 'edit' | 'admin'

export function requireTenantMember<T extends unknown[], R extends Response>(
  level: TenantAccessLevel,
  handler: (request: NextRequest, ...args: T) => Promise<R>,
) {
  return async (request: NextRequest, ...args: T): Promise<R | NextResponse> => {
    const tenant = await resolveCmsTenantContext(request)
    if (!tenant) {
      return tenantRequiredResponse()
    }

    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const superAdmin = await isSuperAdmin(user.id)
    if (!superAdmin) {
      const access = await canAccessSubdomain(user.id, tenant.subdomain, level)
      if (!access.hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: insufficient access to this site' },
          { status: 403 },
        )
      }
    }

    return handler(request, ...args)
  }
}
