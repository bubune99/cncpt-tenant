/**
 * Single Booking API
 * GET /api/bookings/[id] - Get booking details
 * PATCH /api/bookings/[id] - Update booking (status, notes)
 * DELETE /api/bookings/[id] - Cancel booking
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isSuperAdmin } from '@/lib/super-admin'
import {
  getBookingById,
  updateBookingStatus,
  updateBookingNotes,
} from '@/lib/booking'

export const dynamic = 'force-dynamic'

// Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const booking = await getBookingById(id)

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Public access only shows limited info (for cancel/reschedule pages)
    const user = await getCurrentUser()
    const isAdmin = user && (await isSuperAdmin(user.id))

    if (!isAdmin) {
      // Return limited info for public
      return NextResponse.json({
        booking: {
          id: booking.id,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          scheduledAt: booking.scheduledAt,
          durationMinutes: booking.durationMinutes,
          status: booking.status,
          service: booking.service
            ? { name: booking.service.name }
            : null,
        },
      })
    }

    // Admin gets full details
    return NextResponse.json({ booking })
  } catch (error) {
    console.error('[bookings/id] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

// Update booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !(await isSuperAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const booking = await getBookingById(id)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Update status if provided
    if (body.status) {
      const success = await updateBookingStatus(id, body.status, {
        cancelledBy: body.cancelledBy || 'admin',
        cancellationReason: body.cancellationReason,
      })
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update status' },
          { status: 500 }
        )
      }
    }

    // Update notes if provided
    if (body.adminNotes !== undefined) {
      const success = await updateBookingNotes(id, body.adminNotes)
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update notes' },
          { status: 500 }
        )
      }
    }

    const updatedBooking = await getBookingById(id)
    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('[bookings/id] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

// Cancel booking (public - for clients)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    const booking = await getBookingById(id)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify email matches (simple auth for clients)
    if (email && email.toLowerCase() !== booking.clientEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const user = await getCurrentUser()
    const isAdmin = user && (await isSuperAdmin(user.id))

    // If not admin, require email verification
    if (!isAdmin && !email) {
      return NextResponse.json(
        { error: 'Email verification required' },
        { status: 401 }
      )
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    if (booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed booking' },
        { status: 400 }
      )
    }

    const success = await updateBookingStatus(id, 'cancelled', {
      cancelledBy: isAdmin ? 'admin' : 'client',
    })

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[bookings/id] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
