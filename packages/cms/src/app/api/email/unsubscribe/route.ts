/**
 * Unsubscribe Endpoint
 *
 * Handles email unsubscribe requests (GET for one-click, POST for form)
 */

import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeById, unsubscribeEmail } from '@/lib/email/subscriptions'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// One-click unsubscribe (List-Unsubscribe-Post header support)
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let subscriberId: string | null = null
    let email: string | null = null
    let reason: string | null = null
    let campaignId: string | null = null

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // One-click unsubscribe format
      const formData = await request.formData()
      subscriberId = formData.get('s') as string
      email = formData.get('email') as string
      reason = formData.get('reason') as string
      campaignId = formData.get('c') as string
    } else if (contentType.includes('application/json')) {
      const body = await request.json()
      subscriberId = body.subscriberId || body.s
      email = body.email
      reason = body.reason
      campaignId = body.campaignId || body.c
    } else {
      // Try URL params for List-Unsubscribe-Post
      const searchParams = request.nextUrl.searchParams
      subscriberId = searchParams.get('s')
      email = searchParams.get('email')
      campaignId = searchParams.get('c')
    }

    if (!subscriberId && !email) {
      return NextResponse.json({ success: false, error: 'Missing subscriber identifier' }, { status: 400 })
    }

    let result
    if (subscriberId) {
      result = await unsubscribeById(subscriberId, {
        reason: reason || undefined,
        campaignId: campaignId || undefined,
      })
    } else if (email) {
      result = await unsubscribeEmail(email, {
        reason: reason || undefined,
        campaignId: campaignId || undefined,
      })
    } else {
      return NextResponse.json({ success: false, error: 'Missing subscriber identifier' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ success: false, error: 'Failed to unsubscribe' }, { status: 500 })
  }
}

// One-click unsubscribe via GET (for email client links)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subscriberId = searchParams.get('s')
  const email = searchParams.get('email')
  const campaignId = searchParams.get('c')

  if (!subscriberId && !email) {
    // Redirect to preference center if no identifier
    return NextResponse.redirect(`${APP_URL}/email/unsubscribed?error=missing_identifier`)
  }

  let result
  if (subscriberId) {
    result = await unsubscribeById(subscriberId, {
      campaignId: campaignId || undefined,
    })
  } else if (email) {
    result = await unsubscribeEmail(email, {
      campaignId: campaignId || undefined,
    })
  } else {
    return NextResponse.redirect(`${APP_URL}/email/unsubscribed?error=missing_identifier`)
  }

  if (!result.success) {
    return NextResponse.redirect(`${APP_URL}/email/unsubscribed?error=${encodeURIComponent(result.error || 'unknown')}`)
  }

  return NextResponse.redirect(`${APP_URL}/email/unsubscribed?success=true`)
}
