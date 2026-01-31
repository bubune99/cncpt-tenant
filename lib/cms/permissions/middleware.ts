/**
 * Permission Middleware
 * Protect API routes and server actions with permission checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '../stack'
import { prisma } from '../db'
import { getUserPermissions, checkPermission, type UserWithPermissions } from './index'

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
 * Get current authenticated user with permissions
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

    // Get user permissions
    const permissions = await getUserPermissions(user.id)
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
 *
 * Usage:
 * ```ts
 * export const GET = withPermission('products.view', async (req, context) => {
 *   // context.user is available here
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
      const authContext = await requirePermission(permission)
      return await handler(request, authContext, ...args)
    } catch (error) {
      return handleAuthError(error)
    }
  }
}

/**
 * Wrap with any permission check
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
      const authContext = await requireAnyPermission(permissions)
      return await handler(request, authContext, ...args)
    } catch (error) {
      return handleAuthError(error)
    }
  }
}

/**
 * Wrap with auth only (no specific permission required)
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
      const authContext = await requireAuth()
      return await handler(request, authContext, ...args)
    } catch (error) {
      return handleAuthError(error)
    }
  }
}

/**
 * Wrap with super admin check
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
