/* ------------------------------------------------------------------ */
/*  Marketplace Service — CRUD + query for DB-driven templates         */
/* ------------------------------------------------------------------ */

import { prisma } from '@/lib/cms/db'
import type {
  MarketplaceTemplate,
  MarketplaceFilter,
  CreateMarketplaceTemplateInput,
  UpdateMarketplaceTemplateInput,
  PaginatedTemplates,
  CategoryCount,
  TemplateType,
  TemplateCategory,
} from './types'
import { ALL_CATEGORIES } from './types'
import type { Block } from '@/lib/cms/block-editor/types'

// Re-export types for convenience
export * from './types'

// Re-export scraper and ingestion APIs
export { ingestTemplate, ingestBatch } from './ingest'
export type { IngestedTemplate, BatchOptions, BatchResult } from './ingest'
export {
  getScraper,
  getAvailableSources,
  getAvailableAdapters,
  registerScraper,
} from './scrapers'
export type {
  ScraperAdapter,
  ScrapedTemplate,
  ScrapeOptions,
  ScraperCategory,
  IngestionResult,
  BatchIngestionResult,
} from './scrapers/types'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Map a raw Prisma row to our typed MarketplaceTemplate interface */
function toTemplate(row: Record<string, unknown>): MarketplaceTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? '',
    type: (row.type as TemplateType) ?? 'component',
    category: row.category as TemplateCategory,
    tags: (row.tags as string[]) ?? [],
    blocks: (row.blocks as Block[]) ?? [],
    jsx: (row.jsx as string | null) ?? null,
    thumbnail: (row.thumbnail as string | null) ?? null,
    previewUrl: (row.previewUrl as string | null) ?? null,
    source: (row.source as string) ?? 'custom',
    sourceUrl: (row.sourceUrl as string | null) ?? null,
    license: (row.license as string) ?? 'MIT',
    author: (row.author as string | null) ?? null,
    isPublished: (row.isPublished as boolean) ?? true,
    isFeatured: (row.isFeatured as boolean) ?? false,
    usageCount: (row.usageCount as number) ?? 0,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
  }
}

/** Build a Prisma `orderBy` clause from the sort parameter */
function buildOrderBy(sort?: MarketplaceFilter['sort']) {
  switch (sort) {
    case 'popular':
      return { usageCount: 'desc' as const }
    case 'name':
      return { name: 'asc' as const }
    case 'newest':
    default:
      return { createdAt: 'desc' as const }
  }
}

/** Validate that a category string is a known TemplateCategory */
function isValidCategory(cat: string): cat is TemplateCategory {
  return ALL_CATEGORIES.includes(cat as TemplateCategory)
}

/* ------------------------------------------------------------------ */
/*  READ operations                                                    */
/* ------------------------------------------------------------------ */

/**
 * List marketplace templates with filtering, search, and pagination.
 * Only returns published templates unless the caller explicitly requests otherwise.
 */
export async function getMarketplaceTemplates(
  filter: MarketplaceFilter = {}
): Promise<PaginatedTemplates> {
  const {
    type,
    category,
    search,
    tags,
    source,
    featured,
    page = 1,
    limit = 24,
    sort = 'newest',
  } = filter

  const where: Record<string, unknown> = {
    isPublished: true, // Public listing always shows published only
  }

  if (type) {
    where.type = type
  }

  if (category && isValidCategory(category)) {
    where.category = category
  }

  if (source) {
    where.source = source
  }

  if (featured !== undefined) {
    where.isFeatured = featured
  }

  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { hasSome: [search.toLowerCase()] } },
    ]
  }

  const skip = (page - 1) * limit
  const orderBy = buildOrderBy(sort)

  const [rows, total] = await Promise.all([
    (prisma as any).marketplaceTemplate.findMany({
      where,
      orderBy,
      take: limit,
      skip,
    }),
    (prisma as any).marketplaceTemplate.count({ where }),
  ])

  return {
    templates: (rows as Record<string, unknown>[]).map(toTemplate),
    total: total as number,
    page,
    limit,
    totalPages: Math.ceil((total as number) / limit),
  }
}

/**
 * Get a single marketplace template by its slug.
 * Returns null if not found or not published.
 */
export async function getMarketplaceTemplate(
  slug: string
): Promise<MarketplaceTemplate | null> {
  const row = await (prisma as any).marketplaceTemplate.findUnique({
    where: { slug },
  })

  if (!row || !(row as Record<string, unknown>).isPublished) {
    return null
  }

  return toTemplate(row as Record<string, unknown>)
}

/**
 * Get a single marketplace template by ID (admin — includes unpublished).
 */
export async function getMarketplaceTemplateById(
  id: string
): Promise<MarketplaceTemplate | null> {
  const row = await (prisma as any).marketplaceTemplate.findUnique({
    where: { id },
  })

  if (!row) return null

  return toTemplate(row as Record<string, unknown>)
}

/**
 * Get featured templates, optionally limited.
 */
export async function getFeaturedTemplates(
  limit: number = 12
): Promise<MarketplaceTemplate[]> {
  const rows = await (prisma as any).marketplaceTemplate.findMany({
    where: {
      isPublished: true,
      isFeatured: true,
    },
    orderBy: { usageCount: 'desc' },
    take: limit,
  })

  return (rows as Record<string, unknown>[]).map(toTemplate)
}

