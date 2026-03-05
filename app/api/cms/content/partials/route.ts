/**
 * Content Delivery API - Partials
 *
 * GET  /api/cms/content/partials - List partials (metadata only)
 * POST /api/cms/content/partials - Create a partial (requires write scope)
 *
 * Public read access returns only PUBLISHED partials.
 * API key with admin scope can access all statuses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withContentAuth,
  hasWriteAccess,
  hasAdminAccess,
  corsPreflightResponse,
  type ContentAuthContext,
} from '@/lib/cms/api/content-auth'

export const dynamic = 'force-dynamic'

// CORS preflight
export function OPTIONS() {
  return corsPreflightResponse()
}

// GET - List partials (metadata only)
export const GET = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext) => {
    try {
      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')?.toUpperCase()
      const status = searchParams.get('status')?.toUpperCase()
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

      const where: Record<string, unknown> = {}

      // Category filter
      if (
        category &&
        ['HEADER', 'FOOTER', 'ANNOUNCEMENT', 'SIDEBAR', 'SECTION'].includes(category)
      ) {
        where.category = category
      }

      // Status filtering: public access only sees PUBLISHED
      if (hasAdminAccess(apiKey)) {
        if (status && ['DRAFT', 'PUBLISHED'].includes(status)) {
          where.status = status
        }
      } else {
        where.status = 'PUBLISHED'
      }

      const [partials, total] = await Promise.all([
        prisma.partial.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }],
          take: limit,
          skip: offset,
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            isDefault: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.partial.count({ where }),
      ])

      const response = NextResponse.json({
        partials: partials.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category.toLowerCase(),
          isDefault: p.isDefault,
          status: p.status.toLowerCase(),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        total,
        limit,
        offset,
      })

      // Cache published content for 60 seconds
      if (!hasAdminAccess(apiKey)) {
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
      }

      return response
    } catch (error) {
      console.error('[content-api] List partials error:', error)
      return NextResponse.json(
        { error: 'Failed to list partials' },
        { status: 500 }
      )
    }
  }
)

// POST - Create a partial (requires write scope)
export const POST = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext) => {
    if (!hasWriteAccess(apiKey)) {
      return NextResponse.json(
        { error: 'Write access required. API key must have content:write, pages:write, write, or * scope.' },
        { status: 403 }
      )
    }

    try {
      const body = await request.json()

      if (!body.name?.trim()) {
        return NextResponse.json(
          { error: 'Partial name is required' },
          { status: 400 }
        )
      }

      if (!body.slug?.trim()) {
        return NextResponse.json(
          { error: 'Partial slug is required' },
          { status: 400 }
        )
      }

      const category = body.category?.toUpperCase()
      if (
        !category ||
        !['HEADER', 'FOOTER', 'ANNOUNCEMENT', 'SIDEBAR', 'SECTION'].includes(category)
      ) {
        return NextResponse.json(
          { error: 'Invalid category. Must be HEADER, FOOTER, ANNOUNCEMENT, SIDEBAR, or SECTION' },
          { status: 400 }
        )
      }

      // Check for duplicate slug
      const existing = await prisma.partial.findFirst({
        where: { slug: body.slug.trim() },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A partial with this slug already exists' },
          { status: 409 }
        )
      }

      const partial = await prisma.partial.create({
        data: {
          name: body.name.trim(),
          slug: body.slug.trim(),
          description: body.description?.trim() || null,
          category,
          content: body.content || { version: '2.0', blocks: [] },
          status: body.status?.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        },
      })

      return NextResponse.json(
        {
          partial: {
            id: partial.id,
            name: partial.name,
            slug: partial.slug,
            description: partial.description,
            category: partial.category.toLowerCase(),
            content: partial.content,
            isDefault: partial.isDefault,
            status: partial.status.toLowerCase(),
            createdAt: partial.createdAt,
            updatedAt: partial.updatedAt,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('[content-api] Create partial error:', error)
      return NextResponse.json(
        { error: 'Failed to create partial' },
        { status: 500 }
      )
    }
  }
)
