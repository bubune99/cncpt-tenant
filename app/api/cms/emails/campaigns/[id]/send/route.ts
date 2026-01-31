/**
 * Send Email Campaign API
 *
 * Sends a campaign to all recipients
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { sendEmail } from '@/lib/cms/email'
import { processEmailForTracking, getUnsubscribeHeaders } from '@/lib/cms/email/tracking'
import { parseMergeTags } from '@/lib/cms/email/merge-tags'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { testMode, testEmails } = body

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (!campaign.html) {
      return NextResponse.json(
        { success: false, error: 'Campaign has no HTML content' },
        { status: 400 }
      )
    }

    // Test mode - send to specific emails
    if (testMode && testEmails && testEmails.length > 0) {
      const testData = {
        subscriber: {
          email: testEmails[0],
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User',
        },
        campaign: {
          id: campaign.id,
          name: campaign.name,
          subject: campaign.subject,
        },
      }

      const results = []
      for (const email of testEmails) {
        const result = await sendEmail({
          to: { email },
          subject: `[TEST] ${parseMergeTags(campaign.subject, testData)}`,
          html: parseMergeTags(campaign.html, testData),
        })
        results.push({ email, success: result.success })
      }

      return NextResponse.json({
        success: true,
        testMode: true,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      })
    }

    // Check if already sent or sending
    if (campaign.status === 'SENT') {
      return NextResponse.json(
        { success: false, error: 'Campaign has already been sent' },
        { status: 400 }
      )
    }

    if (campaign.status === 'SENDING') {
      return NextResponse.json(
        { success: false, error: 'Campaign is currently being sent' },
        { status: 400 }
      )
    }

    // Get active subscribers
    const subscribers = await prisma.emailSubscriber.findMany({
      where: { status: 'ACTIVE' },
    })

    if (subscribers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active subscribers to send to' },
        { status: 400 }
      )
    }

    // Update campaign status to sending
    await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'SENDING' },
    })

    let totalSuccessful = 0
    let totalFailed = 0

    // Send emails to each subscriber
    for (const subscriber of subscribers) {
      try {
        // Create recipient record
        const recipient = await prisma.emailRecipient.create({
          data: {
            campaignId: campaign.id,
            email: subscriber.email,
            status: 'PENDING',
          },
        })

        // Prepare merge data
        const mergeData = {
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            firstName: subscriber.firstName || '',
            lastName: subscriber.lastName || '',
            name: subscriber.name || '',
          },
          campaign: {
            id: campaign.id,
            name: campaign.name,
            subject: campaign.subject,
          },
        }

        // Process subject with merge tags
        const processedSubject = parseMergeTags(campaign.subject, mergeData)

        // Process HTML with merge tags
        let processedHtml = parseMergeTags(campaign.html, mergeData)

        // Add tracking
        processedHtml = processEmailForTracking(processedHtml, recipient.id, {
          campaignId: campaign.id,
          trackOpens: true,
          trackClicks: true,
        })

        // Get unsubscribe headers
        const unsubscribeHeaders = getUnsubscribeHeaders(subscriber.id)

        // Send email
        const result = await sendEmail({
          to: {
            email: subscriber.email,
            name: subscriber.name || `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim() || undefined,
          },
          subject: processedSubject,
          html: processedHtml,
          headers: unsubscribeHeaders,
        })

        if (result.success) {
          totalSuccessful++
          await prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              providerMessageId: result.messageId,
            },
          })
        } else {
          totalFailed++
          await prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'FAILED',
              errorMessage: result.error,
            },
          })
        }
      } catch (error) {
        totalFailed++
        console.error(`Error sending to ${subscriber.email}:`, error)
      }
    }

    // Update campaign status and counts
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount: totalSuccessful,
        recipientCount: subscribers.length,
      },
    })

    return NextResponse.json({
      success: true,
      sent: totalSuccessful,
      failed: totalFailed,
      total: subscribers.length,
    })
  } catch (error) {
    console.error('Error sending campaign:', error)

    // Try to reset campaign status on error
    try {
      const { id } = await params
      await prisma.emailCampaign.update({
        where: { id },
        data: { status: 'DRAFT' },
      })
    } catch {
      // Ignore errors resetting status
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}
