/**
 * Event Speaker Detail API
 *
 * PUT /api/events/[id]/speakers/[speakerId] - Update a speaker (tenant-scoped)
 * DELETE /api/events/[id]/speakers/[speakerId] - Delete a speaker (tenant-scoped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateSpeaker, deleteSpeaker } from '@/lib/cms/events'
import { withTenant } from '@/lib/cms/api/tenant'

interface RouteParams {
  params: Promise<{ id: string; speakerId: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withTenant(request, async () => {
    try {
      const { speakerId } = await params
      const body = await request.json()

      const speaker = await updateSpeaker(speakerId, body)

      return NextResponse.json(speaker)
    } catch (error) {
      console.error('Update speaker error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update speaker' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant(request, async () => {
    try {
      const { speakerId } = await params

      await deleteSpeaker(speakerId)

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete speaker error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to delete speaker' },
        { status: 500 }
      )
    }
  })
}
