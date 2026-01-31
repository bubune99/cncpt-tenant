/**
 * Help Management Tools
 *
 * AI tools for managing help content lifecycle:
 * - Scanning for missing help content
 * - Batch generating help for new elements
 * - Managing orphaned content
 * - Archival and deletion protocols
 */

import { tool } from 'ai'
import { z } from 'zod'
import { emitHelpContentUpdate } from './help-notification'

/**
 * Timeout wrapper for async operations
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
 * Safe database import
 */
async function getDb() {
  try {
    const { default: db } = await import('../../db')
    return db
  } catch (error) {
    console.error('[HelpManagement] Failed to import database:', error)
    throw new Error('Database connection unavailable')
  }
}

/**
 * List Available Help Keys
 *
 * Returns all registered help keys from the registry.
 * Use this to discover what help content can be created/updated.
 */
export const listHelpKeys = tool({
  description: `List all registered help keys in the system. Use this when:
- You need to know what help keys exist
- Before creating or updating help content
- To check coverage of help documentation
- To find the correct key name for an element

Returns all keys organized by category with their content status.`,
  inputSchema: z.object({
    category: z.string().optional().describe('Filter by category (e.g., "sidebar", "dashboard", "products")'),
    missingOnly: z.boolean().optional().describe('Only return keys without custom content'),
  }),
  execute: async ({ category, missingOnly }) => {
    try {
      const { helpKeyRegistry, getHelpCategories } = await import('@/components/cms/help-system/help-key-registry')
      const { defaultHelpContent } = await import('@/components/cms/help-system/default-content')
      const db = await getDb()

      // Filter by category if specified
      let keys = category
        ? helpKeyRegistry.filter(k => k.category === category)
        : helpKeyRegistry

      // Get custom content from database
      const allKeys = keys.map(k => k.key)
      const customContent = await withTimeout(
        db.helpContent.findMany({
          where: {
            elementKey: { in: allKeys },
            status: 'ACTIVE',
          },
          select: {
            elementKey: true,
            title: true,
            createdBy: true,
          },
        }),
        5000,
        'Database query timed out'
      )

      const customContentMap = new Map(
        customContent.map(c => [c.elementKey, c])
      )

      // Build enriched response
      const enrichedKeys = keys.map(keyDef => {
        const hasDefault = keyDef.key in defaultHelpContent
        const customData = customContentMap.get(keyDef.key)
        const hasCustom = !!customData

        return {
          key: keyDef.key,
          category: keyDef.category,
          location: keyDef.location,
          description: keyDef.description,
          hasDefaultContent: hasDefault,
          hasCustomContent: hasCustom,
          customSource: customData?.createdBy,
        }
      })

      // Filter to missing only if requested
      const finalKeys = missingOnly
        ? enrichedKeys.filter(k => !k.hasDefaultContent && !k.hasCustomContent)
        : enrichedKeys

      return {
        action: 'list_help_keys',
        total: finalKeys.length,
        categories: getHelpCategories(),
        keys: finalKeys,
        summary: {
          totalRegistered: helpKeyRegistry.length,
          withDefault: enrichedKeys.filter(k => k.hasDefaultContent).length,
          withCustom: enrichedKeys.filter(k => k.hasCustomContent).length,
          missingBoth: enrichedKeys.filter(k => !k.hasDefaultContent && !k.hasCustomContent).length,
        },
        message: `Found ${finalKeys.length} help key(s)${category ? ` in category "${category}"` : ''}.`,
      }
    } catch (error) {
      console.error('[HelpManagement] listHelpKeys error:', error)
      return {
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to list help keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Scan for Missing Help Content
 *
 * AI reports elements that need help content created.
 * Used when new features are added or for auditing coverage.
 */
export const scanForMissingHelp = tool({
  description: `Report UI elements that are missing help content. Use this when:
- Auditing help coverage for a page or section
- New features have been added that need documentation
- User reports confusion about undocumented elements

Returns a list of element keys that need help content created.`,
  inputSchema: z.object({
    elementKeys: z.array(z.string()).min(1).describe('List of element keys found on the current page'),
    context: z.string().optional().describe('Context about where these elements are (e.g., "Products page", "Order details")'),
  }),
  execute: async ({ elementKeys, context }) => {
    try {
      const db = await getDb()

      // Find which elements already have help content
      const existingContent = await withTimeout(
        db.helpContent.findMany({
          where: {
            elementKey: { in: elementKeys },
            status: 'ACTIVE',
          },
          select: { elementKey: true },
        }),
        5000,
        'Database query timed out'
      )

      const existingKeys = new Set(existingContent.map(c => c.elementKey))
      const missingKeys = elementKeys.filter(key => !existingKeys.has(key))

      // Check default content as fallback
      const { defaultHelpContent } = await import('@/components/cms/help-system/default-content')
      const missingWithNoDefault = missingKeys.filter(key => !defaultHelpContent[key])

      return {
        action: 'scan_complete',
        context,
        total: elementKeys.length,
        withHelp: existingKeys.size,
        missingHelp: missingKeys.length,
        missingWithNoDefault: missingWithNoDefault.length,
        missingKeys: missingWithNoDefault,
        coverage: Math.round((existingKeys.size / elementKeys.length) * 100),
        message: missingWithNoDefault.length > 0
          ? `Found ${missingWithNoDefault.length} element(s) without any help content. Would you like me to generate help for them?`
          : `All ${elementKeys.length} elements have help content.`,
      }
    } catch (error) {
      console.error('[HelpManagement] scanForMissingHelp error:', error)
      return {
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to scan for missing help: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Batch Generate Help Content
 *
 * AI generates help content for multiple elements at once.
 * Efficient for documenting new features or filling gaps.
 */
export const batchGenerateHelp = tool({
  description: `Generate help content for multiple UI elements at once. Use this when:
- Multiple new elements need documentation
- Filling coverage gaps after a scan
- Documenting a new feature with several components

Creates help entries in the database for all provided elements.`,
  inputSchema: z.object({
    entries: z.array(z.object({
      elementKey: z.string().describe('Unique key for the element'),
      title: z.string().describe('Short title'),
      summary: z.string().describe('One-line description'),
      details: z.string().optional().describe('Full explanation (markdown)'),
      relatedKeys: z.array(z.string()).optional().describe('Related element keys'),
    })).min(1).max(20).describe('Help entries to create (max 20 at a time)'),
    context: z.string().optional().describe('Context about this batch (e.g., "New product editor fields")'),
  }),
  execute: async ({ entries, context }) => {
    try {
      const db = await getDb()

      const results: { key: string; status: 'created' | 'updated' | 'error'; error?: string }[] = []

      for (const entry of entries) {
        try {
          // Check if exists
          const existing = await withTimeout(
            db.helpContent.findFirst({
              where: {
                elementKey: entry.elementKey,
                storeId: null,
              },
            }),
            2000,
            'Timeout checking existing'
          )

          if (existing) {
            // Update existing
            await withTimeout(
              db.helpContent.update({
                where: { id: existing.id },
                data: {
                  title: entry.title,
                  summary: entry.summary,
                  details: entry.details,
                  relatedKeys: entry.relatedKeys || [],
                  createdBy: 'AI',
                  status: 'ACTIVE',
                  lastVerifiedAt: new Date(),
                },
              }),
              2000,
              'Timeout updating'
            )
            results.push({ key: entry.elementKey, status: 'updated' })

            // Notify clients
            await emitHelpContentUpdate({
              elementKey: entry.elementKey,
              action: 'updated',
              title: entry.title,
              summary: entry.summary,
              source: 'ai',
            })
          } else {
            // Create new
            await withTimeout(
              db.helpContent.create({
                data: {
                  elementKey: entry.elementKey,
                  title: entry.title,
                  summary: entry.summary,
                  details: entry.details,
                  relatedKeys: entry.relatedKeys || [],
                  createdBy: 'AI',
                  status: 'ACTIVE',
                  lastVerifiedAt: new Date(),
                },
              }),
              2000,
              'Timeout creating'
            )
            results.push({ key: entry.elementKey, status: 'created' })

            // Notify clients
            await emitHelpContentUpdate({
              elementKey: entry.elementKey,
              action: 'created',
              title: entry.title,
              summary: entry.summary,
              source: 'ai',
            })
          }
        } catch (entryError) {
          results.push({
            key: entry.elementKey,
            status: 'error',
            error: entryError instanceof Error ? entryError.message : 'Unknown error',
          })
        }
      }

      const created = results.filter(r => r.status === 'created').length
      const updated = results.filter(r => r.status === 'updated').length
      const errors = results.filter(r => r.status === 'error').length

      return {
        action: 'batch_complete',
        context,
        total: entries.length,
        created,
        updated,
        errors,
        results,
        message: `Help content batch complete: ${created} created, ${updated} updated${errors > 0 ? `, ${errors} errors` : ''}.`,
      }
    } catch (error) {
      console.error('[HelpManagement] batchGenerateHelp error:', error)
      return {
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to batch generate help: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Review Orphaned Help Content
 *
 * Lists help content that may be orphaned (element no longer exists).
 * Used for maintenance and cleanup.
 */
export const reviewOrphanedHelp = tool({
  description: `Review help content that may be orphaned (source element removed). Use this when:
- Performing maintenance on help content
- After removing features or UI elements
- Auditing content quality

Returns orphaned content that needs review for archival or restoration.`,
  inputSchema: z.object({
    status: z.enum(['ORPHANED', 'ARCHIVED', 'DELETED', 'ALL']).optional().default('ORPHANED'),
    limit: z.number().optional().default(50),
  }),
  execute: async ({ status, limit }) => {
    try {
      const db = await getDb()

      const reviewStatuses: ('ORPHANED' | 'ARCHIVED' | 'DELETED')[] = ['ORPHANED', 'ARCHIVED', 'DELETED']
      const whereClause = status === 'ALL'
        ? { status: { in: reviewStatuses } }
        : { status: status as 'ORPHANED' | 'ARCHIVED' | 'DELETED' }

      const content = await withTimeout(
        db.helpContent.findMany({
          where: whereClause,
          select: {
            id: true,
            elementKey: true,
            title: true,
            summary: true,
            status: true,
            createdBy: true,
            orphanedAt: true,
            archiveReason: true,
            updatedAt: true,
          },
          orderBy: { orphanedAt: 'desc' },
          take: Math.min(limit ?? 50, 100),
        }),
        5000,
        'Database query timed out'
      )

      return {
        action: 'review_complete',
        status,
        count: content.length,
        content: content.map(c => ({
          id: c.id,
          elementKey: c.elementKey,
          title: c.title,
          summary: c.summary,
          status: c.status,
          createdBy: c.createdBy,
          orphanedAt: c.orphanedAt,
          archiveReason: c.archiveReason,
          daysSinceOrphaned: c.orphanedAt
            ? Math.floor((Date.now() - c.orphanedAt.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        })),
        message: content.length > 0
          ? `Found ${content.length} ${status?.toLowerCase() || 'orphaned'} help entries. Would you like to archive, restore, or delete any?`
          : `No ${status?.toLowerCase() || 'orphaned'} help content found.`,
      }
    } catch (error) {
      console.error('[HelpManagement] reviewOrphanedHelp error:', error)
      return {
        action: 'error',
        count: 0,
        content: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to review orphaned help: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Mark Help Content as Orphaned
 *
 * Marks help content as orphaned when the source element is removed.
 * Part of the deletion protocol - soft delete before permanent removal.
 */
export const markHelpOrphaned = tool({
  description: `Mark help content as orphaned when its source element is removed. Use this when:
- A feature or UI element has been removed
- Cleaning up after feature deprecation
- Part of the deletion protocol (soft delete first)

Orphaned content is preserved for review before permanent deletion.`,
  inputSchema: z.object({
    elementKeys: z.array(z.string()).min(1).describe('Element keys to mark as orphaned'),
    reason: z.string().optional().describe('Reason for orphaning'),
  }),
  execute: async ({ elementKeys, reason }) => {
    try {
      const db = await getDb()

      const result = await withTimeout(
        db.helpContent.updateMany({
          where: {
            elementKey: { in: elementKeys },
            status: 'ACTIVE',
          },
          data: {
            status: 'ORPHANED',
            orphanedAt: new Date(),
            archiveReason: reason || 'Source element removed',
          },
        }),
        5000,
        'Database update timed out'
      )

      return {
        action: 'marked_orphaned',
        count: result.count,
        elementKeys,
        reason,
        message: `Marked ${result.count} help entries as orphaned. They will be preserved for ${30} days before review.`,
      }
    } catch (error) {
      console.error('[HelpManagement] markHelpOrphaned error:', error)
      return {
        action: 'error',
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to mark help as orphaned: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Archive or Restore Help Content
 *
 * Changes the status of help content for lifecycle management.
 */
export const manageHelpStatus = tool({
  description: `Change the status of help content. Use this for:
- Archiving old content that's no longer needed
- Restoring orphaned content that's still relevant
- Soft deleting content marked for removal
- Reactivating archived content

This is the primary lifecycle management tool.`,
  inputSchema: z.object({
    action: z.enum(['archive', 'restore', 'delete', 'activate']).describe('Action to perform'),
    contentIds: z.array(z.string()).optional().describe('Specific content IDs to update'),
    elementKeys: z.array(z.string()).optional().describe('Element keys to update'),
    reason: z.string().optional().describe('Reason for the status change'),
  }),
  execute: async ({ action, contentIds, elementKeys, reason }) => {
    try {
      if (!contentIds?.length && !elementKeys?.length) {
        return {
          action: 'error',
          message: 'Must provide either contentIds or elementKeys',
        }
      }

      const db = await getDb()

      const statusMap = {
        archive: 'ARCHIVED',
        restore: 'ACTIVE',
        delete: 'DELETED',
        activate: 'ACTIVE',
      } as const

      const newStatus = statusMap[action]

      const whereClause = contentIds?.length
        ? { id: { in: contentIds } }
        : { elementKey: { in: elementKeys! } }

      const result = await withTimeout(
        db.helpContent.updateMany({
          where: whereClause,
          data: {
            status: newStatus,
            archiveReason: action === 'archive' || action === 'delete' ? reason : null,
            orphanedAt: action === 'restore' || action === 'activate' ? null : undefined,
            lastVerifiedAt: action === 'restore' || action === 'activate' ? new Date() : undefined,
          },
        }),
        5000,
        'Database update timed out'
      )

      const actionPastTense = {
        archive: 'archived',
        restore: 'restored',
        delete: 'soft deleted',
        activate: 'activated',
      }[action]

      return {
        action: `status_${action}`,
        count: result.count,
        newStatus,
        reason,
        message: `Successfully ${actionPastTense} ${result.count} help content entries.`,
      }
    } catch (error) {
      console.error('[HelpManagement] manageHelpStatus error:', error)
      return {
        action: 'error',
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to update help status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Purge Deleted Help Content
 *
 * Permanently removes soft-deleted content older than specified days.
 * Part of the cleanup protocol.
 */
export const purgeDeletedHelp = tool({
  description: `Permanently remove soft-deleted help content older than specified days. Use this when:
- Running maintenance cleanup
- Reclaiming database space
- Finalizing deletion of reviewed content

This is a PERMANENT action and cannot be undone.`,
  inputSchema: z.object({
    olderThanDays: z.number().min(1).default(30).describe('Only purge content deleted more than this many days ago'),
    dryRun: z.boolean().optional().default(true).describe('If true, only report what would be deleted'),
  }),
  execute: async ({ olderThanDays, dryRun }) => {
    try {
      const db = await getDb()
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)

      // Count eligible content
      const eligibleCount = await withTimeout(
        db.helpContent.count({
          where: {
            status: 'DELETED',
            updatedAt: { lt: cutoffDate },
          },
        }),
        3000,
        'Count query timed out'
      )

      if (dryRun) {
        return {
          action: 'dry_run',
          eligibleCount,
          cutoffDate: cutoffDate.toISOString(),
          message: `Found ${eligibleCount} deleted help entries older than ${olderThanDays} days. Run with dryRun=false to permanently delete.`,
        }
      }

      // Actually delete
      const result = await withTimeout(
        db.helpContent.deleteMany({
          where: {
            status: 'DELETED',
            updatedAt: { lt: cutoffDate },
          },
        }),
        10000,
        'Delete operation timed out'
      )

      return {
        action: 'purged',
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
        message: `Permanently deleted ${result.count} help content entries older than ${olderThanDays} days.`,
      }
    } catch (error) {
      console.error('[HelpManagement] purgeDeletedHelp error:', error)
      return {
        action: 'error',
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to purge deleted help: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Generate Help for Dynamic Entity
 *
 * Creates contextual help content for a specific record (product, order, etc.).
 * This is the key tool for tribal knowledge on dynamic data.
 */
export const generateEntityHelp = tool({
  description: `Generate help content for a specific entity (product, order, page, etc.). Use this when:
- Explaining something unique about a specific record
- Adding tribal knowledge to individual items
- Creating context-specific documentation

The help is linked to both the element and the specific entity.`,
  inputSchema: z.object({
    elementKey: z.string().describe('The UI element key'),
    entityType: z.string().describe('Type of entity (Product, Order, Page, etc.)'),
    entityId: z.string().describe('ID of the specific entity'),
    title: z.string().describe('Title for this contextual help'),
    summary: z.string().describe('Brief summary'),
    details: z.string().optional().describe('Full explanation with context'),
    tips: z.array(z.string()).optional().describe('Actionable tips'),
  }),
  execute: async ({ elementKey, entityType, entityId, title, summary, details, tips }) => {
    try {
      const db = await getDb()

      // Create a unique key for this entity-specific help
      const entityElementKey = `${elementKey}:${entityType.toLowerCase()}:${entityId}`

      // Check if exists
      const existing = await withTimeout(
        db.helpContent.findFirst({
          where: {
            elementKey: entityElementKey,
            storeId: null,
          },
        }),
        2000,
        'Timeout checking existing'
      )

      const fullDetails = tips?.length
        ? `${details || ''}\n\n**Tips:**\n${tips.map(t => `- ${t}`).join('\n')}`
        : details

      const content = existing
        ? await withTimeout(
            db.helpContent.update({
              where: { id: existing.id },
              data: {
                title,
                summary,
                details: fullDetails,
                entityType,
                entityId,
                createdBy: 'AI',
                status: 'ACTIVE',
                lastVerifiedAt: new Date(),
              },
            }),
            2000,
            'Timeout updating'
          )
        : await withTimeout(
            db.helpContent.create({
              data: {
                elementKey: entityElementKey,
                title,
                summary,
                details: fullDetails,
                entityType,
                entityId,
                relatedKeys: [elementKey], // Link to base element
                createdBy: 'AI',
                status: 'ACTIVE',
                lastVerifiedAt: new Date(),
              },
            }),
            2000,
            'Timeout creating'
          )

      // Notify clients
      await emitHelpContentUpdate({
        elementKey: entityElementKey,
        action: existing ? 'updated' : 'created',
        title,
        summary,
        source: 'ai',
      })

      return {
        action: existing ? 'updated' : 'created',
        contentId: content.id,
        elementKey: entityElementKey,
        entityType,
        entityId,
        message: `${existing ? 'Updated' : 'Created'} contextual help for ${entityType} ${entityId}.`,
      }
    } catch (error) {
      console.error('[HelpManagement] generateEntityHelp error:', error)
      return {
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to generate entity help: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Get Help Content
 *
 * Read existing help content for an element.
 * Use this BEFORE updating to understand current state.
 */
export const getHelpContent = tool({
  description: `Read existing help content for an element key. Use this BEFORE updating help to:
- Understand what content already exists
- See who created it (SYSTEM, MANUAL, AI)
- Check entity-specific variants
- Review before making changes

Always read before writing to avoid overwriting good content.`,
  inputSchema: z.object({
    elementKey: z.string().describe('The help key to read'),
    includeEntityContent: z.boolean().optional().default(false).describe('Include entity-specific variants'),
    storeId: z.string().optional().describe('Store ID for multi-tenant content'),
  }),
  execute: async ({ elementKey, includeEntityContent, storeId }) => {
    try {
      const db = await getDb()

      // Get base content
      const content = await withTimeout(
        db.helpContent.findFirst({
          where: {
            elementKey,
            status: 'ACTIVE',
            storeId: storeId || null,
          },
        }),
        3000,
        'Timeout fetching content'
      )

      // Get entity-specific content if requested
      let entityContent: Array<{
        elementKey: string
        entityType: string | null
        entityId: string | null
        title: string
        summary: string
      }> = []

      if (includeEntityContent) {
        entityContent = await withTimeout(
          db.helpContent.findMany({
            where: {
              elementKey: { startsWith: `${elementKey}:` },
              status: 'ACTIVE',
            },
            select: {
              elementKey: true,
              entityType: true,
              entityId: true,
              title: true,
              summary: true,
            },
            take: 10,
          }),
          3000,
          'Timeout fetching entity content'
        )
      }

      // Get registry info for context
      let keyDefinition = null
      try {
        const { helpKeyRegistry } = await import('@/components/cms/help-system/help-key-registry')
        keyDefinition = helpKeyRegistry.find((k) => k.key === elementKey) || null
      } catch {
        // Registry not available
      }

      // Check default content
      let hasDefaultContent = false
      try {
        const { defaultHelpContent } = await import('@/components/cms/help-system/default-content')
        hasDefaultContent = elementKey in defaultHelpContent
      } catch {
        // Defaults not available
      }

      return {
        action: 'read',
        elementKey,
        exists: !!content,
        hasDefaultContent,
        content: content
          ? {
              id: content.id,
              title: content.title,
              summary: content.summary,
              details: content.details,
              mediaUrl: content.mediaUrl,
              mediaType: content.mediaType,
              relatedKeys: content.relatedKeys,
              createdBy: content.createdBy,
              lastVerifiedAt: content.lastVerifiedAt,
              updatedAt: content.updatedAt,
            }
          : null,
        keyDefinition,
        entityVariantCount: entityContent.length,
        entityVariants: entityContent,
        message: content
          ? `Found help content for "${elementKey}" (created by ${content.createdBy}).`
          : hasDefaultContent
            ? `No custom content for "${elementKey}", but default content exists.`
            : `No help content found for "${elementKey}".`,
      }
    } catch (error) {
      console.error('[HelpManagement] getHelpContent error:', error)
      return {
        action: 'error',
        elementKey,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to read help content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Update Help Content
 *
 * Update help content for a single element.
 * More efficient than batch for single updates.
 */
export const updateHelpContent = tool({
  description: `Update help content for a single element. Use this when:
- Making targeted edits to existing content
- Creating new help for a specific element
- More efficient than batch for single updates

Supports partial updates - only specify fields you want to change.`,
  inputSchema: z.object({
    elementKey: z.string().describe('The help key to update'),
    title: z.string().optional().describe('New title (required for new content)'),
    summary: z.string().optional().describe('New summary (required for new content)'),
    details: z.string().optional().describe('New details (markdown supported)'),
    mediaUrl: z.string().optional().describe('URL to help media (video/image)'),
    mediaType: z.enum(['VIDEO', 'IMAGE', 'LOTTIE']).optional().describe('Type of media'),
    relatedKeys: z.array(z.string()).optional().describe('Related help keys'),
    storeId: z.string().optional().describe('Store ID for multi-tenant content'),
  }),
  execute: async ({ elementKey, title, summary, details, mediaUrl, mediaType, relatedKeys, storeId }) => {
    try {
      const db = await getDb()

      // Check if content exists
      const existing = await withTimeout(
        db.helpContent.findFirst({
          where: {
            elementKey,
            storeId: storeId || null,
          },
        }),
        2000,
        'Timeout checking existing'
      )

      if (existing) {
        // Update existing - only update provided fields
        const updateData: Record<string, unknown> = {
          createdBy: 'AI',
          lastVerifiedAt: new Date(),
        }

        if (title !== undefined) updateData.title = title
        if (summary !== undefined) updateData.summary = summary
        if (details !== undefined) updateData.details = details
        if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl
        if (mediaType !== undefined) updateData.mediaType = mediaType
        if (relatedKeys !== undefined) updateData.relatedKeys = relatedKeys

        // Reactivate if it was orphaned/archived
        if (existing.status !== 'ACTIVE') {
          updateData.status = 'ACTIVE'
          updateData.orphanedAt = null
          updateData.archiveReason = null
        }

        const updated = await withTimeout(
          db.helpContent.update({
            where: { id: existing.id },
            data: updateData,
          }),
          2000,
          'Timeout updating'
        )

        // Notify clients of the update
        await emitHelpContentUpdate({
          elementKey,
          action: 'updated',
          title: title || existing.title,
          summary: summary || existing.summary,
          source: 'ai',
        })

        return {
          action: 'updated',
          contentId: updated.id,
          elementKey,
          previousSource: existing.createdBy,
          message: `Updated help content for "${elementKey}".`,
        }
      } else {
        // Create new - require title and summary
        if (!title || !summary) {
          return {
            action: 'error',
            elementKey,
            error: 'Title and summary are required when creating new help content',
            message: 'Cannot create help content without title and summary.',
          }
        }

        const created = await withTimeout(
          db.helpContent.create({
            data: {
              elementKey,
              title,
              summary,
              details,
              mediaUrl,
              mediaType,
              relatedKeys: relatedKeys || [],
              storeId: storeId || null,
              createdBy: 'AI',
              status: 'ACTIVE',
              lastVerifiedAt: new Date(),
            },
          }),
          2000,
          'Timeout creating'
        )

        // Notify clients of the new content
        await emitHelpContentUpdate({
          elementKey,
          action: 'created',
          title,
          summary,
          source: 'ai',
        })

        return {
          action: 'created',
          contentId: created.id,
          elementKey,
          message: `Created new help content for "${elementKey}".`,
        }
      }
    } catch (error) {
      console.error('[HelpManagement] updateHelpContent error:', error)
      return {
        action: 'error',
        elementKey,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to update help content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * All help management tools
 */
export const helpManagementTools = {
  listHelpKeys,
  getHelpContent,
  updateHelpContent,
  scanForMissingHelp,
  batchGenerateHelp,
  reviewOrphanedHelp,
  markHelpOrphaned,
  manageHelpStatus,
  purgeDeletedHelp,
  generateEntityHelp,
}
