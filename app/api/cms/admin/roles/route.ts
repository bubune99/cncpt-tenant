/**
 * Roles API
 *
 * GET /api/admin/roles - List all roles
 * POST /api/admin/roles - Create a new role
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent, seedBuiltInRoles } from '@/lib/cms/permissions'

// GET - List all roles
export const GET = withPermission(
  PERMISSIONS.ROLES_VIEW,
  async (_request: NextRequest, context: AuthContext) => {
    try {
      const roles = await prisma.role.findMany({
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      })

      return NextResponse.json({
        roles: roles.map((role: { id: string; name: string; displayName: string; description: string | null; permissions: unknown; isSystem: boolean; position: number; createdAt: Date; updatedAt: Date; _count: { assignments: number } }) => ({
          id: role.id,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          permissions: role.permissions,
          isSystem: role.isSystem,
          position: role.position,
          assignmentCount: role._count.assignments,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })),
        total: roles.length,
      })
    } catch (error) {
      console.error('List roles error:', error)
      return NextResponse.json(
        { error: 'Failed to list roles' },
        { status: 500 }
      )
    }
  }
)

// POST - Create a new role
export const POST = withPermission(
  PERMISSIONS.ROLES_CREATE,
  async (request: NextRequest, context: AuthContext) => {
    try {
      const body = await request.json()

      // Validate required fields
      if (!body.name?.trim()) {
        return NextResponse.json(
          { error: 'Role name is required' },
          { status: 400 }
        )
      }

      if (!body.displayName?.trim()) {
        return NextResponse.json(
          { error: 'Display name is required' },
          { status: 400 }
        )
      }

      // Check for duplicate name
      const existing = await prisma.role.findUnique({
        where: { name: body.name.trim().toLowerCase().replace(/\s+/g, '_') },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A role with this name already exists' },
          { status: 409 }
        )
      }

      // Validate permissions array
      const permissions = Array.isArray(body.permissions) ? body.permissions : []

      // Get max position for ordering
      const maxPosition = await prisma.role.aggregate({
        _max: { position: true },
      })

      const role = await prisma.role.create({
        data: {
          name: body.name.trim().toLowerCase().replace(/\s+/g, '_'),
          displayName: body.displayName.trim(),
          description: body.description?.trim() || null,
          permissions: permissions,
          position: body.position ?? (maxPosition._max.position ?? -1) + 1,
          isSystem: false,
        },
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'role.create',
        targetType: 'role',
        targetId: role.id,
        details: {
          name: role.name,
          displayName: role.displayName,
          permissions: role.permissions,
        },
      })

      return NextResponse.json(role, { status: 201 })
    } catch (error) {
      console.error('Create role error:', error)
      return NextResponse.json(
        { error: 'Failed to create role' },
        { status: 500 }
      )
    }
  }
)

// Special endpoint to seed built-in roles (call once on setup)
export async function seedRoles(): Promise<void> {
  await seedBuiltInRoles()
}
