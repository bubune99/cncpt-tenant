/**
 * Puck Templates API
 *
 * GET /api/admin/puck-templates - List templates with filtering
 * POST /api/admin/puck-templates - Create a new template
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import {
  withPermission,
  type AuthContext,
} from '../../../../lib/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '../../../../lib/permissions'
import type { PuckTemplateType } from '@prisma/client'

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET - List templates with filtering
export const GET = withPermission(
  PERMISSIONS.PUCK_TEMPLATES_VIEW,
  async (request: NextRequest, _context: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url)
      const search = searchParams.get('search') || ''
      const type = searchParams.get('type') as PuckTemplateType | null
      const config = searchParams.get('config') // Filter by compatible config
      const category = searchParams.get('category')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const where: Record<string, unknown> = {
        isActive: true,
      }

      // Search by name or description
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      // Filter by type (SECTION or PAGE)
      if (type && ['SECTION', 'PAGE'].includes(type)) {
        where.type = type
      }

      // Filter by compatible config
      if (config) {
        where.compatibleConfigs = { has: config }
      }

      // Filter by category
      if (category) {
        where.category = category
      }

      const [templates, total] = await Promise.all([
        prisma.puckTemplate.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }],
          take: limit,
          skip: offset,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.puckTemplate.count({ where }),
      ])

      // Get unique categories for filtering UI
      const categories = await prisma.puckTemplate.groupBy({
        by: ['category'],
        where: { isActive: true, category: { not: null } },
      })

      return NextResponse.json({
        templates: templates.map((template) => ({
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
          createdBy: template.createdBy,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        })),
        categories: categories
          .map((c) => c.category)
          .filter(Boolean) as string[],
        total,
        limit,
        offset,
      })
    } catch (error) {
      console.error('List puck templates error:', error)
      return NextResponse.json(
        { error: 'Failed to list templates' },
        { status: 500 }
      )
    }
  }
)

// POST - Create a new template
export const POST = withPermission(
  PERMISSIONS.PUCK_TEMPLATES_CREATE,
  async (request: NextRequest, context: AuthContext) => {
    try {
      const body = await request.json()

      // Validate required fields
      if (!body.name?.trim()) {
        return NextResponse.json(
          { error: 'Template name is required' },
          { status: 400 }
        )
      }

      if (!body.content) {
        return NextResponse.json(
          { error: 'Template content is required' },
          { status: 400 }
        )
      }

      // Validate type
      const type = body.type?.toUpperCase() || 'SECTION'
      if (!['SECTION', 'PAGE'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid type. Must be SECTION or PAGE' },
          { status: 400 }
        )
      }

      // Validate compatible configs
      const validConfigs = [
        'blog',
        'pages',
        'email',
        'ecommerce',
        'plugin',
        'layout',
        'dashboard',
      ]
      const compatibleConfigs = (body.compatibleConfigs || []).filter(
        (c: string) => validConfigs.includes(c)
      )

      if (compatibleConfigs.length === 0) {
        return NextResponse.json(
          { error: 'At least one compatible config is required' },
          { status: 400 }
        )
      }

      // Generate unique slug
      let slug = body.slug?.trim() || generateSlug(body.name)
      const existingSlug = await prisma.puckTemplate.findUnique({
        where: { slug },
      })
      if (existingSlug) {
        // Append timestamp to make unique
        slug = `${slug}-${Date.now()}`
      }

      const template = await prisma.puckTemplate.create({
        data: {
          name: body.name.trim(),
          slug,
          description: body.description?.trim() || null,
          type: type as PuckTemplateType,
          compatibleConfigs,
          content: body.content,
          category: body.category?.trim() || null,
          tags: body.tags || [],
          isSystem: false,
          isActive: true,
          createdById: context.user.id,
        },
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
        action: 'puck_template.create',
        targetType: 'puck_template',
        targetId: template.id,
        details: {
          name: template.name,
          type: template.type,
          compatibleConfigs: template.compatibleConfigs,
        },
      })

      return NextResponse.json(
        {
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
          createdBy: template.createdBy,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Create puck template error:', error)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }
  }
)
