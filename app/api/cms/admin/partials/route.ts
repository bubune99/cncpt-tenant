/**
 * Partials API
 *
 * GET /api/admin/partials - List partials (with optional category filter)
 * POST /api/admin/partials - Create a new partial
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/cms/permissions'

// GET - List partials
export const GET = withPermission(
  PERMISSIONS.PAGES_VIEW,
  async (request: NextRequest, _context: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')?.toUpperCase()
      const status = searchParams.get('status')?.toUpperCase()
      const search = searchParams.get('search') || ''
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const where: Record<string, unknown> = {}

      if (category && ['HEADER', 'FOOTER', 'ANNOUNCEMENT', 'SIDEBAR', 'SECTION'].includes(category)) {
        where.category = category
      }

      if (status && ['DRAFT', 'PUBLISHED'].includes(status)) {
        where.status = status
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [partials, total] = await Promise.all([
        prisma.partial.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }],
          take: limit,
          skip: offset,
        }),
        prisma.partial.count({ where }),
      ])

      return NextResponse.json({
        partials: partials.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category.toLowerCase(),
          content: p.content,
          thumbnail: p.thumbnail,
          isDefault: p.isDefault,
          status: p.status.toLowerCase(),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        total,
        limit,
        offset,
      })
    } catch (error) {
      console.error('List partials error:', error)
      return NextResponse.json(
        { error: 'Failed to list partials' },
        { status: 500 }
      )
    }
  }
)

// POST - Create a new partial
export const POST = withPermission(
  PERMISSIONS.PAGES_CREATE,
  async (request: NextRequest, context: AuthContext) => {
    try {
      const body = await request.json()

      if (!body.name?.trim()) {
        return NextResponse.json(
          { error: 'Partial name is required' },
          { status: 400 }
        )
      }

      if (!body.slug?.trim()) {
        return NextResponse.json(
          { error: 'Partial slug is required' },
          { status: 400 }
        )
      }

      const category = body.category?.toUpperCase()
      if (!category || !['HEADER', 'FOOTER', 'ANNOUNCEMENT', 'SIDEBAR', 'SECTION'].includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category. Must be HEADER, FOOTER, ANNOUNCEMENT, SIDEBAR, or SECTION' },
          { status: 400 }
        )
      }

      // Check for duplicate slug
      const existing = await prisma.partial.findFirst({
        where: { slug: body.slug.trim() },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A partial with this slug already exists' },
          { status: 409 }
        )
      }

      const partial = await prisma.partial.create({
        data: {
          name: body.name.trim(),
          slug: body.slug.trim(),
          description: body.description?.trim() || null,
          category,
          content: body.content || { version: '2.0', blocks: [] },
          thumbnail: body.thumbnail || null,
          status: body.status?.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        },
      })

      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'partial.create',
        targetType: 'partial',
        targetId: partial.id,
        details: {
          name: partial.name,
          slug: partial.slug,
          category: partial.category,
        },
      })

      return NextResponse.json(
        {
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
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Create partial error:', error)
      return NextResponse.json(
        { error: 'Failed to create partial' },
        { status: 500 }
      )
    }
  }
)
