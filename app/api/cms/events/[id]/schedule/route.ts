/**
 * Event Schedule Items API
 *
 * GET /api/events/[id]/schedule - List schedule items for an event (tenant-scoped)
 * POST /api/events/[id]/schedule - Create a schedule item (tenant-scoped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { listScheduleItems, createScheduleItem, getEvent } from '@/lib/cms/events'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant(request, async () => {
    try {
      const { id } = await params

      const event = await getEvent(id)

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }

      const scheduleItems = await listScheduleItems(id)

      return NextResponse.json(scheduleItems)
    } catch (error) {
      console.error('List schedule items error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list schedule items' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withTenantAuth(request, 'edit', async () => {
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

      if (!body.title) {
        return NextResponse.json(
          { error: 'Schedule item title is required' },
          { status: 400 }
        )
      }

      if (!body.startTime) {
        return NextResponse.json(
          { error: 'Schedule item start time is required' },
          { status: 400 }
        )
      }

      if (!body.endTime) {
        return NextResponse.json(
          { error: 'Schedule item end time is required' },
          { status: 400 }
        )
      }

      const scheduleItem = await createScheduleItem(id, body)

      return NextResponse.json(scheduleItem, { status: 201 })
    } catch (error) {
      console.error('Create schedule item error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create schedule item' },
        { status: 500 }
      )
    }
  })
}
