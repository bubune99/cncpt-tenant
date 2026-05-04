/**
 * Permission Middleware
 * Protect API routes and server actions with permission checks
 *
 * All withPermission-wrapped routes automatically resolve tenant context
 * from the x-subdomain header and set it via runWithTenant(), ensuring
 * the Prisma tenant middleware scopes all queries to the current tenant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '../stack'
import { prisma, runWithTenant, getCurrentTenant } from '../db'
import { getUserPermissions, checkPermission, type UserWithPermissions } from './index'
import { resolveCmsTenantContext } from '../tenant-context'
import { canAccessSubdomain } from '@/lib/team-auth'
import { isSuperAdmin as isPlatformSuperAdmin } from '@/lib/super-admin'

export interface AuthContext {
  user: {
    id: string
    email: string
    name: string | null
    stackAuthId: string
  }
  permissions: UserWithPermissions
}

/**
 * Get current authenticated user with permissions.
 *
 * If called inside a tenant-scoped context (i.e. wrapped in `runWithTenant`),
 * permissions are filtered to that tenant + global. If no tenant context is
 * set (platform/CLI), returns the user's full cross-tenant permission set.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const stackUser = await stackServerApp.getUser()
    if (!stackUser) return null

    // Find user in our database
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
    })

    if (!user) return null

    // Get user permissions, scoped to the current tenant if one is set in
    // AsyncLocalStorage. `getCurrentTenant()` returns null when there's no
    // tenant context, in which case getUserPermissions returns the global
    // set (platform-admin / CLI behavior).
    const currentTenant = getCurrentTenant()
    const permissions = await getUserPermissions(
      user.id,
      currentTenant === null ? undefined : currentTenant,
    )
    if (!permissions) return null

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        stackAuthId: stackUser.id,
      },
      permissions,
    }
  } catch {
    return null
  }
}

/**
 * Require authentication - returns 401 if not logged in
 */
export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext()
  if (!context) {
    throw new AuthError('Unauthorized', 401)
  }
  return context
}

/**
 * Require specific permission - returns 403 if not allowed
 */
