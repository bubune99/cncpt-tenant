/**
 * Media Library - Core CRUD Operations
 */

import { prisma } from '../db'
import type {
  MediaFilters,
  MediaWithRelations,
  MediaListResponse,
  MediaCreateInput,
  MediaUpdateInput,
} from './types'

// Type augmentation for Prisma client with extended Media model
// This allows the code to compile before prisma generate is run with new schema
type PrismaWithMedia = typeof prisma & {
  media: {
    findMany: (args: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any | null>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
    updateMany: (args: any) => Promise<{ count: number }>
    deleteMany: (args: any) => Promise<{ count: number }>
    count: (args: any) => Promise<number>
    groupBy: (args: any) => Promise<any[]>
    aggregate: (args: any) => Promise<any>
  }
  mediaTagOnMedia: {
    createMany: (args: any) => Promise<{ count: number }>
    deleteMany: (args: any) => Promise<{ count: number }>
  }
}

const db = prisma as PrismaWithMedia

// Type for media where input
interface MediaWhereInput {
  id?: { in: string[] }
  tenantId?: number | null
  deletedAt?: null | Date | { gte?: Date }
  folderId?: string | null
  mimeType?: { startsWith?: string; contains?: string } | string
  OR?: any[]
  tags?: { some: { tagId: { in: string[] } } }
  createdAt?: { gte?: Date }
}

// Type for media order by
interface MediaOrderByInput {
  originalName?: 'asc' | 'desc'
  size?: 'asc' | 'desc'
  mimeType?: 'asc' | 'desc'
  createdAt?: 'asc' | 'desc'
}

// =============================================================================
// LIST MEDIA
// =============================================================================

export async function listMedia(filters: MediaFilters = {}): Promise<MediaListResponse> {
  const {
    tenantId,
    folderId,
    type,
    search,
    tagIds,
    includeDeleted = false,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters

  const where: MediaWhereInput = {}

  // Multi-tenant filter - CRITICAL for data isolation
  if (tenantId !== undefined) {
    where.tenantId = tenantId
  }

  // Soft delete filter
  if (!includeDeleted) {
    where.deletedAt = null
  }

  // Folder filter
  if (folderId !== undefined) {
    where.folderId = folderId
  }

  // Type filter (by mime type prefix)
  if (type) {
    switch (type) {
      case 'image':
        where.mimeType = { startsWith: 'image/' }
        break
      case 'video':
        where.mimeType = { startsWith: 'video/' }
        break
      case 'audio':
        where.mimeType = { startsWith: 'audio/' }
        break
      case 'document':
        where.OR = [
          { mimeType: 'application/pdf' },
          { mimeType: { contains: 'document' } },
          { mimeType: { contains: 'spreadsheet' } },
          { mimeType: { contains: 'presentation' } },
          { mimeType: { contains: 'word' } },
          { mimeType: { contains: 'excel' } },
          { mimeType: { contains: 'powerpoint' } },
          { mimeType: 'text/plain' },
          { mimeType: 'text/csv' },
        ]
        break
    }
  }

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase()
    where.OR = [
      { filename: { contains: searchLower, mode: 'insensitive' } },
      { originalName: { contains: searchLower, mode: 'insensitive' } },
      { title: { contains: searchLower, mode: 'insensitive' } },
      { alt: { contains: searchLower, mode: 'insensitive' } },
      { caption: { contains: searchLower, mode: 'insensitive' } },
    ]
  }

  // Tag filter
  if (tagIds && tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: { in: tagIds },
      },
    }
  }

  // Sort
  const orderBy: MediaOrderByInput = {}
  switch (sortBy) {
    case 'name':
      orderBy.originalName = sortOrder
      break
    case 'size':
      orderBy.size = sortOrder
      break
    case 'type':
      orderBy.mimeType = sortOrder
      break
    case 'createdAt':
    default:
      orderBy.createdAt = sortOrder
      break
  }

  const skip = (page - 1) * limit

  const [media, total] = await Promise.all([
    db.media.findMany({
      where,
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.media.count({ where }),
  ])

  return {
    media: media as MediaWithRelations[],
    total,
    page,
    limit,
    hasMore: skip + media.length < total,
  }
}

// =============================================================================
// GET SINGLE MEDIA
// =============================================================================

export async function getMedia(id: string, includeUsage = true): Promise<MediaWithRelations | null> {
  const media = await db.media.findUnique({
    where: { id },
    include: {
      folder: true,
      tags: {
        include: {
          tag: true,
        },
      },
      usages: includeUsage,
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return media as MediaWithRelations | null
}

// =============================================================================
// CREATE MEDIA
// =============================================================================

export async function createMedia(input: MediaCreateInput): Promise<MediaWithRelations> {
  const { tagIds, ...data } = input

  const media = await db.media.create({
    data: {
      ...data,
      tags: tagIds?.length
        ? {
            create: tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: {
      folder: true,
      tags: {
        include: {
          tag: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return media as MediaWithRelations
}

// =============================================================================
// UPDATE MEDIA
// =============================================================================

export async function updateMedia(id: string, input: MediaUpdateInput): Promise<MediaWithRelations> {
  const { tagIds, ...data } = input

  // If tagIds is provided, replace all tags
  if (tagIds !== undefined) {
    await db.mediaTagOnMedia.deleteMany({
      where: { mediaId: id },
    })

    if (tagIds.length > 0) {
      await db.mediaTagOnMedia.createMany({
        data: tagIds.map((tagId) => ({ mediaId: id, tagId })),
      })
    }
  }

  const media = await db.media.update({
    where: { id },
    data,
    include: {
      folder: true,
      tags: {
        include: {
          tag: true,
        },
      },
      usages: true,
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return media as MediaWithRelations
}

// =============================================================================
// DELETE MEDIA
// =============================================================================

export async function deleteMedia(id: string, hard = false): Promise<void> {
  if (hard) {
    // Hard delete - permanently remove
    await db.media.delete({
      where: { id },
    })
  } else {
    // Soft delete - mark as deleted
    await db.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

// =============================================================================
// RESTORE MEDIA
// =============================================================================

export async function restoreMedia(id: string): Promise<MediaWithRelations> {
  const media = await db.media.update({
    where: { id },
    data: { deletedAt: null },
    include: {
      folder: true,
      tags: {
        include: {
          tag: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return media as MediaWithRelations
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

export async function bulkDeleteMedia(ids: string[], hard = false): Promise<number> {
  if (hard) {
    const result = await db.media.deleteMany({
      where: { id: { in: ids } },
    })
    return result.count
  } else {
    const result = await db.media.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    })
    return result.count
  }
}

export async function bulkMoveMedia(ids: string[], folderId: string | null): Promise<number> {
  const result = await db.media.updateMany({
    where: { id: { in: ids } },
    data: { folderId },
  })
  return result.count
}

export async function bulkTagMedia(ids: string[], tagIds: string[]): Promise<number> {
  // Create tag associations for each media item
  const data = ids.flatMap((mediaId) =>
    tagIds.map((tagId) => ({ mediaId, tagId }))
  )

  await db.mediaTagOnMedia.createMany({
    data,
    skipDuplicates: true,
  })

  return ids.length
}

export async function bulkUntagMedia(ids: string[], tagIds: string[]): Promise<number> {
  const result = await db.mediaTagOnMedia.deleteMany({
    where: {
      mediaId: { in: ids },
      tagId: { in: tagIds },
    },
  })
  return result.count
}

export async function bulkRestoreMedia(ids: string[]): Promise<number> {
  const result = await db.media.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: null },
  })
  return result.count
}

// =============================================================================
// STATS
// =============================================================================

export async function getMediaStats() {
  const [total, byType, totalSize, recentCount] = await Promise.all([
    db.media.count({ where: { deletedAt: null } }),
    db.media.groupBy({
      by: ['mimeType'],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    db.media.aggregate({
      where: { deletedAt: null },
      _sum: { size: true },
    }),
    db.media.count({
      where: {
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  // Group by media type
  const typeStats = {
    image: 0,
    video: 0,
    audio: 0,
    document: 0,
    other: 0,
  }

  for (const item of byType) {
    if (item.mimeType.startsWith('image/')) {
      typeStats.image += item._count.id
    } else if (item.mimeType.startsWith('video/')) {
      typeStats.video += item._count.id
    } else if (item.mimeType.startsWith('audio/')) {
      typeStats.audio += item._count.id
    } else if (
      item.mimeType === 'application/pdf' ||
      item.mimeType.includes('document') ||
      item.mimeType.includes('word')
    ) {
      typeStats.document += item._count.id
    } else {
      typeStats.other += item._count.id
    }
  }

  return {
    total,
    totalSize: totalSize._sum.size || 0,
    recentCount,
    byType: typeStats,
  }
}

// Re-export types
export * from './types'
