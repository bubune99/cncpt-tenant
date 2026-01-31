/**
 * Single Email Subscriber API
 *
 * Get, update, delete individual subscribers
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { unsubscribeById, addSubscriberTags, removeSubscriberTags } from '@/lib/cms/email/subscriptions'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { id },
    })

    if (!subscriber) {
      return NextResponse.json(
        { success: false, error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Get recent email activity
    const recentActivity = await prisma.emailRecipient.findMany({
      where: { email: subscriber.email },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        campaign: {
          select: { id: true, name: true, subject: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        name: subscriber.name,
        status: subscriber.status.toLowerCase(),
        tags: subscriber.tags,
        source: subscriber.source,
        preferences: subscriber.preferences,
        totalOpens: subscriber.totalOpens,
        totalClicks: subscriber.totalClicks,
        engagementScore: subscriber.engagementScore,
        lastEngagedAt: subscriber.lastEngagedAt,
        consentTimestamp: subscriber.consentTimestamp,
        consentIp: subscriber.consentIp,
        consentSource: subscriber.consentSource,
        confirmedAt: subscriber.confirmedAt,
        unsubscribedAt: subscriber.unsubscribedAt,
        createdAt: subscriber.createdAt,
        updatedAt: subscriber.updatedAt,
      },
      recentActivity: recentActivity.map((r) => ({
        id: r.id,
        campaignId: r.campaign?.id,
        campaignName: r.campaign?.name,
        campaignSubject: r.campaign?.subject,
        status: r.status,
        sentAt: r.sentAt,
        openedAt: r.openedAt,
        clickedAt: r.clickedAt,
        bouncedAt: r.bouncedAt,
        openCount: r.openCount,
        clickCount: r.clickCount,
      })),
    })
  } catch (error) {
    console.error('Error fetching subscriber:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriber' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { id },
    })

    if (!subscriber) {
      return NextResponse.json(
        { success: false, error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Handle tag operations
    if (body.addTags && Array.isArray(body.addTags)) {
      await addSubscriberTags(id, body.addTags)
    }

    if (body.removeTags && Array.isArray(body.removeTags)) {
      await removeSubscriberTags(id, body.removeTags)
    }

    // Handle unsubscribe action
    if (body.action === 'unsubscribe') {
      const result = await unsubscribeById(id, { reason: body.reason })
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }
      return NextResponse.json({ success: true, action: 'unsubscribed' })
    }

    // Handle resubscribe action
    if (body.action === 'resubscribe') {
      if (['BOUNCED', 'COMPLAINED'].includes(subscriber.status)) {
        return NextResponse.json(
          { success: false, error: 'Cannot resubscribe bounced or complained addresses' },
          { status: 400 }
        )
      }
      await prisma.emailSubscriber.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          unsubscribedAt: null,
        },
      })
      return NextResponse.json({ success: true, action: 'resubscribed' })
    }

    // Regular field updates
    const updateData: Record<string, unknown> = {}

    if (body.firstName !== undefined) updateData.firstName = body.firstName
    if (body.lastName !== undefined) updateData.lastName = body.lastName
    if (body.name !== undefined) updateData.name = body.name
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.preferences !== undefined) {
      updateData.preferences = {
        ...(subscriber.preferences as Record<string, unknown> || {}),
        ...body.preferences,
      }
    }

    const updated = await prisma.emailSubscriber.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      subscriber: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        status: updated.status.toLowerCase(),
        tags: updated.tags,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating subscriber:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update subscriber' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { id },
    })

    if (!subscriber) {
      return NextResponse.json(
        { success: false, error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Delete associated recipient records
    await prisma.emailRecipient.deleteMany({
      where: { email: subscriber.email },
    })

    await prisma.emailSubscriber.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subscriber:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete subscriber' },
      { status: 500 }
    )
  }
}
