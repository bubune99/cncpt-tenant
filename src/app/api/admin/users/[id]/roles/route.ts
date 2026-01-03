/**
 * User Roles API
 *
 * GET /api/admin/users/[id]/roles - Get user's roles
 * POST /api/admin/users/[id]/roles - Assign a role
 * DELETE /api/admin/users/[id]/roles - Remove a role
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/permissions/middleware'
import { PERMISSIONS, assignRole, removeRole } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get user's assigned roles
export const GET = withPermission(
  PERMISSIONS.USERS_ROLES,
  async (_request: NextRequest, _context: AuthContext, { params }: RouteParams) => {
    try {
      const { id: userId } = await params

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          roleAssignments: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  description: true,
                  permissions: true,
                  isSystem: true,
                },
              },
            },
            orderBy: {
              role: {
                position: 'asc',
              },
            },
          },
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        userId: user.id,
        email: user.email,
        name: user.name,
        roles: user.roleAssignments.map((ra) => ({
          id: ra.role.id,
          name: ra.role.name,
          displayName: ra.role.displayName,
          description: ra.role.description,
          permissions: ra.role.permissions,
          isSystem: ra.role.isSystem,
          assignedAt: ra.createdAt,
          assignedBy: ra.assignedBy,
        })),
      })
    } catch (error) {
      console.error('Get user roles error:', error)
      return NextResponse.json(
        { error: 'Failed to get user roles' },
        { status: 500 }
      )
    }
  }
)

// POST - Assign a role to user
export const POST = withPermission(
  PERMISSIONS.USERS_ROLES,
  async (request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id: userId } = await params
      const body = await request.json()

      if (!body.roleId) {
        return NextResponse.json(
          { error: 'Role ID is required' },
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

      // Verify role exists
      const role = await prisma.role.findUnique({
        where: { id: body.roleId },
      })

      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }

      // Check if already assigned
      const existing = await prisma.roleAssignment.findUnique({
        where: {
          userId_roleId: {
            userId,
            roleId: body.roleId,
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Role already assigned to this user' },
          { status: 409 }
        )
      }

      // Assign role
      await assignRole({
        userId,
        roleId: body.roleId,
        assignedBy: context.user.id,
      })

      return NextResponse.json({
        success: true,
        message: `Role "${role.displayName}" assigned to user`,
      })
    } catch (error) {
      console.error('Assign role error:', error)
      return NextResponse.json(
        { error: 'Failed to assign role' },
        { status: 500 }
      )
    }
  }
)

// DELETE - Remove a role from user
export const DELETE = withPermission(
  PERMISSIONS.USERS_ROLES,
  async (request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id: userId } = await params
      const { searchParams } = new URL(request.url)
      const roleId = searchParams.get('roleId')

      if (!roleId) {
        return NextResponse.json(
          { error: 'Role ID is required as query parameter' },
          { status: 400 }
        )
      }

      // Verify assignment exists
      const assignment = await prisma.roleAssignment.findUnique({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
        include: {
          role: true,
        },
      })

      if (!assignment) {
        return NextResponse.json(
          { error: 'Role assignment not found' },
          { status: 404 }
        )
      }

      // Remove role
      await removeRole({
        userId,
        roleId,
        removedBy: context.user.id,
      })

      return NextResponse.json({
        success: true,
        message: `Role "${assignment.role.displayName}" removed from user`,
      })
    } catch (error) {
      console.error('Remove role error:', error)
      return NextResponse.json(
        { error: 'Failed to remove role' },
        { status: 500 }
      )
    }
  }
)
