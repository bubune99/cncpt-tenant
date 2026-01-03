/**
 * Media Tags - Tag Management Operations
 */

import { prisma } from '@/lib/db'
import type { TagWithCount, TagCreateInput, TagUpdateInput } from './types'

// Type augmentation for Prisma client with MediaTag model
// This allows the code to compile before prisma generate is run
type PrismaWithMediaTag = typeof prisma & {
  mediaTag: {
    findMany: (args: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any | null>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
  }
}

const db = prisma as PrismaWithMediaTag

// =============================================================================
// LIST TAGS
// =============================================================================

export async function listTags(): Promise<TagWithCount[]> {
  const tags = await db.mediaTag.findMany({
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return tags as TagWithCount[]
}

// =============================================================================
// GET SINGLE TAG
// =============================================================================

export async function getTag(id: string): Promise<TagWithCount | null> {
  const tag = await db.mediaTag.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
  })

  return tag as TagWithCount | null
}

// =============================================================================
// GET TAG BY SLUG
// =============================================================================

export async function getTagBySlug(slug: string): Promise<TagWithCount | null> {
  const tag = await db.mediaTag.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
  })

  return tag as TagWithCount | null
}

// =============================================================================
// CREATE TAG
// =============================================================================

export async function createTag(input: TagCreateInput): Promise<TagWithCount> {
  const { name, color } = input
  const slug = input.slug || generateSlug(name)

  const tag = await db.mediaTag.create({
    data: {
      name,
      slug,
      color,
    },
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
  })

  return tag as TagWithCount
}

// =============================================================================
// UPDATE TAG
// =============================================================================

export async function updateTag(id: string, input: TagUpdateInput): Promise<TagWithCount> {
  const updateData: any = { ...input }

  // If name changes and no new slug provided, regenerate slug
  if (input.name && !input.slug) {
    updateData.slug = generateSlug(input.name)
  }

  const tag = await db.mediaTag.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
  })

  return tag as TagWithCount
}

// =============================================================================
// DELETE TAG
// =============================================================================

export async function deleteTag(id: string): Promise<void> {
  // MediaTagOnMedia entries will be cascade deleted
  await db.mediaTag.delete({
    where: { id },
  })
}

// =============================================================================
// SEARCH TAGS
// =============================================================================

export async function searchTags(query: string, limit = 10): Promise<TagWithCount[]> {
  const tags = await db.mediaTag.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
    orderBy: { name: 'asc' },
    take: limit,
  })

  return tags as TagWithCount[]
}

// =============================================================================
// GET OR CREATE TAG
// =============================================================================

export async function getOrCreateTag(name: string, color?: string): Promise<TagWithCount> {
  const slug = generateSlug(name)

  const existing = await db.mediaTag.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
  })

  if (existing) {
    return existing as TagWithCount
  }

  return createTag({ name, slug, color })
}

// =============================================================================
// GET POPULAR TAGS
// =============================================================================

export async function getPopularTags(limit = 20): Promise<TagWithCount[]> {
  const tags = await db.mediaTag.findMany({
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
    orderBy: {
      media: {
        _count: 'desc',
      },
    },
    take: limit,
  })

  return tags as TagWithCount[]
}

// Helper function
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
