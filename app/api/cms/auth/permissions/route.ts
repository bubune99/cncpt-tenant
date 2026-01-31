/**
 * Current User Permissions API
 *
 * GET /api/auth/permissions - Get current user's permissions
 * Used by client-side for permission-based UI rendering
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/cms/permissions/middleware'

export const dynamic = 'force-dynamic'

// GET - Get current user's permissions
export const GET = withAuth(
  async (_request: NextRequest, context: AuthContext) => {
    return NextResponse.json({
      userId: context.user.id,
      email: context.user.email,
      name: context.user.name,
      roles: context.permissions.roles.map((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.displayName,
      })),
      permissions: Array.from(context.permissions.permissions),
      isSuperAdmin: context.permissions.permissions.has('*'),
    })
  }
)
