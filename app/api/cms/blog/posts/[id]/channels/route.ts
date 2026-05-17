/**
 * Post Distribution Channels API — Atlas Redesign G04
 *
 * GET /api/cms/blog/posts/[id]/channels — get channel state
 * PUT /api/cms/blog/posts/[id]/channels — upsert channel config
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const upsertChannelSchema = z.object({
  channel: z.enum(['WEB', 'NEWSLETTER', 'RSS', 'TWITTER_X', 'MASTODON', 'INSTAGRAM']),
  enabled: z.boolean().optional(),
  copy: z.string().optional(),
  scheduledAt: z.string().optional(),
})

export async function GET(_request: NextRequest, context: RouteContext) {
  return withTenant(_request, async () => {
    try {
      const { id: postId } = await context.params

      const channels = await prisma.postDistributionChannel.findMany({
        where: { postId },
        orderBy: { channel: 'asc' },
      })

      return NextResponse.json({ success: true, data: channels })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get channels' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const { id: postId } = await context.params
      const body: unknown = await request.json()

      const parsed = upsertChannelSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const { channel, enabled, copy, scheduledAt } = parsed.data

      const record = await prisma.postDistributionChannel.upsert({
        where: { postId_channel: { postId, channel } },
        create: {
          postId,
          channel,
          enabled: enabled ?? false,
          ...(copy ? { copy } : {}),
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt), status: 'SCHEDULED' } : { status: 'DRAFT' }),
        },
        update: {
          ...(enabled !== undefined ? { enabled } : {}),
          ...(copy !== undefined ? { copy } : {}),
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt), status: 'SCHEDULED' } : {}),
        },
      })

      return NextResponse.json({ success: true, data: record })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update channel' },
        { status: 500 }
      )
    }
  })
}
