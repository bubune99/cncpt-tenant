/**
 * Business Owners API (v2)
 *
 * GET /api/cms/admin/business-owners/v2 - List all business owners (tenants/subdomains)
 *
 * "Business owners" maps to Subdomains in the database.
 * Used by the customer creation dialog to assign customers to a business.
 *
 * SECURITY: Requires super admin auth (was previously using hardcoded dev key)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { stackServerApp } from '@/lib/cms/stack'
import { isSuperAdmin } from '@/lib/super-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Require super admin auth
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const isAdmin = await isSuperAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: super admin access required' }, { status: 403 })
    }

    const subdomains = await prisma.subdomain.findMany({
      select: {
        id: true,
        subdomain: true,
        tenantSettings: {
          select: {
            siteName: true,
            siteTitle: true,
          },
        },
      },
      orderBy: { subdomain: 'asc' },
    })

    const businessOwners = subdomains.map((sub) => ({
      id: String(sub.id),
      businessName:
        sub.tenantSettings?.siteName ||
        sub.tenantSettings?.siteTitle ||
        sub.subdomain,
      subdomain: sub.subdomain,
    }))

    return NextResponse.json({ businessOwners })
  } catch (error) {
    console.error('List business owners error:', error)
    return NextResponse.json(
      { error: 'Failed to list business owners' },
      { status: 500 }
    )
  }
}