export async function requirePermission(permission: string): Promise<AuthContext> {
  const context = await requireAuth()
  const result = checkPermission(context.permissions, permission)

  if (!result.allowed) {
    throw new AuthError(result.reason || 'Forbidden', 403)
  }

  return context
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(permissions: string[]): Promise<AuthContext> {
  const context = await requireAuth()

  const hasAny = permissions.some((p) => checkPermission(context.permissions, p).allowed)

  if (!hasAny) {
    throw new AuthError('Forbidden', 403)
  }

  return context
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(permissions: string[]): Promise<AuthContext> {
  const context = await requireAuth()

  const hasAll = permissions.every((p) => checkPermission(context.permissions, p).allowed)

  if (!hasAll) {
    throw new AuthError('Forbidden', 403)
  }

  return context
}

/**
 * Require super admin access
 */
export async function requireSuperAdmin(): Promise<AuthContext> {
  const context = await requireAuth()

  if (!context.permissions.permissions.has('*')) {
    throw new AuthError('Super admin access required', 403)
  }

  return context
}

/**
 * Custom auth error class
 */
export class AuthError extends Error {
  status: number

  constructor(message: string, status: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/**
 * Handle auth errors in API routes
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    )
  }

  console.error('Unexpected auth error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

/**
 * Higher-order function to wrap API route handlers with permission check
 * and automatic tenant context resolution.
 *
 * Reads the x-subdomain header (set by middleware) and automatically
 * sets the tenant context so all Prisma queries are tenant-scoped.
 *
 * Usage:
 * ```ts
 * export const GET = withPermission('products.view', async (req, context) => {
 *   // context.user is available here
 *   // Prisma queries are automatically scoped to the current tenant
 *   return NextResponse.json({ products: [] })
 * })
 * ```
 */
export function withPermission<T extends unknown[]>(
  permission: string,
  handler: (
    request: NextRequest,
    context: AuthContext,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Resolve tenant FIRST so getAuthContext picks up the right scope.
      const tenantContext = await resolveCmsTenantContext(request)

      if (tenantContext) {
        // Run the entire pipeline inside tenant scope so getAuthContext()
        // (called by requirePermission) sees the current tenantId via
        // AsyncLocalStorage and getUserPermissions filters role assignments
        // and overrides to that tenant + global.
        return await runWithTenant(tenantContext.tenantId, async () => {
          const authContext = await requirePermission(permission)

          // Belt-and-suspenders tenant ownership check.
          //
          // Even though getUserPermissions is now tenant-scoped (see
          // lib/cms/permissions/index.ts), we keep an explicit
          // canAccessSubdomain() check here for two reasons:
          //   1. It enforces ownership/team-membership semantics that are
          //      orthogonal to the RBAC permission set (e.g. owner role,
          //      collaborator-with-edit-level).
          //   2. It defends against future code paths that might inadvertently
          //      grant tenant-X users a permission scoped to tenant-Y.
          // This duplication is deliberate. Do not remove without auditing
          // canAccessSubdomain coverage end-to-end first.
          const platformSuperAdmin = await isPlatformSuperAdmin(authContext.user.stackAuthId)
          if (!platformSuperAdmin) {
            const access = await canAccessSubdomain(
              authContext.user.stackAuthId,
              tenantContext.subdomain,
              'edit',
            )
            if (!access.hasAccess) {
              return NextResponse.json(
                { error: 'Forbidden: insufficient access to this site' },
                { status: 403 },
              )
            }
          }

          return handler(request, authContext, ...args)
        })
      }

      // No tenant context (platform-level operation) - run without scoping
      const authContext = await requirePermission(permission)
      return await handler(request, authContext, ...args)
    } catch (error) {
      return handleAuthError(error)
    }
  }
}

/**
 * Wrap with any permission check (with automatic tenant context)
 */
export function withAnyPermission<T extends unknown[]>(
  permissions: string[],
  handler: (
    request: NextRequest,
    context: AuthContext,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const tenantContext = await resolveCmsTenantContext(request)

      if (tenantContext) {
        return await runWithTenant(tenantContext.tenantId, async () => {
          const authContext = await requireAnyPermission(permissions)

          // Belt-and-suspenders tenant ownership check — see withPermission()
          // for why this duplicates the now-scoped getUserPermissions check.
          const platformSuperAdmin = await isPlatformSuperAdmin(authContext.user.stackAuthId)
          if (!platformSuperAdmin) {
            const access = await canAccessSubdomain(
              authContext.user.stackAuthId,
              tenantContext.subdomain,
              'edit',
            )
            if (!access.hasAccess) {
              return NextResponse.json(
                { error: 'Forbidden: insufficient access to this site' },
                { status: 403 },
              )
            }
          }
          return handler(request, authContext, ...args)
        })
      }

      const authContext = await requireAnyPermission(permissions)
      return await handler(request, authContext, ...args)
    } catch (error) {
      return handleAuthError(error)
    }
  }
}

/**
 * Wrap with auth only (no specific permission required, with automatic tenant context)
 */
export function withAuth<T extends unknown[]>(
  handler: (
    request: NextRequest,
    context: AuthContext,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const tenantContext = await resolveCmsTenantContext(request)

      if (tenantContext) {
        return await runWithTenant(tenantContext.tenantId, async () => {
          const authContext = await requireAuth()

          // Belt-and-suspenders tenant ownership check — see withPermission()
          // for why this duplicates the now-scoped getUserPermissions check.
          const platformSuperAdmin = await isPlatformSuperAdmin(authContext.user.stackAuthId)
          if (!platformSuperAdmin) {
            const access = await canAccessSubdomain(
              authContext.user.stackAuthId,
              tenantContext.subdomain,
              'edit',
            )
            if (!access.hasAccess) {
              return NextResponse.json(
                { error: 'Forbidden: insufficient access to this site' },
                { status: 403 },
              )
            }
          }
          return handler(request, authContext, ...args)
        })
      }

      const authContext = await requireAuth()
      return await handler(request, authContext, ...args)
    } catch (error) {
      return handleAuthError(error)
    }
  }
}

/**
 * Wrap with super admin check (with automatic tenant context)
 */
export function withSuperAdmin<T extends unknown[]>(
  handler: (
    request: NextRequest,
    context: AuthContext,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authContext = await requireSuperAdmin()

      const tenantContext = await resolveCmsTenantContext(request)
      if (tenantContext) {
        return await runWithTenant(tenantContext.tenantId, () =>
          handler(request, authContext, ...args)
        )
      }

      return await handler(request, authContext, ...args)
    } catch (error) {
      return handleAuthError(error)
    }
  }
}

/**
 * Client-side hook helper - check if current user has permission
 * Returns a function to check permissions against cached user data
 */
export function createPermissionChecker(permissions: UserWithPermissions) {
  return (permission: string): boolean => {
    return checkPermission(permissions, permission).allowed
  }
}
