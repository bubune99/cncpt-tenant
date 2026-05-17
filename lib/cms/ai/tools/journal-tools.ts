/**
 * Journal Tools — Atlas Redesign G03 + G04
 *
 * Agent tools for blog series, contributors, related posts, and distribution channels.
 */

import { tool } from 'ai'
import { z } from 'zod'

async function getDb() {
  const { prisma } = await import('../../db')
  return prisma
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 5000,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error: unknown) {
    clearTimeout(timeoutId!)
    throw error
  }
}

export const getJournalSeries = tool({
  description: 'Get a journal series with its posts (ordered by chapter position).',
  inputSchema: z.object({
    id: z.string().describe('Series ID'),
  }),
  execute: async ({ id }) => {
    try {
      const prisma = await getDb()

      const series = await withTimeout(
        prisma.blogSeries.findUnique({
          where: { id },
          include: {
            posts: {
              include: {
                post: { select: { id: true, title: true, slug: true, status: true, publishedAt: true } },
              },
              orderBy: { position: 'asc' },
            },
          },
        }),
        5000,
        'Get series timed out'
      )

      if (!series) return { success: false, error: 'Series not found' }

      return { success: true, series }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get series' }
    }
  },
})

export const addPostToSeries = tool({
  description: 'Add a blog post to a journal series at a specific chapter position.',
  inputSchema: z.object({
    postId: z.string(),
    seriesId: z.string(),
    position: z.number().int().optional().describe('Chapter position in series (0-indexed, default: append)'),
  }),
  execute: async ({ postId, seriesId, position }) => {
    try {
      const prisma = await getDb()

      let pos = position
      if (pos === undefined) {
        const last = await prisma.blogPostSeries.findFirst({
          where: { seriesId },
          orderBy: { position: 'desc' },
          select: { position: true },
        })
        pos = (last?.position ?? -1) + 1
      }

      const record = await withTimeout(
        prisma.blogPostSeries.upsert({
          where: { postId_seriesId: { postId, seriesId } },
          create: { postId, seriesId, position: pos },
          update: { position: pos },
        }),
        5000,
        'Add post to series timed out'
      )

      // Update postCount
      await prisma.blogSeries.update({
        where: { id: seriesId },
        data: { postCount: { increment: 1 } },
      })

      return { success: true, record }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add post to series' }
    }
  },
})

export const schedulePostChannel = tool({
  description: 'Schedule or enable a blog post for distribution on a specific channel.',
  inputSchema: z.object({
    postId: z.string(),
    channel: z.enum(['WEB', 'NEWSLETTER', 'RSS', 'TWITTER_X', 'MASTODON', 'INSTAGRAM']),
    scheduledAt: z.string().optional().describe('ISO datetime to schedule the distribution'),
    copy: z.string().optional().describe('Channel-specific copy override'),
  }),
  execute: async ({ postId, channel, scheduledAt, copy }) => {
    try {
      const prisma = await getDb()

      const channelRecord = await withTimeout(
        prisma.postDistributionChannel.upsert({
          where: { postId_channel: { postId, channel } },
          create: {
            postId,
            channel,
            enabled: true,
            ...(scheduledAt ? { scheduledAt: new Date(scheduledAt), status: 'SCHEDULED' } : { status: 'DRAFT' }),
            ...(copy ? { copy } : {}),
          },
          update: {
            enabled: true,
            ...(scheduledAt ? { scheduledAt: new Date(scheduledAt), status: 'SCHEDULED' } : {}),
            ...(copy !== undefined ? { copy } : {}),
          },
        }),
        5000,
        'Schedule post channel timed out'
      )

      return {
        success: true,
        channel: channelRecord,
        message: `Post scheduled for ${channel}${scheduledAt ? ` at ${scheduledAt}` : ''}`,
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule channel' }
    }
  },
})

export const addRelatedPost = tool({
  description: 'Link a blog post as a "related post" to another post.',
  inputSchema: z.object({
    postId: z.string().describe('The source post'),
    relatedPostId: z.string().describe('The post to link as related'),
    position: z.number().int().optional(),
  }),
  execute: async ({ postId, relatedPostId, position }) => {
    try {
      const prisma = await getDb()

      let pos = position
      if (pos === undefined) {
        const last = await prisma.blogPostRelated.findFirst({
          where: { postId },
          orderBy: { position: 'desc' },
          select: { position: true },
        })
        pos = (last?.position ?? -1) + 1
      }

      const record = await withTimeout(
        prisma.blogPostRelated.upsert({
          where: { postId_relatedPostId: { postId, relatedPostId } },
          create: { postId, relatedPostId, position: pos },
          update: { position: pos },
        }),
        5000,
        'Add related post timed out'
      )

      return { success: true, record }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to link related post' }
    }
  },
})

export const listJournalContributors = tool({
  description: 'List contributors for a blog post.',
  inputSchema: z.object({
    postId: z.string(),
  }),
  execute: async ({ postId }) => {
    try {
      const prisma = await getDb()

      const contributors = await withTimeout(
        prisma.blogContributor.findMany({
          where: { postId },
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          orderBy: { position: 'asc' },
        }),
        5000,
        'List contributors timed out'
      )

      return { success: true, contributors }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list contributors' }
    }
  },
})

export const setPostContributors = tool({
  description: 'Set (replace) the contributors for a blog post.',
  inputSchema: z.object({
    postId: z.string(),
    contributors: z.array(z.object({
      userId: z.string(),
      role: z.enum(['author', 'editor', 'photographer']).default('author'),
    })),
  }),
  execute: async ({ postId, contributors }) => {
    try {
      const prisma = await getDb()

      // Replace all contributors
      await withTimeout(
        prisma.$transaction([
          prisma.blogContributor.deleteMany({ where: { postId } }),
          ...contributors.map(({ userId, role }, index) =>
            prisma.blogContributor.create({ data: { postId, userId, role, position: index } })
          ),
        ]),
        5000,
        'Set contributors timed out'
      )

      return { success: true, postId, contributorCount: contributors.length }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to set contributors' }
    }
  },
})

export const journalTools = {
  getJournalSeries,
  addPostToSeries,
  schedulePostChannel,
  addRelatedPost,
  listJournalContributors,
  setPostContributors,
}
