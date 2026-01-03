/**
 * Admin Users API
 *
 * GET /api/admin/users - List all users with roles
 *
 * Uses isAdminUser() check for authorization to be consistent with
 * frontend admin access control.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stackServerApp } from '@/lib/stack'
import { isAdminUser } from '@/lib/admin-config'

// GET - List all users with their roles
export async function GET(request: NextRequest) {
  try {
    // Check authentication via Stack Auth
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin access using isAdminUser (consistent with frontend)
    if (!isAdminUser(user.primaryEmail)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const hasRoles = searchParams.get('hasRoles')

    const users = await prisma.user.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { email: { contains: search, mode: 'insensitive' } },
                  { name: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          hasRoles === 'true'
            ? { roleAssignments: { some: {} } }
            : hasRoles === 'false'
              ? { roleAssignments: { none: {} } }
              : {},
        ],
      },
      include: {
        roleAssignments: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                permissions: true,
              },
            },
          },
          orderBy: {
            role: {
              position: 'asc',
            },
          },
        },
        permissions: {
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedUsers = users.map((user) => {
      const roles = user.roleAssignments.map((ra) => ({
        id: ra.role.id,
        name: ra.role.name,
        displayName: ra.role.displayName,
      }))

      // Check if user is super admin
      const isSuperAdmin = user.roleAssignments.some((ra) =>
        (ra.role.permissions as string[]).includes('*')
      )

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar,
        roles,
        permissionCount: user.permissions.length,
        isSuperAdmin,
        createdAt: user.createdAt.toISOString(),
        lastLogin: null, // Would need to track this separately
      }
    })

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
    })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    )
  }
}
