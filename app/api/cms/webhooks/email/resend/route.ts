/**
 * Resend Webhook Handler
 *
 * Processes bounce, complaint, delivery, and engagement events from Resend
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  parseResendWebhook,
  processEmailWebhookEvent,
  verifyResendWebhook,
} from '@/lib/cms/email/webhooks'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    // Verify webhook signature if configured
    const signature = request.headers.get('svix-signature')
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

    if (webhookSecret && signature) {
      const isValid = verifyResendWebhook(body, signature, webhookSecret)
      if (!isValid) {
        console.error('Invalid Resend webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Parse and process event
    const event = parseResendWebhook(payload)

    if (event) {
      try {
        await processEmailWebhookEvent(event)
      } catch (error) {
        console.error('Error processing Resend event:', error)
      }
    }

    return NextResponse.json({ received: true, processed: event ? 1 : 0 })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
