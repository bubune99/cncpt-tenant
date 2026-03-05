/**
 * Public Events API
 *
 * GET /api/events/public - List published events (public endpoint, tenant-scoped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { listEvents } from '@/lib/cms/events'
import { withTenant } from '@/lib/cms/api/tenant'

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
    try {
      const { searchParams } = new URL(request.url)

      const options = {
        status: 'PUBLISHED',
        eventType: searchParams.get('eventType') || undefined,
        search: searchParams.get('search') || undefined,
        startAfter: searchParams.get('startAfter') || undefined,
        limit: parseInt(searchParams.get('limit') || '20'),
        offset: parseInt(searchParams.get('offset') || '0'),
        orderBy: 'startDate' as const,
        orderDir: 'asc' as const,
      }

      const result = await listEvents(options)

      return NextResponse.json(result)
    } catch (error) {
      console.error('List public events error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list events' },
        { status: 500 }
      )
    }
  })
}
