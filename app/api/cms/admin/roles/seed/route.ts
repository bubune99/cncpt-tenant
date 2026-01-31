/**
 * Seed Built-in Roles API
 *
 * POST /api/admin/roles/seed - Seed built-in roles
 * This should be called once during initial setup
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSuperAdmin, type AuthContext } from '@/lib/cms/permissions/middleware'
import { seedBuiltInRoles, BUILT_IN_ROLES } from '@/lib/cms/permissions'

export const POST = withSuperAdmin(
  async (_request: NextRequest, _context: AuthContext) => {
    try {
      await seedBuiltInRoles()

      return NextResponse.json({
        success: true,
        message: 'Built-in roles seeded successfully',
        roles: Object.keys(BUILT_IN_ROLES),
      })
    } catch (error) {
      console.error('Seed roles error:', error)
      return NextResponse.json(
        { error: 'Failed to seed built-in roles' },
        { status: 500 }
      )
    }
  }
)
