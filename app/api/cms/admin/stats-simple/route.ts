/**
 * Admin Stats Simple API
 *
 * GET /api/admin/stats-simple - Get basic admin dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { withAuth } from '@/lib/cms/permissions/middleware'
import { siteStatsQueries } from '@/lib/cms/dashboard/site-stats'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request, _context) => {
  try {
    // This site's figures, whoever is looking (walk 2026-11-20: a super admin saw platform-wide counts,
    // and staff accounts were shown as customers). The site comes from the header the middleware sets.
    const subdomain = request.headers.get('x-subdomain')
    if (!subdomain) return NextResponse.json({ error: 'Open this from a site' }, { status: 400 })
    const tenant = await prisma.subdomain.findUnique({ where: { subdomain }, select: { id: true } })
    if (!tenant) return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    const q = siteStatsQueries(tenant.id)

    const [totalProducts, totalOrders, totalCustomers, totalBlogPosts] = await Promise.all([
      prisma.product.count(q.products),
      prisma.order.count(q.orders),
      prisma.customer.count(q.customers),
      prisma.blogPost.count(q.posts),
    ])

    // totalUsers is kept for older readers and now means the site's customers.
    return NextResponse.json({ stats: { totalProducts, totalOrders, totalCustomers, totalUsers: totalCustomers, totalBlogPosts } })
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    return NextResponse.json({ error: "Couldn't load this site's figures" }, { status: 500 })
  }
})
