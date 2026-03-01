/**
 * Marketplace Single Template API
 *
 * GET    /api/cms/marketplace/:slug — Get a single template (public)
 * PUT    /api/cms/marketplace/:slug — Update a template (admin only)
 * DELETE /api/cms/marketplace/:slug — Delete a template (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getMarketplaceTemplate,
  updateMarketplaceTemplate,
  deleteMarketplaceTemplate,
} from '@/lib/cms/marketplace'
import { ALL_CATEGORIES } from '@/lib/cms/marketplace/types'
import { prisma } from '@/lib/cms/db'
import {
  withAuth,
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/cms/permissions'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET — Public (any authenticated user)
// ---------------------------------------------------------------------------
export const GET = withAuth(
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

      return NextResponse.json({ template })
    } catch (error) {
      console.error('Marketplace GET [slug] error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch template' },
        { status: 500 }
      )
    }
  }
)

// ---------------------------------------------------------------------------
// PUT — Update template (admin only)
// ---------------------------------------------------------------------------
export const PUT = withPermission(
  PERMISSIONS.PAGES_EDIT,
  async (
    request: NextRequest,
    context: AuthContext,
    { params }: { params: Promise<{ slug: string }> }
  ) => {
    try {
      const { slug } = await params
      const body = await request.json()

      // Look up the template by slug to get its ID
      const existing = await (prisma as any).marketplaceTemplate.findUnique({
        where: { slug },
        select: { id: true },
      })

      if (!existing) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      // Validate category if provided
      if (body.category && !ALL_CATEGORIES.includes(body.category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
      }

      // Validate type if provided
      if (body.type && body.type !== 'site' && body.type !== 'component') {
        return NextResponse.json(
          { error: 'type must be "site" or "component"' },
          { status: 400 }
        )
      }

      // Validate slug format if changing slug
      if (body.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) {
        return NextResponse.json(
          { error: 'slug must be kebab-case' },
          { status: 400 }
        )
      }

      // Validate blocks if provided
      if (body.blocks !== undefined && !Array.isArray(body.blocks)) {
        return NextResponse.json(
          { error: 'blocks must be an array' },
          { status: 400 }
        )
      }

      const template = await updateMarketplaceTemplate(existing.id, {
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
        action: 'update' as any,
        resource: 'marketplace_template',
        resourceId: template.id,
        details: { name: template.name, slug: template.slug },
      }).catch(() => {})

      return NextResponse.json({ template })
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return NextResponse.json(
          { error: 'A template with this slug already exists' },
          { status: 409 }
        )
      }

      console.error('Marketplace PUT error:', error)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }
  }
)

// ---------------------------------------------------------------------------
// DELETE — Remove template (admin only)
// ---------------------------------------------------------------------------
export const DELETE = withPermission(
  PERMISSIONS.PAGES_DELETE,
  async (
    request: NextRequest,
    context: AuthContext,
    { params }: { params: Promise<{ slug: string }> }
  ) => {
    try {
      const { slug } = await params

      // Look up by slug
      const existing = await (prisma as any).marketplaceTemplate.findUnique({
        where: { slug },
        select: { id: true, name: true },
      })

      if (!existing) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      await deleteMarketplaceTemplate(existing.id)

      // Audit log
      await logAuditEvent({
        userId: context.user.id,
        action: 'delete' as any,
        resource: 'marketplace_template',
        resourceId: existing.id,
        details: { name: existing.name, slug },
      }).catch(() => {})

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Marketplace DELETE error:', error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }
  }
)
