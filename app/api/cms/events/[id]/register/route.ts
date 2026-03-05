/**
 * Public Event Registration API
 *
 * POST /api/events/[id]/register - Register for an event (public endpoint, tenant-scoped)
 *
 * Handles free ticket registration directly.
 * Returns payment info for paid tickets (Stripe checkout to be added later).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getEvent, listTicketTypes, createRegistration } from '@/lib/cms/events'
import { withTenant } from '@/lib/cms/api/tenant'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withTenant(request, async () => {
    try {
      const { id } = await params
      const body = await request.json()

      // Validate required fields
      if (!body.attendeeName) {
        return NextResponse.json(
          { error: 'Attendee name is required' },
          { status: 400 }
        )
      }

      if (!body.attendeeEmail) {
        return NextResponse.json(
          { error: 'Attendee email is required' },
          { status: 400 }
        )
      }

      if (!body.ticketTypeId) {
        return NextResponse.json(
          { error: 'Ticket type is required' },
          { status: 400 }
        )
      }

      // Check if event exists and is published
      const event = await getEvent(id)

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }

      if (event.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: 'Event is not open for registration' },
          { status: 400 }
        )
      }

      // Check event capacity
      if (event.maxAttendees > 0 && event._count.registrations >= event.maxAttendees) {
        return NextResponse.json(
          { error: 'Event has reached maximum capacity' },
          { status: 400 }
        )
      }

      // Find the ticket type and check availability
      const ticketTypes = await listTicketTypes(id)
      const ticketType = ticketTypes.find((t) => t.id === body.ticketTypeId)

      if (!ticketType) {
        return NextResponse.json(
          { error: 'Ticket type not found' },
          { status: 404 }
        )
      }

      if (!ticketType.isActive) {
        return NextResponse.json(
          { error: 'Ticket type is not available' },
          { status: 400 }
        )
      }

      // Check if ticket type has quantity limit and if it's sold out
      if (ticketType.quantity && ticketType.sold >= ticketType.quantity) {
        return NextResponse.json(
          { error: 'Ticket type is sold out' },
          { status: 400 }
        )
      }

      // Check sales window
      const now = new Date()
      if (ticketType.salesStart && new Date(ticketType.salesStart) > now) {
        return NextResponse.json(
          { error: 'Ticket sales have not started yet' },
          { status: 400 }
        )
      }
      if (ticketType.salesEnd && new Date(ticketType.salesEnd) < now) {
        return NextResponse.json(
          { error: 'Ticket sales have ended' },
          { status: 400 }
        )
      }

      // Handle free vs paid tickets
      const price = ticketType.price ?? 0

      if (price === 0) {
        // Free ticket: create registration with CONFIRMED status
        const registration = await createRegistration(id, {
          attendeeName: body.attendeeName,
          attendeeEmail: body.attendeeEmail,
          attendeePhone: body.attendeePhone,
          ticketTypeId: body.ticketTypeId,
          amount: 0,
          currency: ticketType.currency || 'usd',
          status: 'CONFIRMED',
          notes: body.notes,
        })

        return NextResponse.json(registration, { status: 201 })
      }

      // Paid ticket: return payment info (Stripe checkout to be added later)
      return NextResponse.json({
        requiresPayment: true,
        amount: price,
        currency: ticketType.currency || 'usd',
        ticketType: {
          id: ticketType.id,
          name: ticketType.name,
        },
        event: {
          id: event.id,
          title: event.title,
        },
      })
    } catch (error) {
      console.error('Public registration error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to register for event' },
        { status: 500 }
      )
    }
  })
}
