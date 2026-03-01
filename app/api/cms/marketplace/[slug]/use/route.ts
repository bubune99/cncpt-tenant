/**
 * Marketplace "Use Template" API
 *
 * POST /api/cms/marketplace/:slug/use
 *
 * Called when a user wants to insert a marketplace template into their page.
 * Increments the usage counter and returns the Block[] content for insertion.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getMarketplaceTemplate,
  incrementUsageCount,
} from '@/lib/cms/marketplace'
import {
  withAuth,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'

export const dynamic = 'force-dynamic'

export const POST = withAuth(
  async (
    request: NextRequest,
    _context: AuthContext,
    { params }: { params: Promise<{ slug: string }> }
  ) => {
    try {
      const { slug } = await params

      const template = await getMarketplaceTemplate(slug)

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      // Increment usage count in the background (fire-and-forget)
      incrementUsageCount(template.id).catch((err) => {
        console.error('Failed to increment usage count:', err)
      })

      return NextResponse.json({
        blocks: template.blocks,
        jsx: template.jsx,
        template: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          type: template.type,
          category: template.category,
          source: template.source,
          license: template.license,
        },
      })
    } catch (error) {
      console.error('Marketplace use error:', error)
      return NextResponse.json(
        { error: 'Failed to use template' },
        { status: 500 }
      )
    }
  }
)
