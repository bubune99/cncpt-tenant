/**
 * Email Campaigns API
 *
 * GET /api/emails/campaigns - List email campaigns with stats
 * POST /api/emails/campaigns - Create new email campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    if (type && type !== 'all') {
      where.type = type.toUpperCase()
    }

    // Fetch campaigns
    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              recipients: true,
            },
          },
        },
      }),
      prisma.emailCampaign.count({ where }),
    ])

    // Calculate stats
    const allCampaigns = await prisma.emailCampaign.findMany({
      select: {
        status: true,
        sentCount: true,
        openCount: true,
        clickCount: true,
      },
    })

    const totalSent = allCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)
    const totalOpened = allCampaigns.reduce((sum, c) => sum + (c.openCount || 0), 0)
    const totalClicked = allCampaigns.reduce((sum, c) => sum + (c.clickCount || 0), 0)
    const subscriberCount = await prisma.emailSubscriber.count({
      where: { status: 'ACTIVE' },
    }).catch(() => 0)

    // Transform campaigns to expected format
    const formattedCampaigns = campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status.toLowerCase(),
      type: campaign.type.toLowerCase(),
      recipients: campaign._count.recipients,
      sent: campaign.sentCount || 0,
      opened: campaign.openCount || 0,
      clicked: campaign.clickCount || 0,
      scheduledAt: campaign.scheduledAt?.toISOString(),
      sentAt: campaign.sentAt?.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      campaigns: formattedCampaigns,
      total,
      stats: {
        totalCampaigns: total,
        totalSent,
        avgOpenRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0,
        avgClickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 1000) / 10 : 0,
        subscribers: subscriberCount,
      },
    })
  } catch (error) {
    console.error('Failed to fetch email campaigns:', error)
    // Return empty data on error to prevent UI crash
    return NextResponse.json({
      campaigns: [],
      total: 0,
      stats: {
        totalCampaigns: 0,
        totalSent: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        subscribers: 0,
      },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Map frontend type values to Prisma enum values
    const typeMap: Record<string, string> = {
      campaign: 'REGULAR',
      automated: 'AUTOMATED',
      transactional: 'TRANSACTIONAL',
    }
    const campaignType = typeMap[body.type?.toLowerCase()] || 'REGULAR'

    const campaign = await prisma.emailCampaign.create({
      data: {
        name: body.name,
        subject: body.subject,
        preheader: body.previewText,
        fromName: body.fromName,
        fromEmail: body.fromEmail,
        replyTo: body.replyTo,
        type: campaignType as 'REGULAR' | 'AUTOMATED' | 'TRANSACTIONAL',
        status: 'DRAFT',
        content: body.content || {},
        templateId: body.template || null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        // Note: trackOpens and trackClicks are handled at the email service level
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Failed to create email campaign:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
