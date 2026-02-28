/**
 * Event Schedule Item Detail API
 *
 * PUT /api/events/[id]/schedule/[itemId] - Update a schedule item
 * DELETE /api/events/[id]/schedule/[itemId] - Delete a schedule item
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateScheduleItem, deleteScheduleItem } from '@/lib/cms/events'

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params
    const body = await request.json()

    const scheduleItem = await updateScheduleItem(itemId, body)

    return NextResponse.json(scheduleItem)
  } catch (error) {
    console.error('Update schedule item error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update schedule item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params

    await deleteScheduleItem(itemId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete schedule item error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete schedule item' },
      { status: 500 }
    )
  }
}
