/**
 * Email Subscribers API
 *
 * List, create, and manage email subscribers
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subscribeEmail } from '@/lib/email/subscriptions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (tag) {
      where.tags = { has: tag }
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [subscribers, total] = await Promise.all([
      prisma.emailSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.emailSubscriber.count({ where }),
    ])

    // Get unique tags for filtering
    const allTags = await prisma.emailSubscriber.findMany({
      select: { tags: true },
      distinct: ['tags'],
    })
    const uniqueTags = [...new Set(allTags.flatMap((s) => s.tags))]

    return NextResponse.json({
      success: true,
      subscribers: subscribers.map((s) => ({
        id: s.id,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        name: s.name,
        status: s.status.toLowerCase(),
        tags: s.tags,
        source: s.source,
        totalOpens: s.totalOpens,
        totalClicks: s.totalClicks,
        engagementScore: s.engagementScore,
        lastEngagedAt: s.lastEngagedAt,
        confirmedAt: s.confirmedAt,
        unsubscribedAt: s.unsubscribedAt,
        createdAt: s.createdAt,
      })),
      tags: uniqueTags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching subscribers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, name, tags, source, doubleOptIn } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const result = await subscribeEmail(email, {
      firstName,
      lastName,
      name,
      tags,
      source: source || 'admin',
      doubleOptIn: doubleOptIn ?? false,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      subscriber: result.subscriber,
      needsConfirmation: result.needsConfirmation,
    })
  } catch (error) {
    console.error('Error creating subscriber:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create subscriber' },
      { status: 500 }
    )
  }
}