/**
 * Get all categories with their template counts.
 * Groups by (type, category) so the UI can show site vs component sections.
 */
export async function getTemplateCategories(): Promise<CategoryCount[]> {
  const groups = await (prisma as any).marketplaceTemplate.groupBy({
    by: ['type', 'category'],
    where: { isPublished: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  return (groups as Array<{
    type: string
    category: string
    _count: { id: number }
  }>).map((g) => ({
    type: g.type as TemplateType,
    category: g.category as TemplateCategory,
    count: g._count.id,
  }))
}

/**
 * Full-text search across name, description, and tags.
 * Searches published templates only.
 */
export async function searchTemplates(
  query: string,
  limit: number = 24
): Promise<MarketplaceTemplate[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const rows = await (prisma as any).marketplaceTemplate.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: trimmed, mode: 'insensitive' } },
        { description: { contains: trimmed, mode: 'insensitive' } },
        { tags: { hasSome: [trimmed.toLowerCase()] } },
        { source: { contains: trimmed, mode: 'insensitive' } },
        { author: { contains: trimmed, mode: 'insensitive' } },
      ],
    },
    orderBy: { usageCount: 'desc' },
    take: limit,
  })

  return (rows as Record<string, unknown>[]).map(toTemplate)
}

/* ------------------------------------------------------------------ */
/*  WRITE operations (admin / scraper)                                 */
/* ------------------------------------------------------------------ */

/**
 * Increment the usage count for a template (called when a user inserts it).
 */
export async function incrementUsageCount(id: string): Promise<void> {
  await (prisma as any).marketplaceTemplate.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
  })
}

/**
 * Create a new marketplace template.
 * Used by the admin UI or by automated scrapers.
 */
export async function createMarketplaceTemplate(
  data: CreateMarketplaceTemplateInput
): Promise<MarketplaceTemplate> {
  const row = await (prisma as any).marketplaceTemplate.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? '',
      type: data.type ?? 'component',
      category: data.category,
      tags: data.tags ?? [],
      blocks: data.blocks as unknown as any,
      jsx: data.jsx ?? null,
      thumbnail: data.thumbnail ?? null,
      previewUrl: data.previewUrl ?? null,
      source: data.source ?? 'custom',
      sourceUrl: data.sourceUrl ?? null,
      license: data.license ?? 'MIT',
      author: data.author ?? null,
      isPublished: data.isPublished ?? true,
      isFeatured: data.isFeatured ?? false,
    },
  })

  return toTemplate(row as Record<string, unknown>)
}

/**
 * Update an existing marketplace template.
 */
export async function updateMarketplaceTemplate(
  id: string,
  data: UpdateMarketplaceTemplateInput
): Promise<MarketplaceTemplate> {
  // Only include defined fields in the update payload
  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.description !== undefined) updateData.description = data.description
  if (data.type !== undefined) updateData.type = data.type
  if (data.category !== undefined) updateData.category = data.category
  if (data.tags !== undefined) updateData.tags = data.tags
  if (data.blocks !== undefined) updateData.blocks = data.blocks as unknown as any
  if (data.jsx !== undefined) updateData.jsx = data.jsx
  if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail
  if (data.previewUrl !== undefined) updateData.previewUrl = data.previewUrl
  if (data.source !== undefined) updateData.source = data.source
  if (data.sourceUrl !== undefined) updateData.sourceUrl = data.sourceUrl
  if (data.license !== undefined) updateData.license = data.license
  if (data.author !== undefined) updateData.author = data.author
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured

  const row = await (prisma as any).marketplaceTemplate.update({
    where: { id },
    data: updateData,
  })

  return toTemplate(row as Record<string, unknown>)
}

/**
 * Delete a marketplace template permanently.
 */
export async function deleteMarketplaceTemplate(id: string): Promise<void> {
  await (prisma as any).marketplaceTemplate.delete({
    where: { id },
  })
}

/**
 * Bulk upsert templates (useful for scrapers that re-import periodically).
 * Uses slug as the unique key for upserting.
 */
export async function upsertMarketplaceTemplates(
  templates: CreateMarketplaceTemplateInput[]
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  for (const data of templates) {
    const existing = await (prisma as any).marketplaceTemplate.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    })

    if (existing) {
      await (prisma as any).marketplaceTemplate.update({
        where: { slug: data.slug },
        data: {
          name: data.name,
          description: data.description ?? '',
          type: data.type ?? 'component',
          category: data.category,
          tags: data.tags ?? [],
          blocks: data.blocks as unknown as any,
          jsx: data.jsx ?? null,
          thumbnail: data.thumbnail ?? null,
          previewUrl: data.previewUrl ?? null,
          source: data.source ?? 'custom',
          sourceUrl: data.sourceUrl ?? null,
          license: data.license ?? 'MIT',
          author: data.author ?? null,
          isPublished: data.isPublished ?? true,
          isFeatured: data.isFeatured ?? false,
        },
      })
      updated++
    } else {
      await createMarketplaceTemplate(data)
      created++
    }
  }

  return { created, updated }
}
