/**
 * Marketplace API
 *
 * GET  /api/cms/marketplace — List templates (public, filtered, paginated)
 * POST /api/cms/marketplace — Create a new template (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getMarketplaceTemplates,
  getFeaturedTemplates,
  getTemplateCategories,
  createMarketplaceTemplate,
} from '@/lib/cms/marketplace'
import type {
  TemplateType,
  TemplateCategory,
  MarketplaceFilter,
} from '@/lib/cms/marketplace/types'
import { ALL_CATEGORIES } from '@/lib/cms/marketplace/types'
import {
  withAuth,
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/cms/permissions'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET — Public listing (any authenticated user)
// ---------------------------------------------------------------------------
export const GET = withAuth(
  async (request: NextRequest, _context: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url)

      // Special mode: return category counts
      if (searchParams.get('categories') === 'true') {
        const categories = await getTemplateCategories()
        return NextResponse.json({ categories })
      }

      // Special mode: return featured templates
      if (searchParams.get('featured') === 'true') {
        const limit = parseInt(searchParams.get('limit') || '12')
        const templates = await getFeaturedTemplates(limit)
        return NextResponse.json({ templates, total: templates.length })
      }

      // Build filter from query params
      const filter: MarketplaceFilter = {}

      const type = searchParams.get('type')
      if (type === 'site' || type === 'component') {
        filter.type = type as TemplateType
      }

      const category = searchParams.get('category')
      if (category && ALL_CATEGORIES.includes(category as TemplateCategory)) {
        filter.category = category as TemplateCategory
      }

      const search = searchParams.get('search')
      if (search) {
        filter.search = search
      }

      const tags = searchParams.get('tags')
      if (tags) {
        filter.tags = tags.split(',').map((t) => t.trim()).filter(Boolean)
      }

      const source = searchParams.get('source')
      if (source) {
        filter.source = source
      }

      const sort = searchParams.get('sort')
      if (sort === 'popular' || sort === 'newest' || sort === 'name') {
        filter.sort = sort
      }

      const page = parseInt(searchParams.get('page') || '1')
      filter.page = Math.max(1, page)

      const limit = parseInt(searchParams.get('limit') || '24')
      filter.limit = Math.min(100, Math.max(1, limit))

      const result = await getMarketplaceTemplates(filter)

      return NextResponse.json(result)
    } catch (error) {
      console.error('Marketplace GET error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch marketplace templates' },
        { status: 500 }
      )
    }
  }
)

// ---------------------------------------------------------------------------
// POST — Create a template (admin only, requires pages.create permission)
// ---------------------------------------------------------------------------
export const POST = withPermission(
  PERMISSIONS.PAGES_CREATE,
  async (request: NextRequest, context: AuthContext) => {
    try {
      const body = await request.json()

      // Validate required fields
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json(
          { error: 'name is required' },
          { status: 400 }
        )
      }

      if (!body.slug || typeof body.slug !== 'string') {
        return NextResponse.json(
          { error: 'slug is required' },
          { status: 400 }
        )
      }

      if (!body.category || !ALL_CATEGORIES.includes(body.category)) {
        return NextResponse.json(
          { error: 'category is required and must be a valid category' },
          { status: 400 }
        )
      }

      if (!body.blocks || !Array.isArray(body.blocks)) {
        return NextResponse.json(
          { error: 'blocks is required and must be an array' },
          { status: 400 }
        )
      }

      // Validate slug format (kebab-case, no special chars)
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) {
        return NextResponse.json(
          { error: 'slug must be kebab-case (lowercase letters, numbers, hyphens)' },
          { status: 400 }
        )
      }

      const template = await createMarketplaceTemplate({
        name: body.name,
        slug: body.slug,
        description: body.description,
        type: body.type,
        category: body.category,
        tags: body.tags,
        blocks: body.blocks,
        jsx: body.jsx,
        thumbnail: body.thumbnail,
        previewUrl: body.previewUrl,
        source: body.source,
        sourceUrl: body.sourceUrl,
        license: body.license,
        author: body.author,
        isPublished: body.isPublished,
        isFeatured: body.isFeatured,
      })

      // Audit log
      await logAuditEvent({
        userId: context.user.id,
        action: 'marketplace_template.create',
        targetType: 'marketplace_template',
        targetId: template.id,
        details: { name: template.name, slug: template.slug },
      }).catch(() => {}) // Non-critical

      return NextResponse.json({ template }, { status: 201 })
    } catch (error: any) {
      // Handle unique constraint violation on slug
      if (error?.code === 'P2002') {
        return NextResponse.json(
          { error: 'A template with this slug already exists' },
          { status: 409 }
        )
      }

      console.error('Marketplace POST error:', error)
      return NextResponse.json(
        { error: 'Failed to create marketplace template' },
        { status: 500 }
      )
    }
  }
)
