/**
 * Tenant Branding API
 *
 * GET  /api/cms/admin/branding?subdomain=xxx  — Get branding for a tenant
 * PUT  /api/cms/admin/branding                — Update branding for a tenant
 *
 * All writes require tenant ownership. Reads are public (used by storefront).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { stackServerApp } from '@/stack'
import { isSuperAdmin } from '@/lib/super-admin'
import { canAccessSubdomain } from '@/lib/team-auth'
import {
  getTenantBranding,
  updateTenantBranding,
} from '@/lib/cms/branding'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json(
        { error: 'subdomain parameter is required' },
        { status: 400 }
      )
    }

    const branding = await getTenantBranding(subdomain)
    return NextResponse.json({ branding })
  } catch (error) {
    console.error('Get branding error:', error)
    return NextResponse.json(
      { error: 'Failed to get branding' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { subdomain, branding } = body

    if (!subdomain) {
      return NextResponse.json(
        { error: 'subdomain is required' },
        { status: 400 }
      )
    }

    if (!branding || typeof branding !== 'object') {
      return NextResponse.json(
        { error: 'branding object is required' },
        { status: 400 }
      )
    }

    // Auth check: verify user owns or has admin access to this subdomain
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const superAdmin = await isSuperAdmin(user.id)
    if (!superAdmin) {
      const access = await canAccessSubdomain(user.id, subdomain, 'admin')
      if (!access.hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have admin access to this subdomain' },
          { status: 403 }
        )
      }
    }

    // Look up tenant
    const tenant = await prisma.subdomain.findUnique({
      where: { subdomain },
      select: { id: true },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const updated = await updateTenantBranding(tenant.id, branding)

    return NextResponse.json({ branding: updated })
  } catch (error) {
    console.error('Update branding error:', error)
    return NextResponse.json(
      { error: 'Failed to update branding' },
      { status: 500 }
    )
  }
}
