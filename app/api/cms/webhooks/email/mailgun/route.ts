/**
 * Mailgun Webhook Handler
 *
 * Processes bounce, complaint, delivery, and engagement events from Mailgun
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  parseMailgunWebhook,
  processEmailWebhookEvent,
  verifyMailgunWebhook,
} from '@/lib/cms/email/webhooks'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify webhook signature
    const apiKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY || process.env.MAILGUN_API_KEY
    if (apiKey) {
      const signature = body.signature as {
        timestamp: string
        token: string
        signature: string
      }

      if (signature) {
        const isValid = verifyMailgunWebhook(
          signature.timestamp,
          signature.token,
          signature.signature,
          apiKey
        )
        if (!isValid) {
          console.error('Invalid Mailgun webhook signature')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      }
    }

    // Parse and process event
    const event = parseMailgunWebhook(body)

    if (event) {
      try {
        await processEmailWebhookEvent(event)
      } catch (error) {
        console.error('Error processing Mailgun event:', error)
      }
    }

    return NextResponse.json({ received: true, processed: event ? 1 : 0 })
  } catch (error) {
    console.error('Mailgun webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
