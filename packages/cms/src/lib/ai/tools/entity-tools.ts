/**
 * Entity Tools
 *
 * AI tools for fetching entity details and context-aware operations.
 * These tools allow the AI to understand what the user is viewing.
 */

import { tool } from 'ai'
import { z } from 'zod'

/**
 * Safe database import
 */
async function getDb() {
  try {
    const { default: db } = await import('../../db')
    return db
  } catch (error) {
    console.error('[EntityTools] Failed to import database:', error)
    throw new Error('Database connection unavailable')
  }
}

/**
 * Timeout wrapper
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}

/**
 * Entity types supported for fetching
 */
const entityTypeSchema = z.enum([
  'product',
  'order',
  'customer',
  'page',
  'blogPost',
  'workflow',
  'form',
  'media',
  'emailCampaign',
  'setting',
])

/**
 * Get Entity Details
 *
 * Fetches detailed information about an entity the user is viewing.
 * Use this for context-aware responses.
 */
export const getEntityDetails = tool({
  description: `Fetch details about an entity the user is viewing or asking about. Use this when:
- You need more context about what the user is looking at
- The user asks about a specific product, order, customer, etc.
- You want to provide entity-specific help or suggestions

Returns relevant fields based on entity type.`,
  inputSchema: z.object({
    entityType: entityTypeSchema.describe('Type of entity to fetch'),
    entityId: z.string().describe('ID of the entity'),
    includeRelated: z.boolean().optional().default(true).describe('Include related data (variants, items, etc.)'),
  }),
  execute: async ({ entityType, entityId, includeRelated }) => {
    try {
      const db = await getDb()

      const fetchers: Record<string, () => Promise<unknown>> = {
        product: () =>
          db.product.findUnique({
            where: { id: entityId },
            include: includeRelated
              ? {
                  variants: { take: 10 },
                  categories: true,
                  images: { take: 5 },
                }
              : undefined,
          }),

        order: () =>
          db.order.findUnique({
            where: { id: entityId },
            include: includeRelated
              ? {
                  items: { include: { product: true, variant: true } },
                  shipments: true,
                }
              : undefined,
          }),

        customer: () =>
          db.user.findUnique({
            where: { id: entityId },
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
              ...(includeRelated && {
                orders: {
                  take: 5,
                  orderBy: { createdAt: 'desc' as const },
                  select: { id: true, total: true, status: true, createdAt: true },
                },
              }),
            },
          }),

        page: () =>
          db.page.findUnique({
            where: { id: entityId },
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              updatedAt: true,
              // Exclude content JSON as it can be very large
            },
          }),

        blogPost: () =>
          db.blogPost.findUnique({
            where: { id: entityId },
            include: includeRelated
              ? {
                  categories: true,
                  tags: true,
                  author: { select: { id: true, name: true } },
                }
              : undefined,
          }),

        workflow: () =>
          db.workflow.findUnique({
            where: { id: entityId },
            // nodes and edges are JSON fields, not relations
          }),

        form: () =>
          db.form.findUnique({
            where: { id: entityId },
            // fields is a JSON field, not a relation
          }),

        media: () =>
          db.media.findUnique({
            where: { id: entityId },
          }),

        emailCampaign: () =>
          db.emailCampaign.findUnique({
            where: { id: entityId },
          }),

        setting: async () => {
          // Settings are key-value, entityId is the key
          const setting = await db.setting.findFirst({
            where: { key: entityId, tenantId: null },
          })
          return setting ? { key: setting.key, value: setting.value } : null
        },
      }

      const fetcher = fetchers[entityType]
      if (!fetcher) {
        return {
          success: false,
          error: `Unknown entity type: ${entityType}`,
        }
      }

      const entity = await withTimeout(fetcher(), 8000, `Timeout fetching ${entityType}`)

      if (!entity) {
        return {
          success: false,
          error: `${entityType} not found with ID: ${entityId}`,
        }
      }

      return {
        success: true,
        entityType,
        entityId,
        data: entity,
      }
    } catch (error) {
      console.error('[EntityTools] getEntityDetails error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

/**
 * Search Entities
 *
 * Search for entities by name, title, or other fields.
 * Useful when user mentions something by name rather than ID.
 */
export const searchEntities = tool({
  description: `Search for entities by name or title. Use this when:
- User mentions something by name (e.g., "the blue widget product")
- You need to find related entities
- Looking up entities for cross-referencing

Returns matching entities with basic info.`,
  inputSchema: z.object({
    entityType: entityTypeSchema.describe('Type of entity to search'),
    query: z.string().min(2).describe('Search query (name, title, etc.)'),
    limit: z.number().optional().default(5).describe('Max results to return'),
  }),
  execute: async ({ entityType, query, limit }) => {
    try {
      const db = await getDb()
      const searchQuery = `%${query}%`

      const searchers: Record<string, () => Promise<unknown[]>> = {
        product: () =>
          db.product.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, title: true, sku: true, basePrice: true },
            take: limit,
          }),

        order: () =>
          db.order.findMany({
            where: {
              OR: [
                { id: { contains: query } },
                { customer: { email: { contains: query, mode: 'insensitive' } } },
              ],
            },
            select: { id: true, status: true, total: true, createdAt: true },
            take: limit,
          }),

        customer: () =>
          db.user.findMany({
            where: {
              OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, email: true, name: true },
            take: limit,
          }),

        page: () =>
          db.page.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, title: true, slug: true, status: true },
            take: limit,
          }),

        blogPost: () =>
          db.blogPost.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, title: true, slug: true, status: true },
            take: limit,
          }),

        workflow: () =>
          db.workflow.findMany({
            where: {
              name: { contains: query, mode: 'insensitive' },
            },
            select: { id: true, name: true, slug: true },
            take: limit,
          }),

        form: () =>
          db.form.findMany({
            where: {
              name: { contains: query, mode: 'insensitive' },
            },
            select: { id: true, name: true },
            take: limit,
          }),

        media: () =>
          db.media.findMany({
            where: {
              OR: [
                { filename: { contains: query, mode: 'insensitive' } },
                { alt: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, filename: true, url: true, mimeType: true },
            take: limit,
          }),

        emailCampaign: () =>
          db.emailCampaign.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { subject: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, name: true, subject: true, status: true },
            take: limit,
          }),

        setting: () =>
          db.setting.findMany({
            where: {
              key: { contains: query, mode: 'insensitive' },
            },
            select: { key: true },
            take: limit,
          }),
      }

      const searcher = searchers[entityType]
      if (!searcher) {
        return {
          success: false,
          error: `Unknown entity type: ${entityType}`,
          results: [],
        }
      }

      const results = await withTimeout(searcher(), 5000, 'Search timed out')

      return {
        success: true,
        entityType,
        query,
        count: results.length,
        results,
      }
    } catch (error) {
      console.error('[EntityTools] searchEntities error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
      }
    }
  },
})

