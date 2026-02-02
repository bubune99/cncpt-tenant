/**
 * Bookings API
 * POST /api/bookings - Create a new booking
 * GET /api/bookings - Get all bookings (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isSuperAdmin } from '@/lib/super-admin'
import {
  createBooking,
  getAllBookings,
  getBookingServiceById,
  getAvailableSlots,
} from '@/lib/booking'
import type { CreateBookingInput, BookingStatus } from '@/types/booking'

export const dynamic = 'force-dynamic'

// Create a new booking (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const required = ['serviceId', 'scheduledAt', 'clientName', 'clientEmail']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate service exists
    const service = await getBookingServiceById(body.serviceId)
    if (!service) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      )
    }

    // Validate slot is still available
    const scheduledAt = new Date(body.scheduledAt)
    const startOfDay = new Date(scheduledAt)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(scheduledAt)
    endOfDay.setHours(23, 59, 59, 999)

    const availableDates = await getAvailableSlots(body.serviceId, startOfDay, endOfDay)
    const dateSlots = availableDates.find(
      (d) => d.date === scheduledAt.toISOString().split('T')[0]
    )

    if (!dateSlots) {
      return NextResponse.json(
        { error: 'No availability on this date' },
        { status: 400 }
      )
    }

    const requestedTime = scheduledAt.toTimeString().slice(0, 5)
    const slot = dateSlots.slots.find((s) => s.time === requestedTime)

    if (!slot || !slot.available) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 400 }
      )
    }

    // Create the booking
    const input: CreateBookingInput = {
      serviceId: body.serviceId,
      scheduledAt: body.scheduledAt,
      timezone: body.timezone || 'America/New_York',
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone,
      companyName: body.companyName,
      websiteUrl: body.websiteUrl,
      projectType: body.projectType,
      projectDescription: body.projectDescription,
      budgetRange: body.budgetRange,
      howDidYouHear: body.howDidYouHear,
    }

    const booking = await createBooking(input)

    if (!booking) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        serviceName: service.name,
      },
    })
  } catch (error) {
    console.error('[bookings] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

// Get all bookings (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await isSuperAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as BookingStatus | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { bookings, total } = await getAllBookings({
      status: status || undefined,
      limit,
      offset,
    })

    return NextResponse.json({ bookings, total })
  } catch (error) {
    console.error('[bookings] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
