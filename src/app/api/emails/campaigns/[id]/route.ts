/**
 * Single Email Campaign API
 *
 * Get, update, delete individual campaigns
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        template: true,
        _count: {
          select: { recipients: true, links: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        preheader: campaign.preheader,
        html: campaign.html,
        content: campaign.content,
        status: campaign.status.toLowerCase(),
        type: campaign.type.toLowerCase(),
        sentCount: campaign.sentCount,
        openCount: campaign.openCount,
        clickCount: campaign.clickCount,
        bounceCount: campaign.bounceCount,
        unsubscribeCount: campaign.unsubscribeCount,
        recipientCount: campaign._count.recipients,
        linkCount: campaign._count.links,
        openRate: campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0,
        clickRate: campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0,
        bounceRate: campaign.sentCount > 0 ? (campaign.bounceCount / campaign.sentCount) * 100 : 0,
        template: campaign.template
          ? {
              id: campaign.template.id,
              name: campaign.template.name,
            }
          : null,
        scheduledAt: campaign.scheduledAt,
        sentAt: campaign.sentAt,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign' },
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

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Don't allow editing sent campaigns
    if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit a campaign that has been sent or is sending' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.preheader !== undefined) updateData.preheader = body.preheader
    if (body.html !== undefined) updateData.html = body.html
    if (body.content !== undefined) updateData.content = JSON.parse(JSON.stringify(body.content))
    if (body.type !== undefined) updateData.type = body.type.toUpperCase()
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
      if (body.scheduledAt) {
        updateData.status = 'SCHEDULED'
      }
    }
    if (body.status !== undefined) updateData.status = body.status.toUpperCase()

    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      campaign: {
        id: updated.id,
        name: updated.name,
        subject: updated.subject,
        status: updated.status.toLowerCase(),
        type: updated.type.toLowerCase(),
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
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

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting campaigns that are sending
    if (campaign.status === 'SENDING') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a campaign that is currently sending' },
        { status: 400 }
      )
    }

    // Delete related records first
    await prisma.emailLinkClick.deleteMany({
      where: {
        link: {
          campaignId: id,
        },
      },
    })

    await prisma.emailLink.deleteMany({
      where: { campaignId: id },
    })

    await prisma.emailRecipient.deleteMany({
      where: { campaignId: id },
    })

    await prisma.emailCampaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
