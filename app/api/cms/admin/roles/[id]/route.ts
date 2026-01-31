/**
 * Single Role API
 *
 * GET /api/admin/roles/[id] - Get role details
 * PUT /api/admin/roles/[id] - Update role
 * DELETE /api/admin/roles/[id] - Delete role
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'
import {
  withPermission,
  type AuthContext,
} from '../../../../../lib/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '../../../../../lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get role details
export const GET = withPermission(
  PERMISSIONS.ROLES_VIEW,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
          assignments: {
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions,
        isSystem: role.isSystem,
        position: role.position,
        assignmentCount: role._count.assignments,
        recentAssignments: role.assignments.map((a) => ({
          userId: a.user.id,
          email: a.user.email,
          name: a.user.name,
          assignedAt: a.createdAt,
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })
    } catch (error) {
      console.error('Get role error:', error)
      return NextResponse.json(
        { error: 'Failed to get role' },
        { status: 500 }
      )
    }
  }
)

// PUT - Update role
export const PUT = withPermission(
  PERMISSIONS.ROLES_EDIT,
  async (request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params
      const body = await request.json()

      const role = await prisma.role.findUnique({
        where: { id },
      })

      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }

      // System roles have restrictions
      if (role.isSystem) {
        // Can't change name of system roles
        if (body.name && body.name !== role.name) {
          return NextResponse.json(
            { error: 'Cannot change the name of a system role' },
            { status: 400 }
          )
        }

        // Super admin role can't have permissions changed
        if (role.name === 'super_admin' && body.permissions) {
          return NextResponse.json(
            { error: 'Cannot modify permissions of the super admin role' },
            { status: 400 }
          )
        }
      }

      const updateData: Record<string, unknown> = {}

      if (body.displayName?.trim()) {
        updateData.displayName = body.displayName.trim()
      }

      if (body.description !== undefined) {
        updateData.description = body.description?.trim() || null
      }

      if (Array.isArray(body.permissions)) {
        updateData.permissions = body.permissions
      }

      if (typeof body.position === 'number') {
        updateData.position = body.position
      }

      const updatedRole = await prisma.role.update({
        where: { id },
        data: updateData,
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'role.update',
        targetType: 'role',
        targetId: role.id,
        details: {
          previous: {
            displayName: role.displayName,
            description: role.description,
            permissions: role.permissions,
          },
          updated: updateData,
        },
      })

      return NextResponse.json(updatedRole)
    } catch (error) {
      console.error('Update role error:', error)
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      )
    }
  }
)

// DELETE - Delete role
export const DELETE = withPermission(
  PERMISSIONS.ROLES_DELETE,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      })

      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }

      // Can't delete system roles
      if (role.isSystem) {
        return NextResponse.json(
          { error: 'Cannot delete a system role' },
          { status: 400 }
        )
      }

      // Warn if role has assignments
      if (role._count.assignments > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete role with ${role._count.assignments} active assignment(s). Remove all assignments first.`,
          },
          { status: 400 }
        )
      }

      await prisma.role.delete({
        where: { id },
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'role.delete',
        targetType: 'role',
        targetId: id,
        details: {
          name: role.name,
          displayName: role.displayName,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete role error:', error)
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      )
    }
  }
)
