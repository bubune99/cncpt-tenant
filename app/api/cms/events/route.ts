/**
 * Events API
 *
 * GET /api/events - List all events (tenant-scoped)
 * POST /api/events - Create a new event (tenant-scoped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { listEvents, createEvent } from '@/lib/cms/events'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
    try {
      const { searchParams } = new URL(request.url)

      const options = {
        status: searchParams.get('status') || undefined,
        eventType: searchParams.get('eventType') || undefined,
        search: searchParams.get('search') || undefined,
        startAfter: searchParams.get('startAfter') || undefined,
        startBefore: searchParams.get('startBefore') || undefined,
        limit: parseInt(searchParams.get('limit') || '20'),
        offset: parseInt(searchParams.get('offset') || '0'),
        orderBy: (searchParams.get('orderBy') as any) || 'startDate',
        orderDir: (searchParams.get('orderDir') as any) || 'desc',
      }

      const result = await listEvents(options)

      return NextResponse.json(result)
    } catch (error) {
      console.error('List events error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list events' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const body = await request.json()

      if (!body.title) {
        return NextResponse.json(
          { error: 'Event title is required' },
          { status: 400 }
        )
      }

      if (!body.startDate) {
        return NextResponse.json(
          { error: 'Event start date is required' },
          { status: 400 }
        )
      }

      if (!body.endDate) {
        return NextResponse.json(
          { error: 'Event end date is required' },
          { status: 400 }
        )
      }

      const event = await createEvent(body)

      return NextResponse.json(event, { status: 201 })
    } catch (error) {
      console.error('Create event error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create event' },
        { status: 500 }
      )
    }
  })
}
