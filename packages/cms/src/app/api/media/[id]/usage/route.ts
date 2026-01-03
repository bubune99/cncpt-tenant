/**
 * Media Usage API
 *
 * GET /api/media/[id]/usage - Get all places where media is used
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMediaUsage, getUsageCount, isMediaInUse } from '@/lib/media/usage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
