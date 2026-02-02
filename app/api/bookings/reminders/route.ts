/**
 * Booking Reminders Cron API
 * GET /api/bookings/reminders - Send pending reminders (called by cron)
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendPendingReminders } from '@/lib/booking'

export const dynamic = 'force-dynamic'

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for Vercel Cron or external cron services)
    const authHeader = request.headers.get('authorization')
    const cronSecret = authHeader?.replace('Bearer ', '')

    if (CRON_SECRET && cronSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Send pending reminders
    const { sent24h, sent1h } = await sendPendingReminders()

    console.log(`[reminders] Sent ${sent24h} 24h reminders, ${sent1h} 1h reminders`)

    return NextResponse.json({
      success: true,
      sent24h,
      sent1h,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[reminders] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}
