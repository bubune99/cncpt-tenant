/**
 * Event Ticket Types API
 *
 * GET /api/events/[id]/ticket-types - List ticket types for an event
 * POST /api/events/[id]/ticket-types - Create a ticket type
 */

import { NextRequest, NextResponse } from 'next/server'
import { listTicketTypes, createTicketType, getEvent } from '@/lib/cms/events'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const event = await getEvent(id)

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const ticketTypes = await listTicketTypes(id)

    return NextResponse.json(ticketTypes)
  } catch (error) {
    console.error('List ticket types error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list ticket types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const event = await getEvent(id)

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!body.name) {
      return NextResponse.json(
        { error: 'Ticket type name is required' },
        { status: 400 }
      )
    }

    const ticketType = await createTicketType(id, body)

    return NextResponse.json(ticketType, { status: 201 })
  } catch (error) {
    console.error('Create ticket type error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ticket type' },
      { status: 500 }
    )
  }
}
