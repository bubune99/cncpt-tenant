/**
 * Pages API
 *
 * GET /api/admin/pages - List all pages
 * POST /api/admin/pages - Create a new page
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma, getCurrentTenant } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/cms/permissions'
import { isReservedSystemSlug } from '@/lib/cms/system-pages'

export const dynamic = 'force-dynamic'

// GET - List all pages
export const GET = withPermission(
  PERMISSIONS.PAGES_VIEW,
  async (request: NextRequest, _context: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url)
      const search = searchParams.get('search') || ''
      const status = searchParams.get('status')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const where: Record<string, unknown> = {
        // Exclude system pages — they're managed separately via
        // /api/cms/admin/system-pages and rendered in their own admin
        // section. Mixing them into the regular pages list would surface
        // reserved `__system/*` slugs and confuse the delete/duplicate
        // affordances.
        systemKey: null,
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase())) {
        where.status = status.toUpperCase()
      }

      const [pages, total] = await Promise.all([
        prisma.page.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }],
          take: limit,
          skip: offset,
          include: {
            featuredImage: {
              select: {
                id: true,
                url: true,
                alt: true,
              },
            },
            parent: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            _count: {
              select: {
                children: true,
              },
            },
          },
        }),
        prisma.page.count({ where }),
      ])

      return NextResponse.json({
        pages: pages.map((page) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          status: page.status.toLowerCase(),
          content: page.content,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          featuredImage: page.featuredImage,
          parentId: page.parentId,
          parent: page.parent,
          childCount: page._count.children,
          headerMode: page.headerMode,
          footerMode: page.footerMode,
          showAnnouncement: page.showAnnouncement,
          hasContent: page.content !== null,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          publishedAt: page.publishedAt,
        })),
        total,
        limit,
        offset,
      })
    } catch (error) {
      console.error('List pages error:', error)
      return NextResponse.json(
        { error: 'Failed to list pages' },
        { status: 500 }
      )
    }
  }
)

// POST - Create a new page
export const POST = withPermission(
  PERMISSIONS.PAGES_CREATE,
  async (request: NextRequest, context: AuthContext) => {
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

      // Reject reserved system slugs (`__system/*`). User-created pages
      // must never collide with the customisable-system-pages namespace —
      // those rows are managed exclusively via /api/cms/admin/system-pages.
      if (isReservedSystemSlug(slug)) {
        return NextResponse.json(
          {
            error:
              'Slugs starting with "__system/" are reserved for built-in system pages. Please choose a different slug.',
          },
          { status: 400 }
        )
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

      // Validate parent if provided
      if (body.parentId) {
        const parent = await prisma.page.findUnique({
          where: { id: body.parentId },
        })
        if (!parent) {
          return NextResponse.json(
            { error: 'Parent page not found' },
            { status: 400 }
          )
        }
      }

      const page = await prisma.page.create({
        data: {
          title: body.title.trim(),
          slug,
          status,
          metaTitle: body.metaTitle?.trim() || null,
          metaDescription: body.metaDescription?.trim() || null,
          featuredImageId: body.featuredImageId || null,
          parentId: body.parentId || null,
          content: body.content || null,
          headerMode: body.headerMode || undefined,
          footerMode: body.footerMode || undefined,
          showAnnouncement: body.showAnnouncement ?? true,
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
        },
        include: {
          featuredImage: true,
          parent: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'page.create',
        targetType: 'page',
        targetId: page.id,
        details: {
          title: page.title,
          slug: page.slug,
          status: page.status,
        },
      })

      return NextResponse.json(
        {
          id: page.id,
          title: page.title,
          slug: page.slug,
          status: page.status.toLowerCase(),
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          featuredImage: page.featuredImage,
          parentId: page.parentId,
          parent: page.parent,
          headerMode: page.headerMode,
          footerMode: page.footerMode,
          showAnnouncement: page.showAnnouncement,
          hasContent: page.content !== null,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          publishedAt: page.publishedAt,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Create page error:', error)
      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 }
      )
    }
  }
)
