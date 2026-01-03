/**
 * Single Page API
 *
 * GET /api/admin/pages/[id] - Get page details
 * PUT /api/admin/pages/[id] - Update page
 * DELETE /api/admin/pages/[id] - Delete page
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/permissions'

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

        // Check for duplicate slug (excluding current page)
        if (slug !== page.slug) {
          const existing = await prisma.page.findFirst({
            where: {
              slug,
              id: { not: id },
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

      // Handle content (Puck JSON)
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

      const updatedPage = await prisma.page.update({
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
