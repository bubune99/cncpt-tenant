/**
 * Business Owners API (v2)
 *
 * GET /api/cms/admin/business-owners/v2 - List all business owners (tenants/subdomains)
 *
 * "Business owners" maps to Subdomains in the database.
 * Used by the customer creation dialog to assign customers to a business.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Simple API key check for dev access
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== 'temp-dev-key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
