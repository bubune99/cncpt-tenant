/**
 * Email Webhook Handlers
 *
 * Process bounce, complaint, and delivery events from email providers
 */

import { prisma } from '../db'
import type { EmailWebhookEvent, EmailProvider, EmailEventType } from './types'
import crypto from 'crypto'

/**
 * Process an email webhook event
 */
export async function processEmailWebhookEvent(event: EmailWebhookEvent): Promise<void> {
  const now = new Date()

  switch (event.type) {
    case 'bounced':
    case 'soft_bounced':
      await handleBounce(event)
      break

    case 'complained':
      await handleComplaint(event)
      break

    case 'delivered':
      await handleDelivery(event)
      break

    case 'unsubscribed':
      await handleUnsubscribe(event)
      break

    case 'opened':
    case 'clicked':
      // These are typically handled by our own tracking endpoints
      // But we can also process provider-side tracking here
      break

    case 'dropped':
    case 'deferred':
      await handleDropped(event)
      break
  }

  // Log the event for debugging/analytics
  console.log(`Email event: ${event.type} for ${event.email} via ${event.provider}`)
}

/**
 * Handle bounce events
 */
async function handleBounce(event: EmailWebhookEvent): Promise<void> {
  const isHardBounce = event.bounceType === 'hard'

  // Update subscriber status
  await prisma.emailSubscriber.updateMany({
    where: { email: event.email },
    data: {
      status: isHardBounce ? 'BOUNCED' : 'ACTIVE',
      unsubscribedAt: isHardBounce ? new Date() : undefined,
    },
  })

  // Update recipient if we have messageId
  if (event.recipientId) {
    await prisma.emailRecipient.update({
      where: { id: event.recipientId },
      data: {
        bouncedAt: new Date(),
        bounceType: event.bounceType,
        errorMessage: event.bounceReason,
      },
    })
  } else if (event.messageId) {
    // Try to find by provider message ID
    await prisma.emailRecipient.updateMany({
      where: {
        email: event.email,
        providerMessageId: event.messageId,
      },
      data: {
        bouncedAt: new Date(),
        bounceType: event.bounceType,
        errorMessage: event.bounceReason,
      },
    })
  }

  // Update campaign bounce count
  if (event.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: event.campaignId },
      data: {
        bounceCount: { increment: 1 },
      },
    })
  }
}

/**
 * Handle complaint events (spam reports)
 */
async function handleComplaint(event: EmailWebhookEvent): Promise<void> {
  // Mark subscriber as complained - this is serious
  await prisma.emailSubscriber.updateMany({
    where: { email: event.email },
    data: {
      status: 'COMPLAINED',
      unsubscribedAt: new Date(),
    },
  })

  // Update recipient - mark as bounced with complaint reason
  if (event.recipientId) {
    await prisma.emailRecipient.update({
      where: { id: event.recipientId },
      data: {
        bouncedAt: new Date(),
        errorMessage: `Spam complaint: ${event.complaintType || 'unknown'}`,
      },
    })
  }

  // Update campaign bounce count (complaints count as bounces)
  if (event.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: event.campaignId },
      data: {
        bounceCount: { increment: 1 },
      },
    })
  }
}

/**
 * Handle delivery confirmation events
 */
async function handleDelivery(event: EmailWebhookEvent): Promise<void> {
  if (event.recipientId) {
    await prisma.emailRecipient.update({
      where: { id: event.recipientId },
      data: {
        sentAt: new Date(),
        status: 'SENT',
      },
    })
  }

  if (event.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: event.campaignId },
      data: {
        sentCount: { increment: 1 },
      },
    })
  }
}

/**
 * Handle unsubscribe events from email client
 */
async function handleUnsubscribe(event: EmailWebhookEvent): Promise<void> {
  await prisma.emailSubscriber.updateMany({
    where: { email: event.email },
    data: {
      status: 'UNSUBSCRIBED',
      unsubscribedAt: new Date(),
    },
  })

  if (event.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: event.campaignId },
      data: {
        unsubscribeCount: { increment: 1 },
      },
    })
  }
}

