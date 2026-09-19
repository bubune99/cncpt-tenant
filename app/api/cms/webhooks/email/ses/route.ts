/**
 * AWS SES Webhook Handler (via SNS)
 *
 * Processes bounce, complaint, and delivery notifications from AWS SES
 *
 * Note: SES sends notifications to SNS, which then sends to this endpoint.
 * You need to:
 * 1. Create an SNS topic
 * 2. Subscribe this endpoint to the SNS topic
 * 3. Configure SES to send notifications to the SNS topic
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import {
  parseSesWebhook,
  processEmailWebhookEvent,
} from '@/lib/cms/email/webhooks'

export const dynamic = 'force-dynamic'

/**
 * Shared-secret gate. SNS cannot sign with a customer secret, so the
 * subscription endpoint must be registered as
 *   https://<tenant>/api/cms/webhooks/email/ses?token=<SES_WEBHOOK_TOKEN>
 * Fails closed when SES_WEBHOOK_TOKEN is unset.
 */
function isAuthorizedSes(request: NextRequest): boolean {
  const expected = process.env.SES_WEBHOOK_TOKEN
  if (!expected) return false
  const presented =
    request.headers.get('x-webhook-token') ?? request.nextUrl.searchParams.get('token') ?? ''
  const a = Buffer.from(presented)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function isSnsUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && /^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(u.hostname)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedSes(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    // Handle SNS subscription confirmation
    if (payload.Type === 'SubscriptionConfirmation') {
      const subscribeUrl = payload.SubscribeURL
      // Only follow confirmation URLs that point at SNS itself (SSRF guard).
      if (subscribeUrl && isSnsUrl(subscribeUrl)) {
        // Automatically confirm the subscription
        try {
          await fetch(subscribeUrl)
          console.log('SNS subscription confirmed')
          return NextResponse.json({ confirmed: true })
        } catch (error) {
          console.error('Failed to confirm SNS subscription:', error)
          return NextResponse.json({ error: 'Failed to confirm subscription' }, { status: 500 })
        }
      }
    }

    // Handle unsubscribe confirmation
    if (payload.Type === 'UnsubscribeConfirmation') {
      console.log('SNS unsubscribe confirmation received')
      return NextResponse.json({ received: true })
    }

    // Handle notification
    if (payload.Type === 'Notification') {
      const event = parseSesWebhook(payload)

      if (event) {
        try {
          await processEmailWebhookEvent(event)
        } catch (error) {
          console.error('Error processing SES event:', error)
        }
      }

      return NextResponse.json({ received: true, processed: event ? 1 : 0 })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('SES webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
