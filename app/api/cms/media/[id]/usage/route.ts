/**
 * Media Usage API
 *
 * GET /api/media/[id]/usage - Get all places where media is used
 *
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMediaUsage, getUsageCount, isMediaInUse } from '@/lib/cms/media/usage'
import { stackServerApp } from '@/lib/cms/stack'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('countOnly') === 'true'

    if (countOnly) {
      const count = await getUsageCount(id)
      const inUse = await isMediaInUse(id)
      return NextResponse.json({ count, inUse })
    }

    const usages = await getMediaUsage(id)

    return NextResponse.json({
      mediaId: id,
      count: usages.length,
      inUse: usages.length > 0,
      usages,
    })
  } catch (error) {
    console.error('Get media usage error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get media usage' },
      { status: 500 }
    )
  }
}