/**
 * Get Entity Stats
 *
 * Get aggregate statistics for an entity type.
 * Useful for dashboard-style questions.
 */
export const getEntityStats = tool({
  description: `Get aggregate statistics for an entity type. Use this when:
- User asks about counts, totals, or trends
- Providing overview information
- Answering "how many" questions

Returns counts and basic aggregates.`,
  inputSchema: z.object({
    entityType: z.enum(['product', 'order', 'customer', 'page', 'blogPost']).describe('Entity type'),
    filters: z
      .object({
        status: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
      .optional()
      .describe('Optional filters'),
  }),
  execute: async ({ entityType, filters }) => {
    try {
      const db = await getDb()

      const dateFilter = filters?.dateFrom || filters?.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
              ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
            },
          }
        : {}

      const statsFetchers: Record<string, () => Promise<unknown>> = {
        product: async () => {
          const [total, active, outOfStock] = await Promise.all([
            db.product.count({ where: dateFilter }),
            db.product.count({ where: { ...dateFilter, status: 'ACTIVE' } }),
            db.product.count({ where: { ...dateFilter, stock: { lte: 0 } } }),
          ])
          return { total, active, outOfStock }
        },

        order: async () => {
          const [total, pending, delivered, totalRevenue] = await Promise.all([
            db.order.count({ where: dateFilter }),
            db.order.count({ where: { ...dateFilter, status: 'PENDING' } }),
            db.order.count({ where: { ...dateFilter, status: 'DELIVERED' } }),
            db.order.aggregate({ where: dateFilter, _sum: { total: true } }),
          ])
          return {
            total,
            pending,
            delivered,
            totalRevenue: totalRevenue._sum.total || 0,
          }
        },

        customer: async () => {
          const total = await db.user.count({ where: dateFilter })
          return { total }
        },

        page: async () => {
          const [total, published, draft] = await Promise.all([
            db.page.count({ where: dateFilter }),
            db.page.count({ where: { ...dateFilter, status: 'PUBLISHED' } }),
            db.page.count({ where: { ...dateFilter, status: 'DRAFT' } }),
          ])
          return { total, published, draft }
        },

        blogPost: async () => {
          const [total, published, draft] = await Promise.all([
            db.blogPost.count({ where: dateFilter }),
            db.blogPost.count({ where: { ...dateFilter, status: 'PUBLISHED' } }),
            db.blogPost.count({ where: { ...dateFilter, status: 'DRAFT' } }),
          ])
          return { total, published, draft }
        },
      }

      const fetcher = statsFetchers[entityType]
      if (!fetcher) {
        return { success: false, error: `Stats not available for: ${entityType}` }
      }

      const stats = await withTimeout(fetcher(), 5000, 'Stats query timed out')

      return {
        success: true,
        entityType,
        filters,
        stats,
      }
    } catch (error) {
      console.error('[EntityTools] getEntityStats error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

/**
 * All entity tools
 */
export const entityTools = {
  getEntityDetails,
  searchEntities,
  getEntityStats,
}