/**
 * Handle dropped/deferred events
 */
async function handleDropped(event: EmailWebhookEvent): Promise<void> {
  if (event.recipientId) {
    await prisma.emailRecipient.update({
      where: { id: event.recipientId },
      data: {
        status: 'FAILED',
        errorMessage: event.bounceReason || `Email ${event.type}`,
      },
    })
  }
}

// ==========================================
// Provider-specific webhook parsers
// ==========================================

/**
 * Parse SendGrid webhook event
 */
export function parseSendGridWebhook(payload: unknown): EmailWebhookEvent[] {
  const events: EmailWebhookEvent[] = []

  if (!Array.isArray(payload)) {
    return events
  }

  for (const item of payload) {
    const eventType = mapSendGridEventType(item.event)
    if (!eventType) continue

    events.push({
      type: eventType,
      email: item.email,
      messageId: item.sg_message_id,
      timestamp: new Date(item.timestamp * 1000),
      provider: 'sendgrid',
      campaignId: item.campaign_id,
      recipientId: item.recipient_id,
      bounceType: item.bounce_classification === 'hard' ? 'hard' : 'soft',
      bounceReason: item.reason,
      linkUrl: item.url,
      userAgent: item.useragent,
      ipAddress: item.ip,
      raw: item,
    })
  }

  return events
}

function mapSendGridEventType(event: string): EmailEventType | null {
  const mapping: Record<string, EmailEventType> = {
    delivered: 'delivered',
    bounce: 'bounced',
    dropped: 'dropped',
    spamreport: 'complained',
    unsubscribe: 'unsubscribed',
    open: 'opened',
    click: 'clicked',
    deferred: 'deferred',
  }
  return mapping[event] || null
}

/**
 * Parse Mailgun webhook event
 */
export function parseMailgunWebhook(payload: unknown): EmailWebhookEvent | null {
  const data = payload as Record<string, unknown>
  const eventData = data['event-data'] as Record<string, unknown>

  if (!eventData) return null

  const eventType = mapMailgunEventType(eventData.event as string)
  if (!eventType) return null

  const recipient = eventData.recipient as string
  const message = eventData.message as Record<string, unknown>
  const headers = message?.headers as Record<string, unknown>

  return {
    type: eventType,
    email: recipient,
    messageId: headers?.['message-id'] as string,
    timestamp: new Date((eventData.timestamp as number) * 1000),
    provider: 'mailgun',
    campaignId: (eventData['user-variables'] as Record<string, string>)?.campaign_id,
    recipientId: (eventData['user-variables'] as Record<string, string>)?.recipient_id,
    bounceType: (eventData.severity as string) === 'permanent' ? 'hard' : 'soft',
    bounceReason: (eventData['delivery-status'] as Record<string, unknown>)?.message as string,
    linkUrl: eventData.url as string,
    userAgent: (eventData['client-info'] as Record<string, unknown>)?.['user-agent'] as string,
    ipAddress: eventData.ip as string,
    raw: payload,
  }
}

function mapMailgunEventType(event: string): EmailEventType | null {
  const mapping: Record<string, EmailEventType> = {
    delivered: 'delivered',
    failed: 'bounced',
    complained: 'complained',
    unsubscribed: 'unsubscribed',
    opened: 'opened',
    clicked: 'clicked',
  }
  return mapping[event] || null
}

/**
 * Parse Resend webhook event
 */
