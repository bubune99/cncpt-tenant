/**
 * Puck Template by ID API
 *
 * GET /api/admin/puck-templates/:id - Get single template
 * PUT /api/admin/puck-templates/:id - Update template
 * DELETE /api/admin/puck-templates/:id - Delete template
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/cms/permissions'
import type { PuckTemplateType } from '@prisma/client'

type RouteParams = { params: Promise<{ id: string }> }

// GET - Get single template
export const GET = withPermission(
  PERMISSIONS.PUCK_TEMPLATES_VIEW,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const template = await prisma.puckTemplate.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: template.id,
        name: template.name,
        slug: template.slug,
        description: template.description,
        type: template.type,
        compatibleConfigs: template.compatibleConfigs,
        content: template.content,
        category: template.category,
        tags: template.tags,
        isSystem: template.isSystem,
        isActive: template.isActive,
        createdBy: template.createdBy,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      })
    } catch (error) {
      console.error('Get puck template error:', error)
      return NextResponse.json(
        { error: 'Failed to get template' },
        { status: 500 }
      )
    }
  }
)

// PUT - Update template
export const PUT = withPermission(
  PERMISSIONS.PUCK_TEMPLATES_EDIT,
  async (request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params
      const body = await request.json()

      // Check template exists
      const existing = await prisma.puckTemplate.findUnique({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      // Don't allow editing system templates
      if (existing.isSystem) {
        return NextResponse.json(
          { error: 'Cannot edit system templates' },
          { status: 403 }
        )
      }

      // Build update object
      const updateData: Record<string, unknown> = {}

      if (body.name?.trim()) {
        updateData.name = body.name.trim()
      }

      if (body.description !== undefined) {
        updateData.description = body.description?.trim() || null
      }

      if (body.type) {
        const type = body.type.toUpperCase()
        if (['SECTION', 'PAGE'].includes(type)) {
          updateData.type = type as PuckTemplateType
        }
      }

      if (body.compatibleConfigs) {
        const validConfigs = [
          'blog',
          'pages',
          'email',
          'ecommerce',
          'plugin',
          'layout',
          'dashboard',
        ]
        updateData.compatibleConfigs = body.compatibleConfigs.filter(
          (c: string) => validConfigs.includes(c)
        )
      }

      if (body.content !== undefined) {
        updateData.content = body.content
      }

      if (body.category !== undefined) {
        updateData.category = body.category?.trim() || null
      }

      if (body.tags !== undefined) {
        updateData.tags = body.tags
      }

      if (body.isActive !== undefined) {
        updateData.isActive = body.isActive
      }

      const template = await prisma.puckTemplate.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'puck_template.update',
        targetType: 'puck_template',
        targetId: template.id,
        details: {
          name: template.name,
          changes: Object.keys(updateData),
        },
      })

      return NextResponse.json({
        id: template.id,
        name: template.name,
        slug: template.slug,
        description: template.description,
        type: template.type,
        compatibleConfigs: template.compatibleConfigs,
        content: template.content,
        category: template.category,
        tags: template.tags,
        isSystem: template.isSystem,
        isActive: template.isActive,
        createdBy: template.createdBy,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      })
    } catch (error) {
      console.error('Update puck template error:', error)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }
  }
)

// DELETE - Delete template
export const DELETE = withPermission(
  PERMISSIONS.PUCK_TEMPLATES_DELETE,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      // Check template exists
      const existing = await prisma.puckTemplate.findUnique({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      // Don't allow deleting system templates
      if (existing.isSystem) {
        return NextResponse.json(
          { error: 'Cannot delete system templates' },
          { status: 403 }
        )
      }

      await prisma.puckTemplate.delete({
        where: { id },
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'puck_template.delete',
        targetType: 'puck_template',
        targetId: id,
        details: {
          name: existing.name,
          type: existing.type,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete puck template error:', error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }
  }
)
