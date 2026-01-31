/**
 * Subscription Confirmation Endpoint
 *
 * Handles double opt-in email confirmation
 */

import { NextRequest, NextResponse } from 'next/server'
import { confirmSubscription } from '@/lib/cms/email/subscriptions'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/email/confirmed?error=missing_token`)
  }

  const result = await confirmSubscription(token)

  if (!result.success) {
    return NextResponse.redirect(`${APP_URL}/email/confirmed?error=${encodeURIComponent(result.error || 'unknown')}`)
  }

  return NextResponse.redirect(`${APP_URL}/email/confirmed?success=true`)
}
