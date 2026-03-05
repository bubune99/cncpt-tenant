/**
 * Event Speakers API
 *
 * GET /api/events/[id]/speakers - List speakers for an event (tenant-scoped)
 * POST /api/events/[id]/speakers - Create a speaker (tenant-scoped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { listSpeakers, createSpeaker, getEvent } from '@/lib/cms/events'
import { withTenant } from '@/lib/cms/api/tenant'

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

      const speakers = await listSpeakers(id)

      return NextResponse.json(speakers)
    } catch (error) {
      console.error('List speakers error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list speakers' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withTenant(request, async () => {
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
          { error: 'Speaker name is required' },
          { status: 400 }
        )
      }

      const speaker = await createSpeaker(id, body)

      return NextResponse.json(speaker, { status: 201 })
    } catch (error) {
      console.error('Create speaker error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create speaker' },
        { status: 500 }
      )
    }
  })
}
