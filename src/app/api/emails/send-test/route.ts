/**
 * Send Test Email API
 *
 * Send a test email for a campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { sendEmail } from '../../../../lib/email'
import { parseMergeTags } from '../../../../lib/email/merge-tags'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, email, content, subject } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      )
    }

    let html = ''
    let emailSubject = subject || 'Test Email'

    // If campaignId provided, fetch campaign
    if (campaignId) {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
      })

      if (campaign) {
        html = campaign.html || ''
        emailSubject = subject || campaign.subject
      }
    }

    // If content provided directly (JSON from Puck editor), render it
    if (content && typeof content === 'string') {
      html = content
    } else if (content && typeof content === 'object') {
      // Content is Puck JSON - for now just use the HTML from campaign
      // In future, we could render Puck content here
    }

    if (!html) {
      return NextResponse.json(
        { success: false, error: 'No email content to send' },
        { status: 400 }
      )
    }

    // Test merge data
    const testData = {
      subscriber: {
        email,
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
      },
      campaign: {
        id: campaignId || 'test',
        name: 'Test Campaign',
        subject: emailSubject,
      },
    }

    // Process with merge tags
    const processedSubject = parseMergeTags(`[TEST] ${emailSubject}`, testData)
    const processedHtml = parseMergeTags(html, testData)

    // Send test email
    const result = await sendEmail({
      to: { email },
      subject: processedSubject,
      html: processedHtml,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
