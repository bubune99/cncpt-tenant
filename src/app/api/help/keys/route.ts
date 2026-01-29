/**
 * Help Keys API
 *
 * Provides discovery and management of help keys for AI tools.
 * GET: List all registered help keys with their status
 * POST: Register a new help key (for dynamic discovery)
 */

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import {
  helpKeyRegistry,
  getAllHelpKeys,
  getHelpKeysByCategory,
  getHelpCategories,
  getHelpKeysSummary,
} from '@/components/help-system/help-key-registry'
import { defaultHelpContent } from '@/components/help-system/default-content'

/**
 * GET /api/help/keys
 *
 * Query params:
 * - category: Filter by category
 * - withContent: Include content status (has default, has custom)
 * - missingOnly: Only return keys without custom content
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const withContent = searchParams.get('withContent') === 'true'
    const missingOnly = searchParams.get('missingOnly') === 'true'
    const storeId = searchParams.get('storeId')

    // Get base keys
    let keys = category
      ? getHelpKeysByCategory(category)
      : helpKeyRegistry

    // If we need content status, query the database
    if (withContent || missingOnly) {
      const allKeys = keys.map(k => k.key)

      // Get custom content from database
      const customContent = await db.helpContent.findMany({
        where: {
          elementKey: { in: allKeys },
          status: 'ACTIVE',
          ...(storeId ? { storeId } : {}),
        },
        select: {
          elementKey: true,
          title: true,
          updatedAt: true,
          createdBy: true,
        },
      })

      const customContentMap = new Map(
        customContent.map(c => [c.elementKey, c])
      )

      // Build enriched response
      const enrichedKeys = keys.map(keyDef => {
        const hasDefault = keyDef.key in defaultHelpContent
        const customData = customContentMap.get(keyDef.key)
        const hasCustom = !!customData

        return {
          ...keyDef,
          contentStatus: {
            hasDefault,
            hasCustom,
            customTitle: customData?.title,
            customUpdatedAt: customData?.updatedAt,
            customSource: customData?.createdBy,
          },
        }
      })

      // Filter to missing only if requested
      if (missingOnly) {
        const missingKeys = enrichedKeys.filter(
          k => !k.contentStatus.hasDefault && !k.contentStatus.hasCustom
        )
        return NextResponse.json({
          keys: missingKeys,
          total: missingKeys.length,
          categories: getHelpCategories(),
        })
      }

      return NextResponse.json({
        keys: enrichedKeys,
        total: enrichedKeys.length,
        categories: getHelpCategories(),
        summary: {
          withDefault: enrichedKeys.filter(k => k.contentStatus.hasDefault).length,
          withCustom: enrichedKeys.filter(k => k.contentStatus.hasCustom).length,
          missingBoth: enrichedKeys.filter(
            k => !k.contentStatus.hasDefault && !k.contentStatus.hasCustom
          ).length,
        },
      })
    }

    // Simple response without content status
    return NextResponse.json({
      keys,
      total: keys.length,
      categories: getHelpCategories(),
    })
  } catch (error) {
    console.error('[HelpKeys API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch help keys' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/help/keys
 *
 * Register a dynamically discovered help key.
 * This allows the system to track keys found at runtime.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, category, location, description } = body

    if (!key) {
      return NextResponse.json(
        { error: 'key is required' },
        { status: 400 }
      )
    }

    // Check if key already exists in registry
    const existingKey = helpKeyRegistry.find(k => k.key === key)
    if (existingKey) {
      return NextResponse.json({
        registered: true,
        existing: true,
        key: existingKey,
        message: 'Key already registered in static registry',
      })
    }

    // For now, we don't persist dynamic keys to database
    // but we could add a HelpKeyRegistry model if needed
    return NextResponse.json({
      registered: true,
      existing: false,
      key: {
        key,
        category: category || 'dynamic',
        location: location || 'Unknown',
        description: description || 'Dynamically discovered key',
      },
      message: 'Key noted but not in static registry. Consider adding to help-key-registry.ts',
    })
  } catch (error) {
    console.error('[HelpKeys API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to register help key' },
      { status: 500 }
    )
  }
}
