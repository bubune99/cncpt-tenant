/**
 * Media Usage API
 *
 * GET /api/cms/media/[id]/usage - Get all places where media is used
 *
 * Requires authentication and tenant context.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMedia } from '@/lib/cms/media'
import { getMediaUsage, getUsageCount, isMediaInUse } from '@/lib/cms/media/usage'
import { stackServerApp } from '@/lib/cms/stack'
import {
  resolveTenantContext,
  tenantRequiredResponse,
} from '@/lib/cms/media/tenant'

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

    // Resolve tenant context
    const tenant = await resolveTenantContext(request, user.id)
    if (!tenant) return tenantRequiredResponse()

    const { id } = await params

    // Verify the media belongs to this tenant
    const media = await getMedia(id, false)
    if (!media || (media as any).tenantId !== tenant.tenantId) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

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
