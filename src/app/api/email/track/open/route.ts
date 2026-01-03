/**
 * Open Tracking Pixel Endpoint
 *
 * Returns a 1x1 transparent GIF and records the email open
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordEmailOpen } from '@/lib/email/tracking'

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const recipientId = searchParams.get('r')
  const campaignId = searchParams.get('c')

  // Get tracking metadata
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Record open event asynchronously (don't block response)
  if (recipientId) {
    // Fire and forget - don't await
    recordEmailOpen(recipientId, {
      campaignId: campaignId || undefined,
      ipAddress,
      userAgent,
    }).catch((error) => {
      console.error('Failed to record email open:', error)
    })
  }

  // Return tracking pixel with cache headers to prevent caching
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}
