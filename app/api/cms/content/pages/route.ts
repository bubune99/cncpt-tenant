/**
 * Content Delivery API - Pages
 *
 * GET  /api/cms/content/pages - List published pages (metadata only)
 * POST /api/cms/content/pages - Create a page (requires write scope)
 *
 * Public read access returns only PUBLISHED pages.
 * API key with admin scope can access all statuses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma, getCurrentTenant } from '@/lib/cms/db'
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

// GET - List pages (metadata only, no block content)
export const GET = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext) => {
    try {
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status')?.toUpperCase()
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
      const search = searchParams.get('search') || ''

      const where: Record<string, unknown> = {}

      // Status filtering: public access only sees PUBLISHED
      if (hasAdminAccess(apiKey)) {
        // Admin can see all statuses
        if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
          where.status = status
        }
      } else {
        // Public and read-only API keys only see PUBLISHED
        where.status = 'PUBLISHED'
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [pages, total] = await Promise.all([
        prisma.page.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }],
          take: limit,
          skip: offset,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            metaTitle: true,
            metaDescription: true,
            createdAt: true,
            updatedAt: true,
            publishedAt: true,
          },
        }),
        prisma.page.count({ where }),
      ])

      const response = NextResponse.json({
        pages: pages.map((page) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          status: page.status.toLowerCase(),
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          publishedAt: page.publishedAt,
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
      console.error('[content-api] List pages error:', error)
      return NextResponse.json(
        { error: 'Failed to list pages' },
        { status: 500 }
      )
    }
  }
)

// POST - Create a page (requires write scope)
export const POST = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext) => {
    // Require write access
    if (!hasWriteAccess(apiKey)) {
      return NextResponse.json(
        { error: 'Write access required. API key must have content:write, pages:write, write, or * scope.' },
        { status: 403 }
      )
    }

    try {
      const body = await request.json()

      // Validate required fields
      if (!body.title?.trim()) {
        return NextResponse.json(
          { error: 'Page title is required' },
          { status: 400 }
        )
      }

      if (!body.slug?.trim()) {
        return NextResponse.json(
          { error: 'Page slug is required' },
          { status: 400 }
        )
      }

      // Normalize slug
      let slug = body.slug.trim()
      if (!slug.startsWith('/')) {
        slug = '/' + slug
      }

      // Check for duplicate slug within this tenant
      const currentTenantId = getCurrentTenant()
      const existing = await prisma.page.findFirst({
        where: { slug, tenantId: currentTenantId ?? undefined },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 409 }
        )
      }

      // Validate status
      const status = body.status?.toUpperCase() || 'DRAFT'
      if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED' },
          { status: 400 }
        )
      }

      const page = await prisma.page.create({
        data: {
          title: body.title.trim(),
          slug,
          status,
          metaTitle: body.metaTitle?.trim() || null,
          metaDescription: body.metaDescription?.trim() || null,
          content: body.content || null,
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
        },
      })

      return NextResponse.json(
        {
          page: {
            id: page.id,
            title: page.title,
            slug: page.slug,
            status: page.status.toLowerCase(),
            content: page.content,
            metaTitle: page.metaTitle,
            metaDescription: page.metaDescription,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
            publishedAt: page.publishedAt,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('[content-api] Create page error:', error)
      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 }
      )
    }
  }
)
