/**
 * Click Tracking Redirect Endpoint
 *
 * Records the click and redirects to the original URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordEmailClick } from '@/lib/cms/email/tracking'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const recipientId = searchParams.get('r')
  const originalUrl = searchParams.get('u')
  const linkId = searchParams.get('l')
  const campaignId = searchParams.get('c')

  // Validate required parameters
  if (!originalUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  // Validate URL to prevent open redirects
  let targetUrl: URL
  try {
    targetUrl = new URL(originalUrl)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  // Security: Only allow http/https protocols
  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return new NextResponse('Invalid URL protocol', { status: 400 })
  }

  // Get tracking metadata
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Record click event asynchronously
  if (recipientId) {
    recordEmailClick(recipientId, originalUrl, {
      campaignId: campaignId || undefined,
      linkId: linkId || undefined,
      ipAddress,
      userAgent,
    }).catch((error) => {
      console.error('Failed to record email click:', error)
    })
  }

  // Redirect to original URL
  return NextResponse.redirect(targetUrl.toString(), {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
