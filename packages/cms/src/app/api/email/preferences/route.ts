/**
 * Email Preferences API
 *
 * Get and update subscriber preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSubscriberPreferences, updateSubscriberPreferences } from '@/lib/email/subscriptions'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subscriberId = searchParams.get('s')
  const email = searchParams.get('email')

  if (!subscriberId && !email) {
    return NextResponse.json({ success: false, error: 'Missing subscriber identifier' }, { status: 400 })
  }

  const result = await getSubscriberPreferences(subscriberId || email || '')

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    subscriber: result.subscriber,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriberId, email, preferences } = body

    if (!subscriberId && !email) {
      return NextResponse.json({ success: false, error: 'Missing subscriber identifier' }, { status: 400 })
    }

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid preferences' }, { status: 400 })
    }

    const result = await updateSubscriberPreferences(subscriberId || email, preferences)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    })
  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update preferences' }, { status: 500 })
  }
}
