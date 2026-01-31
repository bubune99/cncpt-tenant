/**
 * Email Marketing Stats API
 *
 * Dashboard statistics for email marketing
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get overall stats
    const [
      totalCampaigns,
      activeCampaigns,
      totalSubscribers,
      activeSubscribers,
      totalTemplates,
    ] = await Promise.all([
      prisma.emailCampaign.count(),
      prisma.emailCampaign.count({
        where: { status: { in: ['SENDING', 'SCHEDULED'] } },
      }),
      prisma.emailSubscriber.count(),
      prisma.emailSubscriber.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.emailTemplate.count(),
    ])

    // Get aggregate email stats
    const campaignStats = await prisma.emailCampaign.aggregate({
      _sum: {
        sentCount: true,
        openCount: true,
        clickCount: true,
        bounceCount: true,
        unsubscribeCount: true,
      },
    })

    const totalSent = campaignStats._sum.sentCount || 0
    const totalOpens = campaignStats._sum.openCount || 0
    const totalClicks = campaignStats._sum.clickCount || 0
    const totalBounces = campaignStats._sum.bounceCount || 0
    const totalUnsubscribes = campaignStats._sum.unsubscribeCount || 0

    // Calculate rates
    const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0
    const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0
    const bounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0
    const unsubscribeRate = totalSent > 0 ? (totalUnsubscribes / totalSent) * 100 : 0

    // Get subscriber growth (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const newSubscribers = await prisma.emailSubscriber.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    const unsubscribedLast30Days = await prisma.emailSubscriber.count({
      where: {
        unsubscribedAt: { gte: thirtyDaysAgo },
      },
    })

    // Get recent campaigns
    const recentCampaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        sentCount: true,
        openCount: true,
        clickCount: true,
        sentAt: true,
        createdAt: true,
      },
    })

    // Get subscriber status breakdown
    const subscribersByStatus = await prisma.emailSubscriber.groupBy({
      by: ['status'],
      _count: true,
    })

    const statusBreakdown = subscribersByStatus.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase()] = item._count
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      stats: {
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
        },
        subscribers: {
          total: totalSubscribers,
          active: activeSubscribers,
          newLast30Days: newSubscribers,
          unsubscribedLast30Days,
          byStatus: statusBreakdown,
        },
        templates: {
          total: totalTemplates,
        },
        emails: {
          totalSent,
          totalOpens,
          totalClicks,
          totalBounces,
          totalUnsubscribes,
        },
        rates: {
          open: Math.round(openRate * 100) / 100,
          click: Math.round(clickRate * 100) / 100,
          bounce: Math.round(bounceRate * 100) / 100,
          unsubscribe: Math.round(unsubscribeRate * 100) / 100,
        },
        recentCampaigns: recentCampaigns.map((c) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          status: c.status.toLowerCase(),
          sentCount: c.sentCount,
          openCount: c.openCount,
          clickCount: c.clickCount,
          openRate: c.sentCount > 0 ? Math.round((c.openCount / c.sentCount) * 10000) / 100 : 0,
          sentAt: c.sentAt,
          createdAt: c.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching email stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
