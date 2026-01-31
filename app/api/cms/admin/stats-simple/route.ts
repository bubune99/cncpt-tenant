/**
 * Admin Stats Simple API
 *
 * GET /api/admin/stats-simple - Get basic admin dashboard statistics
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get counts in parallel
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalBlogPosts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.blogPost.count(),
    ])

    const stats = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalBlogPosts,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    // Return default stats on error to prevent UI crash
    return NextResponse.json({
      stats: {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalBlogPosts: 0,
      },
    })
  }
}
