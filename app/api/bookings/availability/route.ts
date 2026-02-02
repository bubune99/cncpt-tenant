/**
 * Booking Availability API
 * GET /api/bookings/availability - Get available time slots
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getBookingServices,
  getBookingSettings,
  getAvailableSlots,
} from '@/lib/booking'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get settings
    const settings = await getBookingSettings()

    // If no service specified, return services list
    if (!serviceId) {
      const services = await getBookingServices()
      return NextResponse.json({
        services,
        settings: {
          timezone: settings.timezone,
          minNoticeHours: settings.minNoticeHours,
          maxAdvanceDays: settings.maxAdvanceDays,
          bookingPageTitle: settings.bookingPageTitle,
          bookingPageDescription: settings.bookingPageDescription,
          cancellationPolicy: settings.cancellationPolicy,
        },
      })
    }

    // Calculate date range
    const start = startDate
      ? new Date(startDate)
      : new Date()

    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + settings.maxAdvanceDays * 24 * 60 * 60 * 1000)

    // Get available slots
    const availability = await getAvailableSlots(serviceId, start, end)

    return NextResponse.json({
      serviceId,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      timezone: settings.timezone,
      availability,
    })
  } catch (error) {
    console.error('[availability] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
