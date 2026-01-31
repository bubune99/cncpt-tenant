/**
 * SendGrid Webhook Handler
 *
 * Processes bounce, complaint, delivery, and engagement events from SendGrid
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  parseSendGridWebhook,
  processEmailWebhookEvent,
  verifySendGridWebhook,
} from '@/lib/cms/email/webhooks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    // Verify webhook signature if configured
    const signature = request.headers.get('X-Twilio-Email-Event-Webhook-Signature')
    const timestamp = request.headers.get('X-Twilio-Email-Event-Webhook-Timestamp')
    const verificationKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY

    if (verificationKey && signature && timestamp) {
      const isValid = verifySendGridWebhook(body, signature, timestamp, verificationKey)
      if (!isValid) {
        console.error('Invalid SendGrid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Parse and process events
    const events = parseSendGridWebhook(payload)

    for (const event of events) {
      try {
        await processEmailWebhookEvent(event)
      } catch (error) {
        console.error('Error processing SendGrid event:', error)
      }
    }

    return NextResponse.json({ received: true, processed: events.length })
  } catch (error) {
    console.error('SendGrid webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
