/**
 * Admin Users API
 *
 * GET /api/admin/users - List users scoped to the current tenant
 *
 * Uses isAdminUser() check for authorization to be consistent with
 * frontend admin access control. Non-super-admin users only see
 * users who belong to the same subdomain (owner + team members).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { stackServerApp } from '@/lib/cms/stack'
import { isAdminUser } from '@/lib/cms/admin-config'
import { isSuperAdmin } from '@/lib/super-admin'
import { sql } from '@/lib/neon'

export const dynamic = 'force-dynamic'

/**
 * Get all Stack Auth user IDs associated with a subdomain
 * (the owner + all team members with access to this subdomain).
 */
async function getSubdomainUserIds(subdomain: string): Promise<string[]> {
  try {
    // Get the subdomain owner
    const ownerResult = await sql`
      SELECT user_id FROM subdomains WHERE subdomain = ${subdomain}
    `

    const userIds = new Set<string>()

    if (ownerResult.length > 0 && ownerResult[0].user_id) {
      userIds.add(ownerResult[0].user_id as string)
    }

    // Get team members who have access to this subdomain
    const teamResult = await sql`
      SELECT DISTINCT tm.user_id
      FROM team_subdomains ts
      JOIN team_members tm ON ts.team_id = tm.team_id
      WHERE ts.subdomain = ${subdomain}
    `

    for (const row of teamResult) {
      if (row.user_id) {
        userIds.add(row.user_id as string)
      }
    }

    return Array.from(userIds)
  } catch (error) {
    console.error('[admin-users] Error getting subdomain user IDs:', error)
    return []
  }
}

// GET - List users with their roles, scoped to the current tenant
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

    // Determine tenant scoping: super admins see all, others see only their subdomain's users
    const superAdmin = await isSuperAdmin(user.id)
    const subdomain = request.headers.get('x-subdomain')

    let stackAuthIdFilter: { stackAuthId: { in: string[] } } | Record<string, never> = {}

    if (!superAdmin && subdomain) {
      // Scope to users who belong to this subdomain (owner + team members)
      const allowedStackAuthIds = await getSubdomainUserIds(subdomain)

      if (allowedStackAuthIds.length === 0) {
        // No users found for this subdomain — return empty
        return NextResponse.json({ users: [], total: 0 })
      }

      stackAuthIdFilter = { stackAuthId: { in: allowedStackAuthIds } }
    } else if (!superAdmin && !subdomain) {
      // Non-super-admin without subdomain context — return empty for safety
      return NextResponse.json({ users: [], total: 0 })
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          stackAuthIdFilter,
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
      const userIsSuperAdmin = user.roleAssignments.some((ra) =>
        (ra.role.permissions as string[]).includes('*')
      )

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar,
        roles,
        permissionCount: user.permissions.length,
        isSuperAdmin: userIsSuperAdmin,
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
