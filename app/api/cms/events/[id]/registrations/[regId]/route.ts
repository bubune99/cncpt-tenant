/**
 * Event Registration Detail API
 *
 * PUT /api/events/[id]/registrations/[regId] - Update a registration (tenant-scoped)
 * DELETE /api/events/[id]/registrations/[regId] - Cancel a registration (tenant-scoped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateRegistration, cancelRegistration } from '@/lib/cms/events'
import { withTenant } from '@/lib/cms/api/tenant'

interface RouteParams {
  params: Promise<{ id: string; regId: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withTenant(request, async () => {
    try {
      const { regId } = await params
      const body = await request.json()

      const registration = await updateRegistration(regId, body)

      return NextResponse.json(registration)
    } catch (error) {
      console.error('Update registration error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update registration' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant(request, async () => {
    try {
      const { regId } = await params

      const registration = await cancelRegistration(regId)

      return NextResponse.json(registration)
    } catch (error) {
      console.error('Cancel registration error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to cancel registration' },
        { status: 500 }
      )
    }
  })
}
