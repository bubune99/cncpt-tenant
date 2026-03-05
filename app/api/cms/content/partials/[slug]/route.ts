/**
 * Content Delivery API - Single Partial by Slug
 *
 * GET    /api/cms/content/partials/[slug] - Get partial with full block content
 * PUT    /api/cms/content/partials/[slug] - Update partial (requires write scope)
 * DELETE /api/cms/content/partials/[slug] - Delete partial (requires write scope)
 *
 * Public access returns only PUBLISHED partials.
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

interface RouteParams {
  params: Promise<{ slug: string }>
}

// CORS preflight
export function OPTIONS() {
  return corsPreflightResponse()
}

// GET - Get single partial by slug with full block content
export const GET = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext, routeContext: RouteParams) => {
    try {
      const { slug } = await routeContext.params
      const decodedSlug = decodeURIComponent(slug)

      const partial = await prisma.partial.findFirst({
        where: { slug: decodedSlug },
      })

      if (!partial) {
        return NextResponse.json(
          { error: 'Partial not found' },
          { status: 404 }
        )
      }

      // Non-admin access can only see PUBLISHED partials
      if (partial.status !== 'PUBLISHED' && !hasAdminAccess(apiKey)) {
        return NextResponse.json(
          { error: 'Partial not found' },
          { status: 404 }
        )
      }

      const response = NextResponse.json({
        partial: {
          id: partial.id,
          name: partial.name,
          slug: partial.slug,
          category: partial.category.toLowerCase(),
          content: partial.content,
          isDefault: partial.isDefault,
          status: partial.status.toLowerCase(),
          createdAt: partial.createdAt,
          updatedAt: partial.updatedAt,
        },
      })

      // Cache published content for 60 seconds
      if (partial.status === 'PUBLISHED' && !hasAdminAccess(apiKey)) {
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
      }

      return response
    } catch (error) {
      console.error('[content-api] Get partial error:', error)
      return NextResponse.json(
        { error: 'Failed to get partial' },
        { status: 500 }
      )
    }
  }
)

// PUT - Update partial by slug (requires write scope)
export const PUT = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext, routeContext: RouteParams) => {
    if (!hasWriteAccess(apiKey)) {
      return NextResponse.json(
        { error: 'Write access required. API key must have content:write, pages:write, write, or * scope.' },
        { status: 403 }
      )
    }

    try {
      const { slug } = await routeContext.params
      const decodedSlug = decodeURIComponent(slug)

      const partial = await prisma.partial.findFirst({
        where: { slug: decodedSlug },
      })

      if (!partial) {
        return NextResponse.json(
          { error: 'Partial not found' },
          { status: 404 }
        )
      }

      const body = await request.json()
      const updateData: Record<string, unknown> = {}

      if (body.name !== undefined) {
        if (!body.name?.trim()) {
          return NextResponse.json(
            { error: 'Partial name cannot be empty' },
            { status: 400 }
          )
        }
        updateData.name = body.name.trim()
      }

      if (body.slug !== undefined) {
        if (!body.slug?.trim()) {
          return NextResponse.json(
            { error: 'Partial slug cannot be empty' },
            { status: 400 }
          )
        }
        if (body.slug.trim() !== partial.slug) {
          const existing = await prisma.partial.findFirst({
            where: { slug: body.slug.trim(), id: { not: partial.id } },
          })
          if (existing) {
            return NextResponse.json(
              { error: 'A partial with this slug already exists' },
              { status: 409 }
            )
          }
        }
        updateData.slug = body.slug.trim()
      }

      if (body.description !== undefined) {
        updateData.description = body.description?.trim() || null
      }

      if (body.content !== undefined) {
        updateData.content = body.content
      }

      if (body.status !== undefined) {
        const status = body.status.toUpperCase()
        if (!['DRAFT', 'PUBLISHED'].includes(status)) {
          return NextResponse.json(
            { error: 'Invalid status. Must be DRAFT or PUBLISHED' },
            { status: 400 }
          )
        }
        updateData.status = status
      }

      const updated = await prisma.partial.update({
        where: { id: partial.id },
        data: updateData,
      })

      return NextResponse.json({
        partial: {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          description: updated.description,
          category: updated.category.toLowerCase(),
          content: updated.content,
          isDefault: updated.isDefault,
          status: updated.status.toLowerCase(),
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      })
    } catch (error) {
      console.error('[content-api] Update partial error:', error)
      return NextResponse.json(
        { error: 'Failed to update partial' },
        { status: 500 }
      )
    }
  }
)

// DELETE - Delete partial by slug (requires write scope)
export const DELETE = withContentAuth(
  async (request: NextRequest, { apiKey }: ContentAuthContext, routeContext: RouteParams) => {
    if (!hasWriteAccess(apiKey)) {
      return NextResponse.json(
        { error: 'Write access required. API key must have content:write, pages:write, write, or * scope.' },
        { status: 403 }
      )
    }

    try {
      const { slug } = await routeContext.params
      const decodedSlug = decodeURIComponent(slug)

      const partial = await prisma.partial.findFirst({
        where: { slug: decodedSlug },
      })

      if (!partial) {
        return NextResponse.json(
          { error: 'Partial not found' },
          { status: 404 }
        )
      }

      await prisma.partial.delete({
        where: { id: partial.id },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('[content-api] Delete partial error:', error)
      return NextResponse.json(
        { error: 'Failed to delete partial' },
        { status: 500 }
      )
    }
  }
)
