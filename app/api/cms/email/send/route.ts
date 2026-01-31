/**
 * Email Send API Route
 *
 * POST /api/email/send - Send an email (immediate or queued)
 *
 * Supports:
 * - Single email sending
 * - Bulk email sending
 * - Queued (async) sending
 * - Template-based emails
 * - Priority levels
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  sendEmail,
  sendBulkEmail,
  queueEmail,
  queueEmails,
  EmailMessage,
  EmailAddress,
} from '@/lib/cms/email'
import { renderOrderConfirmationEmail } from '@/lib/cms/email/templates/order-confirmation'
import { renderShippingNotificationEmail } from '@/lib/cms/email/templates/shipping-notification'
import { renderDeliveryConfirmationEmail } from '@/lib/cms/email/templates/delivery-confirmation'
import { renderRefundNotificationEmail } from '@/lib/cms/email/templates/refund-notification'
import { renderWelcomeEmail } from '@/lib/cms/email/templates/welcome'
import { renderPasswordResetEmail, renderPasswordChangedEmail } from '@/lib/cms/email/templates/password-reset'
import { renderCartAbandonmentEmail } from '@/lib/cms/email/templates/cart-abandonment'
import { renderTemplate, StoreConfig } from '@/lib/cms/email/templates/renderer'
import { getEmailSettings } from '@/lib/cms/settings'

export const dynamic = 'force-dynamic'

// Template rendering functions by name
// Returns { html, text, subject } for templates that provide full rendering
const templateRenderers: Record<string, (data: Record<string, unknown>, store?: Partial<StoreConfig>) => { html: string; subject?: string } | string> = {
  'order-confirmation': (data, store) => renderOrderConfirmationEmail(data as any, store),
  'shipping-notification': (data, store) => renderShippingNotificationEmail(data as any, store),
  'delivery-confirmation': (data, store) => renderDeliveryConfirmationEmail(data as any, store),
  'refund-notification': (data, store) => renderRefundNotificationEmail(data as any, store),
  'welcome': (data, store) => ({ html: renderWelcomeEmail(data as any, store) }),
  'password-reset': (data, store) => ({ html: renderPasswordResetEmail(data as any, store) }),
  'password-changed': (data, store) => ({ html: renderPasswordChangedEmail(data as any, store) }),
  'cart-abandonment': (data, store) => ({ html: renderCartAbandonmentEmail(data as any, store) }),
}

interface SendEmailRequest {
  // Direct email content
  to: EmailAddress | EmailAddress[] | string | string[]
  subject?: string
  html?: string
  text?: string

  // Optional fields
  from?: EmailAddress | string
  replyTo?: EmailAddress | string
  cc?: EmailAddress | EmailAddress[] | string | string[]
  bcc?: EmailAddress | EmailAddress[] | string | string[]

  // Template-based sending
  template?: string
  templateData?: Record<string, unknown>

  // Tracking
  tags?: string[]
  metadata?: Record<string, string>
  campaignId?: string
  recipientId?: string
  trackOpens?: boolean
  trackClicks?: boolean

  // Queue options
  async?: boolean
  priority?: 'high' | 'normal' | 'low'
  scheduledFor?: string // ISO date string

  // Bulk sending
  bulk?: boolean
  recipients?: Array<{
    to: EmailAddress | string
    substitutions?: Record<string, string>
    metadata?: Record<string, string>
  }>
}

/**
 * Normalize email address input
 */
function normalizeEmail(input: EmailAddress | string): EmailAddress {
  if (typeof input === 'string') {
    // Check for "Name <email>" format
    const match = input.match(/^([^<]+)<([^>]+)>$/)
    if (match) {
      return { email: match[2].trim(), name: match[1].trim() }
    }
    return { email: input }
  }
  return input
}

/**
 * Normalize array of email addresses
 */
