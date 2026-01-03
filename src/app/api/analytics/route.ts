/**
 * Analytics API
 *
 * GET /api/analytics - Get analytics summary
 * POST /api/analytics - Track server-side event
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsSummary, trackServerEvent } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()

    switch (range) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    const summary = await getAnalyticsSummary(startDate, endDate)

    return NextResponse.json({
      range,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...summary,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get analytics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { eventName, eventData, sessionId, userId, pageUrl, pageTitle, referrer } = body

    if (!eventName) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    // Get client info from headers
    const userAgent = request.headers.get('user-agent') || undefined
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor?.split(',')[0]?.trim()

    await trackServerEvent(eventName, eventData, {
      sessionId,
      userId,
      pageUrl,
      pageTitle,
      referrer,
      userAgent,
      ipAddress,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track event error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track event' },
      { status: 500 }
    )
  }
}
