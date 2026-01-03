/**
 * Email Subscribe API
 *
 * Handle new email subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { subscribeEmail } from '@/lib/email/subscriptions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, name, source, tags, doubleOptIn } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    // Get IP address for consent tracking
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined

    const result = await subscribeEmail(email, {
      firstName,
      lastName,
      name,
      source: source || 'api',
      tags,
      doubleOptIn: doubleOptIn ?? false,
      consentIp: ipAddress,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    if (result.needsConfirmation) {
      return NextResponse.json({
        success: true,
        message: 'Please check your email to confirm your subscription',
        needsConfirmation: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed',
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ success: false, error: 'Failed to subscribe' }, { status: 500 })
  }
}