export function parseResendWebhook(payload: unknown): EmailWebhookEvent | null {
  const data = payload as Record<string, unknown>

  const eventType = mapResendEventType(data.type as string)
  if (!eventType) return null

  const emailData = data.data as Record<string, unknown>

  return {
    type: eventType,
    email: (emailData.to as string[])?.[0] || '',
    messageId: emailData.email_id as string,
    timestamp: new Date(data.created_at as string),
    provider: 'resend',
    campaignId: (emailData.tags as Array<{ name: string; value: string }>)?.find((t) => t.name === 'campaign_id')?.value,
    recipientId: (emailData.tags as Array<{ name: string; value: string }>)?.find((t) => t.name === 'recipient_id')?.value,
    bounceType: (emailData.bounce as Record<string, unknown>)?.type === 'permanent' ? 'hard' : 'soft',
    bounceReason: (emailData.bounce as Record<string, unknown>)?.message as string,
    raw: payload,
  }
}

function mapResendEventType(type: string): EmailEventType | null {
  const mapping: Record<string, EmailEventType> = {
    'email.delivered': 'delivered',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
  }
  return mapping[type] || null
}

/**
 * Parse AWS SES webhook (via SNS)
 */
export function parseSesWebhook(payload: unknown): EmailWebhookEvent | null {
  const data = payload as Record<string, unknown>

  // SNS wraps the message
  let message: Record<string, unknown>
  if (typeof data.Message === 'string') {
    try {
      message = JSON.parse(data.Message)
    } catch {
      return null
    }
  } else {
    message = data as Record<string, unknown>
  }

  const notificationType = message.notificationType as string
  const eventType = mapSesEventType(notificationType)
  if (!eventType) return null

  const mail = message.mail as Record<string, unknown>
  const bounce = message.bounce as Record<string, unknown>
  const complaint = message.complaint as Record<string, unknown>
  const delivery = message.delivery as Record<string, unknown>

  let email = ''
  let bounceType: 'hard' | 'soft' | undefined
  let bounceReason: string | undefined

  if (bounce) {
    const recipients = bounce.bouncedRecipients as Array<{ emailAddress: string }>
    email = recipients?.[0]?.emailAddress || ''
    bounceType = bounce.bounceType === 'Permanent' ? 'hard' : 'soft'
    bounceReason = bounce.bounceSubType as string
  } else if (complaint) {
    const recipients = complaint.complainedRecipients as Array<{ emailAddress: string }>
    email = recipients?.[0]?.emailAddress || ''
  } else if (delivery) {
    const recipients = delivery.recipients as string[]
    email = recipients?.[0] || ''
  }

  return {
    type: eventType,
    email,
    messageId: mail?.messageId as string,
    timestamp: new Date(mail?.timestamp as string || message.timestamp as string),
    provider: 'ses',
    campaignId: (mail?.tags as Record<string, string[]>)?.campaign_id?.[0],
    recipientId: (mail?.tags as Record<string, string[]>)?.recipient_id?.[0],
    bounceType,
    bounceReason,
    complaintType: (complaint?.complaintFeedbackType as string),
    raw: payload,
  }
}

function mapSesEventType(type: string): EmailEventType | null {
  const mapping: Record<string, EmailEventType> = {
    Delivery: 'delivered',
    Bounce: 'bounced',
    Complaint: 'complained',
    Open: 'opened',
    Click: 'clicked',
  }
  return mapping[type] || null
}

// ==========================================
// Webhook signature verification
// ==========================================

/**
 * Verify SendGrid webhook signature
 */
export function verifySendGridWebhook(
  payload: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  try {
    const timestampPayload = timestamp + payload
    const verify = crypto.createVerify('sha256')
    verify.update(timestampPayload)
    return verify.verify(publicKey, signature, 'base64')
  } catch {
    return false
  }
}

/**
 * Verify Mailgun webhook signature
 */
export function verifyMailgunWebhook(
  timestamp: string,
  token: string,
  signature: string,
  apiKey: string
): boolean {
  const hmac = crypto.createHmac('sha256', apiKey)
  hmac.update(timestamp + token)
  const expected = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

/**
 * Verify Resend webhook signature
 */
export function verifyResendWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