function normalizeEmails(input: EmailAddress | EmailAddress[] | string | string[]): EmailAddress[] {
  const arr = Array.isArray(input) ? input : [input]
  return arr.map(normalizeEmail)
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json()

    // Validate required fields
    if (!body.to && !body.recipients) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required (to or recipients)' },
        { status: 400 }
      )
    }

    // Get default settings
    const settings = await getEmailSettings()
    const storeConfig: Partial<StoreConfig> = {
      name: settings.fromName || 'Our Store',
      supportEmail: settings.fromEmail || 'support@example.com',
    }

    // Build the email message
    let message: Partial<EmailMessage> = {}

    // Handle template-based emails
    if (body.template) {
      const renderer = templateRenderers[body.template]
      if (!renderer) {
        return NextResponse.json(
          { success: false, error: `Unknown template: ${body.template}` },
          { status: 400 }
        )
      }

      const templateData = body.templateData || {}
      const result = renderer(templateData, storeConfig)

      // Handle both string and object returns
      if (typeof result === 'string') {
        message.html = result
      } else {
        message.html = result.html
        if (result.subject && !body.subject) {
          message.subject = result.subject
        }
      }

      // Extract subject from template data if not provided
      if (!body.subject && !message.subject && templateData.subject) {
        message.subject = String(templateData.subject)
      }
    }

    // Handle custom HTML/text
    if (body.html) {
      // Process merge tags if templateData provided
      if (body.templateData) {
        message.html = renderTemplate(body.html, body.templateData, { store: storeConfig })
      } else {
        message.html = body.html
      }
    }

    if (body.text) {
      if (body.templateData) {
        message.text = renderTemplate(body.text, body.templateData, { store: storeConfig })
      } else {
        message.text = body.text
      }
    }

    // Validate we have content
    if (!message.html && !message.text) {
      return NextResponse.json(
        { success: false, error: 'Email content is required (html, text, or template)' },
        { status: 400 }
      )
    }

    // Set subject
    message.subject = body.subject || message.subject || 'No Subject'

    // Set from/replyTo
    if (body.from) {
      message.from = normalizeEmail(body.from)
    }
    if (body.replyTo) {
      message.replyTo = normalizeEmail(body.replyTo)
    }

    // Set tracking options
    message.tags = body.tags
    message.metadata = body.metadata
    message.campaignId = body.campaignId
    message.recipientId = body.recipientId
    message.trackOpens = body.trackOpens
    message.trackClicks = body.trackClicks

    // Handle CC/BCC
    if (body.cc) {
      message.cc = normalizeEmails(body.cc)
    }
    if (body.bcc) {
      message.bcc = normalizeEmails(body.bcc)
    }

    // Handle bulk sending
    if (body.bulk && body.recipients && body.recipients.length > 0) {
      const bulkMessage = {
        ...message,
        recipients: body.recipients.map(r => ({
          to: normalizeEmail(r.to),
          substitutions: r.substitutions,
          metadata: r.metadata,
        })),
      }

      // Queue if async
      if (body.async) {
        const messages = body.recipients.map(r => ({
          ...message,
          to: normalizeEmail(r.to),
          subject: message.subject!,
        }))

        const ids = await queueEmails(messages as EmailMessage[], {
          priority: body.priority || 'normal',
          scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
        })

        return NextResponse.json({
          success: true,
          queued: true,
          queueIds: ids,
          count: ids.length,
        })
      }

      // Send bulk immediately
      const result = await sendBulkEmail(bulkMessage as any)
      return NextResponse.json({
        success: result.success,
        provider: result.provider,
        totalSent: result.totalSent,
        totalFailed: result.totalFailed,
        results: result.results,
      })
    }

    // Single email sending
    const to = normalizeEmails(body.to!)
    message.to = to.length === 1 ? to[0] : to

    // Queue if async
    if (body.async) {
      const queueId = await queueEmail(message as EmailMessage, {
        priority: body.priority || 'normal',
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      })

      return NextResponse.json({
        success: true,
        queued: true,
        queueId,
      })
    }

    // Send immediately
    const result = await sendEmail(message as EmailMessage)

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
          provider: result.provider,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/email/send - Get queue status (for async sends)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queueId = searchParams.get('queueId')

    if (queueId) {
      // Get specific email status
      const { checkEmailStatus } = await import('@/lib/cms/email')
      const status = checkEmailStatus(queueId)

      if (!status) {
        return NextResponse.json(
          { success: false, error: 'Email not found in queue' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        email: {
          id: status.id,
          status: status.status,
          attempts: status.attempts,
          maxAttempts: status.maxAttempts,
          lastError: status.lastError,
          sentAt: status.sentAt,
          createdAt: status.createdAt,
        },
      })
    }

    // Get queue stats
    const { getQueueStats } = await import('@/lib/cms/email')
    const stats = getQueueStats()

    return NextResponse.json({
      success: true,
      queue: stats,
    })
  } catch (error) {
    console.error('Email status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get email status' },
      { status: 500 }
    )
  }
}
