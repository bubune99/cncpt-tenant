/**
 * Set Default Partial API
 *
 * POST /api/admin/partials/[id]/set-default
 * Marks this partial as the active default for its category.
 * Unmarks the previous default.
 * Only PUBLISHED partials can be set as default.
 * Copies the partial's blocks into SiteSettings (header/footer) for fast rendering.
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

export const POST = withPermission(
  PERMISSIONS.PAGES_EDIT,
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

      if (partial.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: 'Only PUBLISHED partials can be set as default. Publish this partial first.' },
          { status: 400 }
        )
      }

      // Unmark previous default for this category
      await prisma.partial.updateMany({
        where: {
          category: partial.category,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      })

      // Mark this one as default
      await prisma.partial.update({
        where: { id },
        data: { isDefault: true },
      })

      // Copy blocks into SiteSettings for fast storefront rendering
      const category = partial.category
      if (category === 'HEADER' || category === 'FOOTER') {
        const settingsField = category === 'HEADER' ? 'header' : 'footer'
        await prisma.siteSettings.upsert({
          where: { id: 'default' },
          create: {
            id: 'default',
            [settingsField]: partial.content,
          },
          update: {
            [settingsField]: partial.content,
          },
        })
      }

      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'partial.set_default',
        targetType: 'partial',
        targetId: id,
        details: {
          name: partial.name,
          category: partial.category,
        },
      })

      return NextResponse.json({
        success: true,
        id: partial.id,
        name: partial.name,
        category: partial.category.toLowerCase(),
      })
    } catch (error) {
      console.error('Set default partial error:', error)
      return NextResponse.json(
        { error: 'Failed to set default partial' },
        { status: 500 }
      )
    }
  }
)
