/**
 * Media Usage Tracking
 *
 * Track where media files are used across the CMS
 */

import { prisma } from '../db'
import type { EntityType, UsageInfo } from './types'

// Type augmentation for Prisma client with MediaUsage model
// This allows the code to compile before prisma generate is run
type PrismaWithMediaUsage = typeof prisma & {
  mediaUsage: {
    findMany: (args: any) => Promise<any[]>
    upsert: (args: any) => Promise<any>
    deleteMany: (args: any) => Promise<{ count: number }>
    count: (args: any) => Promise<number>
    createMany: (args: any) => Promise<{ count: number }>
  }
  media: {
    findMany: (args: any) => Promise<any[]>
  }
}

const db = prisma as PrismaWithMediaUsage

// =============================================================================
// GET MEDIA USAGE
// =============================================================================

export async function getMediaUsage(mediaId: string): Promise<UsageInfo[]> {
  const usages = await db.mediaUsage.findMany({
    where: { mediaId },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch entity details for each usage
  const usageInfo: UsageInfo[] = []

  for (const usage of usages) {
    const info = await getEntityInfo(usage.entityType as EntityType, usage.entityId)
    if (info) {
      usageInfo.push({
        id: usage.id,
        entityType: usage.entityType as EntityType,
        entityId: usage.entityId,
        entityTitle: info.title,
        fieldName: usage.fieldName,
        url: info.url,
        createdAt: usage.createdAt,
      })
    }
  }

  return usageInfo
}

// =============================================================================
// TRACK USAGE
// =============================================================================

export async function trackUsage(
  mediaId: string,
  entityType: EntityType,
  entityId: string,
  fieldName?: string
): Promise<void> {
  await db.mediaUsage.upsert({
    where: {
      mediaId_entityType_entityId_fieldName: {
        mediaId,
        entityType,
        entityId,
        fieldName: fieldName || '',
      },
    },
    create: {
      mediaId,
      entityType,
      entityId,
      fieldName,
    },
    update: {},
  })
}

// =============================================================================
// REMOVE USAGE
// =============================================================================

export async function removeUsage(
  mediaId: string,
  entityType: EntityType,
  entityId: string,
  fieldName?: string
): Promise<void> {
  await db.mediaUsage.deleteMany({
    where: {
      mediaId,
      entityType,
      entityId,
      fieldName: fieldName || undefined,
    },
  })
}

// =============================================================================
// REMOVE ALL ENTITY USAGES
// =============================================================================

export async function removeEntityUsages(entityType: EntityType, entityId: string): Promise<void> {
  await db.mediaUsage.deleteMany({
    where: {
      entityType,
      entityId,
    },
  })
}

// =============================================================================
// CHECK IF MEDIA IS IN USE
// =============================================================================

export async function isMediaInUse(mediaId: string): Promise<boolean> {
  const count = await db.mediaUsage.count({
    where: { mediaId },
  })
  return count > 0
}

// =============================================================================
// GET USAGE COUNT
// =============================================================================

export async function getUsageCount(mediaId: string): Promise<number> {
  return db.mediaUsage.count({
    where: { mediaId },
  })
}

// =============================================================================
// FIND ORPHANED MEDIA
// =============================================================================

export async function findOrphanedMedia(limit = 100): Promise<string[]> {
  const orphaned = await db.media.findMany({
    where: {
      deletedAt: null,
      usages: {
        none: {},
      },
      // Exclude recently uploaded (give them time to be attached)
      createdAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
      },
    },
    select: { id: true },
    take: limit,
  })

  return orphaned.map((m) => m.id)
}

// =============================================================================
// SYNC USAGE FOR ENTITY
// =============================================================================

/**
 * Sync media usage for an entity. Removes old usages and adds new ones.
 */
export async function syncEntityUsage(
  entityType: EntityType,
  entityId: string,
  mediaUsages: Array<{ mediaId: string; fieldName?: string }>
): Promise<void> {
  // Remove all existing usages for this entity
  await removeEntityUsages(entityType, entityId)

  // Add new usages
  if (mediaUsages.length > 0) {
    await db.mediaUsage.createMany({
      data: mediaUsages.map((usage) => ({
        mediaId: usage.mediaId,
        entityType,
        entityId,
        fieldName: usage.fieldName,
      })),
      skipDuplicates: true,
    })
  }
}

// =============================================================================
// HELPER: GET ENTITY INFO
// =============================================================================

async function getEntityInfo(
  entityType: EntityType,
  entityId: string
): Promise<{ title: string; url: string } | null> {
  try {
    switch (entityType) {
      case 'product': {
        const product = await prisma.product.findUnique({
          where: { id: entityId },
          select: { title: true, slug: true },
        })
        if (product) {
          return {
            title: product.title,
            url: `/admin/products/${entityId}`,
          }
        }
        break
      }

      case 'blog_post': {
        const post = await prisma.blogPost.findUnique({
          where: { id: entityId },
          select: { title: true, slug: true },
        })
        if (post) {
          return {
            title: post.title,
            url: `/admin/blog/${entityId}`,
          }
        }
        break
      }

      case 'page': {
        const page = await prisma.page.findUnique({
          where: { id: entityId },
          select: { title: true, slug: true },
        })
        if (page) {
          return {
            title: page.title,
            url: `/admin/pages/${entityId}`,
          }
        }
        break
      }

      case 'category': {
        const category = await prisma.category.findUnique({
          where: { id: entityId },
          select: { name: true, slug: true },
        })
        if (category) {
          return {
            title: category.name,
            url: `/admin/products/categories`,
          }
        }
        break
      }

      case 'email_campaign': {
        const campaign = await prisma.emailCampaign.findUnique({
          where: { id: entityId },
          select: { name: true },
        })
        if (campaign) {
          return {
            title: campaign.name,
            url: `/admin/email-marketing/campaigns/${entityId}`,
          }
        }
        break
      }
    }
  } catch (error) {
    console.error(`Failed to get entity info for ${entityType}:${entityId}`, error)
  }

  return null
}
