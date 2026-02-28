/**
 * Event Ticket Type Detail API
 *
 * PUT /api/events/[id]/ticket-types/[ticketId] - Update a ticket type
 * DELETE /api/events/[id]/ticket-types/[ticketId] - Delete a ticket type
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateTicketType, deleteTicketType } from '@/lib/cms/events'

interface RouteParams {
  params: Promise<{ id: string; ticketId: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { ticketId } = await params
    const body = await request.json()

    const ticketType = await updateTicketType(ticketId, body)

    return NextResponse.json(ticketType)
  } catch (error) {
    console.error('Update ticket type error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update ticket type' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { ticketId } = await params

    await deleteTicketType(ticketId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete ticket type error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete ticket type' },
      { status: 500 }
    )
  }
}
