/**
 * Booking Reminders Cron API
 * GET /api/bookings/reminders - Send pending reminders (called by cron)
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendPendingReminders } from '@/lib/booking'
import { isAuthorizedCron } from '@/lib/cms/cron-auth'

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (fail closed — deny if not configured)
    if (!isAuthorizedCron(request)) {
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
