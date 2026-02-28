/**
 * Single Partial API
 *
 * GET /api/admin/partials/[id] - Get partial details
 * PUT /api/admin/partials/[id] - Update partial
 * DELETE /api/admin/partials/[id] - Delete partial
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/cms/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get partial details
export const GET = withPermission(
  PERMISSIONS.PAGES_VIEW,
  async (_request: NextRequest, _context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const partial = await prisma.partial.findUnique({
        where: { id },
      })

      if (!partial) {
        return NextResponse.json(
          { error: 'Partial not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: partial.id,
        name: partial.name,
        slug: partial.slug,
        description: partial.description,
        category: partial.category.toLowerCase(),
        content: partial.content,
        thumbnail: partial.thumbnail,
        isDefault: partial.isDefault,
        status: partial.status.toLowerCase(),
        createdAt: partial.createdAt,
        updatedAt: partial.updatedAt,
      })
    } catch (error) {
      console.error('Get partial error:', error)
      return NextResponse.json(
        { error: 'Failed to get partial' },
        { status: 500 }
      )
    }
  }
)

// PUT - Update partial
export const PUT = withPermission(
  PERMISSIONS.PAGES_EDIT,
  async (request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params
      const body = await request.json()

      const partial = await prisma.partial.findUnique({
        where: { id },
      })

      if (!partial) {
        return NextResponse.json(
          { error: 'Partial not found' },
          { status: 404 }
        )
      }

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
            where: { slug: body.slug.trim(), id: { not: id } },
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

      if (body.thumbnail !== undefined) {
        updateData.thumbnail = body.thumbnail || null
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
        where: { id },
        data: updateData,
      })

      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'partial.update',
        targetType: 'partial',
        targetId: id,
        details: {
          previous: { name: partial.name, slug: partial.slug, status: partial.status },
          updated: updateData,
        },
      })

      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        category: updated.category.toLowerCase(),
        content: updated.content,
        thumbnail: updated.thumbnail,
        isDefault: updated.isDefault,
        status: updated.status.toLowerCase(),
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      })
    } catch (error) {
      console.error('Update partial error:', error)
      return NextResponse.json(
        { error: 'Failed to update partial' },
        { status: 500 }
      )
    }
  }
)

// DELETE - Delete partial
export const DELETE = withPermission(
  PERMISSIONS.PAGES_DELETE,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const partial = await prisma.partial.findUnique({
        where: { id },
      })

      if (!partial) {
        return NextResponse.json(
          { error: 'Partial not found' },
          { status: 404 }
        )
      }

      await prisma.partial.delete({
        where: { id },
      })

      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'partial.delete',
        targetType: 'partial',
        targetId: id,
        details: {
          name: partial.name,
          slug: partial.slug,
          category: partial.category,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete partial error:', error)
      return NextResponse.json(
        { error: 'Failed to delete partial' },
        { status: 500 }
      )
    }
  }
)
