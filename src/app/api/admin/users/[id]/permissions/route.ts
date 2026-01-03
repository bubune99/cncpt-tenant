/**
 * User Permissions API
 *
 * GET /api/admin/users/[id]/permissions - Get user's permissions summary
 * POST /api/admin/users/[id]/permissions - Add permission override
 * DELETE /api/admin/users/[id]/permissions - Remove permission override
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/permissions/middleware'
import {
  PERMISSIONS,
  getUserPermissions,
  grantPermission,
  denyPermission,
  removePermissionOverride,
} from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get user's complete permissions summary
export const GET = withPermission(
  PERMISSIONS.USERS_PERMISSIONS,
  async (_request: NextRequest, _context: AuthContext, { params }: RouteParams) => {
    try {
      const { id: userId } = await params

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const permissions = await getUserPermissions(userId)

      if (!permissions) {
        return NextResponse.json(
          { error: 'Failed to load permissions' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        userId: user.id,
        email: user.email,
        name: user.name,
        roles: permissions.roles.map((r) => ({
          id: r.id,
          name: r.name,
          displayName: r.displayName,
          permissions: r.permissions,
        })),
        overrides: permissions.overrides.map((o) => ({
          id: o.id,
          permission: o.permission,
          type: o.type,
          expiresAt: o.expiresAt,
          reason: o.reason,
        })),
        effectivePermissions: Array.from(permissions.permissions),
        isSuperAdmin: permissions.permissions.has('*'),
      })
    } catch (error) {
      console.error('Get user permissions error:', error)
      return NextResponse.json(
        { error: 'Failed to get user permissions' },
        { status: 500 }
      )
    }
  }
)

// POST - Add or update permission override
export const POST = withPermission(
  PERMISSIONS.USERS_PERMISSIONS,
  async (request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id: userId } = await params
      const body = await request.json()

      if (!body.permission) {
        return NextResponse.json(
          { error: 'Permission string is required' },
          { status: 400 }
        )
      }

      if (!body.type || !['GRANT', 'DENY'].includes(body.type)) {
        return NextResponse.json(
          { error: 'Type must be GRANT or DENY' },
          { status: 400 }
        )
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Parse expiration date if provided
      let expiresAt: Date | undefined
      if (body.expiresAt) {
        expiresAt = new Date(body.expiresAt)
        if (isNaN(expiresAt.getTime())) {
          return NextResponse.json(
            { error: 'Invalid expiration date' },
            { status: 400 }
          )
        }
      }

      // Apply override
      if (body.type === 'GRANT') {
        await grantPermission({
          userId,
          permission: body.permission,
          expiresAt,
          reason: body.reason,
          grantedBy: context.user.id,
        })
      } else {
        await denyPermission({
          userId,
          permission: body.permission,
          expiresAt,
          reason: body.reason,
          deniedBy: context.user.id,
        })
      }

      return NextResponse.json({
        success: true,
        message: `Permission "${body.permission}" ${body.type === 'GRANT' ? 'granted to' : 'denied for'} user`,
      })
    } catch (error) {
      console.error('Add permission override error:', error)
      return NextResponse.json(
        { error: 'Failed to add permission override' },
        { status: 500 }
      )
    }
  }
)

// DELETE - Remove permission override
export const DELETE = withPermission(
  PERMISSIONS.USERS_PERMISSIONS,
  async (request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id: userId } = await params
      const { searchParams } = new URL(request.url)
      const permission = searchParams.get('permission')

      if (!permission) {
        return NextResponse.json(
          { error: 'Permission string is required as query parameter' },
          { status: 400 }
        )
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Remove override
      await removePermissionOverride({
        userId,
        permission,
        removedBy: context.user.id,
      })

      return NextResponse.json({
        success: true,
        message: `Permission override for "${permission}" removed`,
      })
    } catch (error) {
      console.error('Remove permission override error:', error)
      return NextResponse.json(
        { error: 'Failed to remove permission override' },
        { status: 500 }
      )
    }
  }
)
