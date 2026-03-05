/**
 * Content Delivery API - Single Page by Slug
 *
 * GET    /api/cms/content/pages/[slug] - Get page with full block content
 * PUT    /api/cms/content/pages/[slug] - Update page (requires write scope)
 * DELETE /api/cms/content/pages/[slug] - Delete page (requires write scope)
 *
 * Public access returns only PUBLISHED pages.
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

interface RouteParams {
  params: Promise<{ slug: string }>
}

// CORS preflight
export function OPTIONS() {
  return corsPreflightResponse()
}

// GET - Get single page by slug with full block content
export const GET = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext, routeContext: RouteParams) => {
    try {
      const { slug: rawSlug } = await routeContext.params
      // Decode URI component and normalize slug
      const slug = decodeURIComponent(rawSlug)
      const normalizedSlug = slug.startsWith('/') ? slug : '/' + slug

      const page = await prisma.page.findFirst({
        where: { slug: normalizedSlug },
      })

      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }

      // Non-admin access can only see PUBLISHED pages
      if (page.status !== 'PUBLISHED' && !hasAdminAccess(apiKey)) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }

      const response = NextResponse.json({
        page: {
          id: page.id,
          title: page.title,
          slug: page.slug,
          status: page.status.toLowerCase(),
          content: page.content,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          headerMode: page.headerMode,
          footerMode: page.footerMode,
          customHeader: page.customHeader,
          customFooter: page.customFooter,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          publishedAt: page.publishedAt,
        },
      })

      // Cache published content for 60 seconds
      if (page.status === 'PUBLISHED' && !hasAdminAccess(apiKey)) {
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
      }

      return response
    } catch (error) {
      console.error('[content-api] Get page error:', error)
      return NextResponse.json(
        { error: 'Failed to get page' },
        { status: 500 }
      )
    }
  }
)

// PUT - Update page by slug (requires write scope)
export const PUT = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext, routeContext: RouteParams) => {
    if (!hasWriteAccess(apiKey)) {
      return NextResponse.json(
        { error: 'Write access required. API key must have content:write, pages:write, write, or * scope.' },
        { status: 403 }
      )
    }

    try {
      const { slug: rawSlug } = await routeContext.params
      const slug = decodeURIComponent(rawSlug)
      const normalizedSlug = slug.startsWith('/') ? slug : '/' + slug

      const page = await prisma.page.findFirst({
        where: { slug: normalizedSlug },
      })

      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }

      const body = await request.json()
      const updateData: Record<string, unknown> = {}

      // Handle title
      if (body.title !== undefined) {
        if (!body.title?.trim()) {
          return NextResponse.json(
            { error: 'Page title cannot be empty' },
            { status: 400 }
          )
        }
        updateData.title = body.title.trim()
      }

      // Handle slug change
      if (body.slug !== undefined) {
        let newSlug = body.slug.trim()
        if (!newSlug) {
          return NextResponse.json(
            { error: 'Page slug cannot be empty' },
            { status: 400 }
          )
        }
        if (!newSlug.startsWith('/')) {
          newSlug = '/' + newSlug
        }

        if (newSlug !== page.slug) {
          const currentTenantId = getCurrentTenant()
          const existing = await prisma.page.findFirst({
            where: {
              slug: newSlug,
              id: { not: page.id },
              tenantId: currentTenantId ?? undefined,
            },
          })
          if (existing) {
            return NextResponse.json(
              { error: 'A page with this slug already exists' },
              { status: 409 }
            )
          }
        }
        updateData.slug = newSlug
      }

      // Handle status
      if (body.status !== undefined) {
        const status = body.status.toUpperCase()
        if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
          return NextResponse.json(
            { error: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED' },
            { status: 400 }
          )
        }
        updateData.status = status

        if (status === 'PUBLISHED' && page.status !== 'PUBLISHED') {
          updateData.publishedAt = new Date()
        }
      }

      // Handle content
      if (body.content !== undefined) {
        updateData.content = body.content
      }

      // Handle SEO fields
      if (body.metaTitle !== undefined) {
        updateData.metaTitle = body.metaTitle?.trim() || null
      }
      if (body.metaDescription !== undefined) {
        updateData.metaDescription = body.metaDescription?.trim() || null
      }

      const updatedPage = await prisma.page.update({
        where: { id: page.id },
        data: updateData,
      })

      return NextResponse.json({
        page: {
          id: updatedPage.id,
          title: updatedPage.title,
          slug: updatedPage.slug,
          status: updatedPage.status.toLowerCase(),
          content: updatedPage.content,
          metaTitle: updatedPage.metaTitle,
          metaDescription: updatedPage.metaDescription,
          headerMode: updatedPage.headerMode,
          footerMode: updatedPage.footerMode,
          customHeader: updatedPage.customHeader,
          customFooter: updatedPage.customFooter,
          createdAt: updatedPage.createdAt,
          updatedAt: updatedPage.updatedAt,
          publishedAt: updatedPage.publishedAt,
        },
      })
    } catch (error) {
      console.error('[content-api] Update page error:', error)
      return NextResponse.json(
        { error: 'Failed to update page' },
        { status: 500 }
      )
    }
  }
)

// DELETE - Delete page by slug (requires write scope)
export const DELETE = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext, routeContext: RouteParams) => {
    if (!hasWriteAccess(apiKey)) {
      return NextResponse.json(
        { error: 'Write access required. API key must have content:write, pages:write, write, or * scope.' },
        { status: 403 }
      )
    }

    try {
      const { slug: rawSlug } = await routeContext.params
      const slug = decodeURIComponent(rawSlug)
      const normalizedSlug = slug.startsWith('/') ? slug : '/' + slug

      const page = await prisma.page.findFirst({
        where: { slug: normalizedSlug },
        include: {
          _count: {
            select: { children: true },
          },
        },
      })

      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }

      // Prevent deleting pages with children
      if (page._count.children > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete page with ${page._count.children} child page(s). Move or delete child pages first.`,
          },
          { status: 400 }
        )
      }

      await prisma.page.delete({
        where: { id: page.id },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('[content-api] Delete page error:', error)
      return NextResponse.json(
        { error: 'Failed to delete page' },
        { status: 500 }
      )
    }
  }
)
