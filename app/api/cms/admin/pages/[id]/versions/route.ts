/**
 * Page Version History API
 *
 * GET /api/cms/admin/pages/[id]/versions - List saved versions for a page
 * (metadata only — content is omitted from the list for payload size).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS } from '@/lib/cms/permissions'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withPermission(
  PERMISSIONS.PAGES_VIEW,
  async (_request: NextRequest, _context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const page = await prisma.page.findUnique({ where: { id }, select: { id: true } })
      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 })
      }

      const versions = await prisma.pageVersion.findMany({
        where: { pageId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          status: true,
          createdBy: true,
          createdAt: true,
        },
      })

      return NextResponse.json({
        versions: versions.map((v) => ({
          id: v.id,
          title: v.title,
          status: v.status.toLowerCase(),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        })),
      })
    } catch (error) {
      console.error('List page versions error:', error)
      return NextResponse.json(
        { error: 'Failed to list versions' },
        { status: 500 }
      )
    }
  }
)
