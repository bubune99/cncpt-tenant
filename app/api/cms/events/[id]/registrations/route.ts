/**
 * Event Registrations API
 *
 * GET /api/events/[id]/registrations - List registrations for an event (tenant-scoped)
 * POST /api/events/[id]/registrations - Create a registration (tenant-scoped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { listRegistrations, createRegistration, getEvent } from '@/lib/cms/events'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET — admin-only (registration roster — exposes registrant PII)
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenantAuth(request, 'view', async () => {
    try {
      const { id } = await params
      const { searchParams } = new URL(request.url)

      const event = await getEvent(id)

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }

      const options = {
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
      }

      const result = await listRegistrations(id, options)

      return NextResponse.json(result)
    } catch (error) {
      console.error('List registrations error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list registrations' },
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

      const registration = await createRegistration(id, body)

      return NextResponse.json(registration, { status: 201 })
    } catch (error) {
      console.error('Create registration error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create registration' },
        { status: 500 }
      )
    }
  })
}
