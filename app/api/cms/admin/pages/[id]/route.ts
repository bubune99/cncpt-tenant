/**
 * Single Page API
 *
 * GET /api/admin/pages/[id] - Get page details
 * PUT /api/admin/pages/[id] - Update page
 * DELETE /api/admin/pages/[id] - Delete page
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

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get page details
export const GET = withPermission(
  PERMISSIONS.PAGES_VIEW,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const page = await prisma.page.findUnique({
        where: { id },
        include: {
          featuredImage: true,
          parent: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          children: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
            },
            orderBy: { title: 'asc' },
          },
        },
      })

      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status.toLowerCase(),
        content: page.content,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        featuredImage: page.featuredImage,
        featuredImageId: page.featuredImageId,
        parentId: page.parentId,
        parent: page.parent,
        children: page.children.map((child) => ({
          ...child,
          status: child.status.toLowerCase(),
        })),
        headerMode: page.headerMode,
        footerMode: page.footerMode,
        customHeader: page.customHeader,
        customFooter: page.customFooter,
        showAnnouncement: page.showAnnouncement,
        customAnnouncement: page.customAnnouncement,
        systemKey: page.systemKey,
        sourceDeps: (page as Record<string, unknown>).sourceDeps || null,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
        publishedAt: page.publishedAt,
      })
    } catch (error) {
      console.error('Get page error:', error)
      return NextResponse.json(
        { error: 'Failed to get page' },
        { status: 500 }
      )
    }
  }
)

// PUT - Update page
export const PUT = withPermission(
  PERMISSIONS.PAGES_EDIT,
  async (request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params
      const body = await request.json()

      const page = await prisma.page.findUnique({
        where: { id },
      })

      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }

      // Concurrent-edit conflict detection. The client sends the updatedAt it
      // loaded the page with. If the DB row is newer, someone else saved in the
      // meantime — reject with 409 so the client can offer reload/overwrite.
      // Overwrite re-PUTs without lastKnownUpdatedAt to bypass this check.
      if (body.lastKnownUpdatedAt) {
        const known = new Date(body.lastKnownUpdatedAt).getTime()
        const current = page.updatedAt.getTime()
        if (Number.isFinite(known) && known < current) {
          return NextResponse.json(
            {
              error:
                'This page was changed elsewhere since you loaded it.',
              conflict: { remoteUpdatedAt: page.updatedAt.toISOString() },
            },
            { status: 409 }
          )
        }
      }

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

      // Handle slug
      if (body.slug !== undefined) {
        let slug = body.slug.trim()
        if (!slug) {
          return NextResponse.json(
            { error: 'Page slug cannot be empty' },
            { status: 400 }
          )
        }
        if (!slug.startsWith('/')) {
          slug = '/' + slug
        }

        // System pages own their slug. The reserved `__system/*` slug is
        // structural — changing it would orphan the storefront/admin
        // wiring. Silently keep the existing slug rather than 400ing so
        // the editor's "save settings" UX still works.
        if (page.systemKey) {
          // Skip slug update entirely; keep canonical slug.
        } else {
          // Reject attempts to retroactively claim a system slug.
          if (isReservedSystemSlug(slug)) {
            return NextResponse.json(
              {
                error:
                  'Slugs starting with "__system/" are reserved for built-in system pages.',
              },
              { status: 400 }
            )
          }

          // Check for duplicate slug (excluding current page, scoped to tenant)
          if (slug !== page.slug) {
            const currentTenantId = getCurrentTenant()
            const existing = await prisma.page.findFirst({
              where: {
                slug,
                id: { not: id },
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
          updateData.slug = slug
        }
      }

      // systemKey is set only by /api/cms/admin/system-pages/[key]. Ignore
      // any attempt to change it through the regular PUT endpoint to keep
      // the system-pages namespace tamper-resistant.
      if (body.systemKey !== undefined && body.systemKey !== page.systemKey) {
        return NextResponse.json(
          { error: 'systemKey cannot be modified via the pages endpoint.' },
          { status: 400 }
        )
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

        // Set publishedAt when first publishing
        if (status === 'PUBLISHED' && page.status !== 'PUBLISHED') {
          updateData.publishedAt = new Date()
        }
      }

      // Handle content (editor JSON)
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

      // Handle featured image
      if (body.featuredImageId !== undefined) {
        updateData.featuredImageId = body.featuredImageId || null
      }

      // Handle parent
      if (body.parentId !== undefined) {
        if (body.parentId) {
          // Validate parent exists and isn't self or descendant
          if (body.parentId === id) {
            return NextResponse.json(
              { error: 'Page cannot be its own parent' },
              { status: 400 }
            )
          }
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
        updateData.parentId = body.parentId || null
      }

      // Handle layout modes
      if (body.headerMode !== undefined) {
        if (!['GLOBAL', 'CUSTOM', 'NONE'].includes(body.headerMode)) {
          return NextResponse.json(
            { error: 'Invalid headerMode' },
            { status: 400 }
          )
        }
        updateData.headerMode = body.headerMode
      }
      if (body.footerMode !== undefined) {
        if (!['GLOBAL', 'CUSTOM', 'NONE'].includes(body.footerMode)) {
          return NextResponse.json(
            { error: 'Invalid footerMode' },
            { status: 400 }
          )
        }
        updateData.footerMode = body.footerMode
      }

      // Handle custom header/footer
      if (body.customHeader !== undefined) {
        updateData.customHeader = body.customHeader
      }
      if (body.customFooter !== undefined) {
        updateData.customFooter = body.customFooter
      }

      // Handle announcement
      if (body.showAnnouncement !== undefined) {
        updateData.showAnnouncement = Boolean(body.showAnnouncement)
      }
      if (body.customAnnouncement !== undefined) {
        updateData.customAnnouncement = body.customAnnouncement
      }

      // Handle source deps (component dependency manifest from project import)
      if (body.sourceDeps !== undefined) {
        updateData.sourceDeps = body.sourceDeps
      }

      // Snapshot the PREVIOUS content into a PageVersion whenever this save
      // changes the content. Kept atomic with the update, and pruned to the
      // last 20 versions per page in the same transaction.
      const contentChanged =
        body.content !== undefined &&
        JSON.stringify(page.content ?? null) !== JSON.stringify(body.content ?? null)

      const updatedPage = await prisma.$transaction(async (tx) => {
        if (contentChanged) {
          await tx.pageVersion.create({
            data: {
              pageId: page.id,
              content: page.content ?? undefined,
              title: page.title,
              status: page.status,
              createdBy: context.user.id,
            },
          })

          // Retain only the 20 most recent versions for this page.
          const stale = await tx.pageVersion.findMany({
            where: { pageId: page.id },
            orderBy: { createdAt: 'desc' },
            skip: 20,
            select: { id: true },
          })
          if (stale.length > 0) {
            await tx.pageVersion.deleteMany({
              where: { id: { in: stale.map((v) => v.id) } },
            })
          }
        }

        return tx.page.update({
          where: { id },
          data: updateData,
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
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'page.update',
        targetType: 'page',
        targetId: page.id,
        details: {
          previous: {
            title: page.title,
            slug: page.slug,
            status: page.status,
          },
          updated: updateData,
        },
      })

      return NextResponse.json({
        id: updatedPage.id,
        title: updatedPage.title,
        slug: updatedPage.slug,
        status: updatedPage.status.toLowerCase(),
        content: updatedPage.content,
        metaTitle: updatedPage.metaTitle,
        metaDescription: updatedPage.metaDescription,
        featuredImage: updatedPage.featuredImage,
        featuredImageId: updatedPage.featuredImageId,
        parentId: updatedPage.parentId,
        parent: updatedPage.parent,
        headerMode: updatedPage.headerMode,
        footerMode: updatedPage.footerMode,
        customHeader: updatedPage.customHeader,
        customFooter: updatedPage.customFooter,
        showAnnouncement: updatedPage.showAnnouncement,
        customAnnouncement: updatedPage.customAnnouncement,
        systemKey: updatedPage.systemKey,
        sourceDeps: (updatedPage as Record<string, unknown>).sourceDeps || null,
        createdAt: updatedPage.createdAt,
        updatedAt: updatedPage.updatedAt,
        publishedAt: updatedPage.publishedAt,
      })
    } catch (error) {
      console.error('Update page error:', error)
      return NextResponse.json(
        { error: 'Failed to update page' },
        { status: 500 }
      )
    }
  }
)

// DELETE - Delete page
export const DELETE = withPermission(
  PERMISSIONS.PAGES_DELETE,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const page = await prisma.page.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              children: true,
            },
          },
        },
      })

      if (!page) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }

      // System pages cannot be deleted through the regular pages endpoint.
      // To return a system page to its platform default, use
      // DELETE /api/cms/admin/system-pages/[key] which performs the same
      // delete with the right audit trail and idempotent semantics.
      if (page.systemKey) {
        return NextResponse.json(
          {
            error:
              'System pages cannot be deleted directly. Use the "Reset to default" action on the System Pages section.',
          },
          { status: 400 }
        )
      }

      // Check for child pages
      if (page._count.children > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete page with ${page._count.children} child page(s). Move or delete child pages first.`,
          },
          { status: 400 }
        )
      }

      await prisma.page.delete({
        where: { id },
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'page.delete',
        targetType: 'page',
        targetId: id,
        details: {
          title: page.title,
          slug: page.slug,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete page error:', error)
      return NextResponse.json(
        { error: 'Failed to delete page' },
        { status: 500 }
      )
    }
  }
)
