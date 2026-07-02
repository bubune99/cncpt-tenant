/**
 * Page Version Restore API
 *
 * POST /api/cms/admin/pages/[id]/versions/[versionId]/restore
 * Snapshots the page's CURRENT content into a new version first, then writes
 * the selected version's content back onto the page. Both happen atomically.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/cms/permissions'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>
}

export const POST = withPermission(
  PERMISSIONS.PAGES_EDIT,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id, versionId } = await params

      const page = await prisma.page.findUnique({ where: { id } })
      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 })
      }

      const version = await prisma.pageVersion.findUnique({ where: { id: versionId } })
      if (!version || version.pageId !== id) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 })
      }

      const updatedPage = await prisma.$transaction(async (tx) => {
        // Snapshot current content before overwriting, so restore is reversible.
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

        return tx.page.update({
          where: { id },
          data: { content: version.content ?? undefined },
        })
      })

      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'page.update',
        targetType: 'page',
        targetId: page.id,
        details: { restoredVersionId: versionId, versionCreatedAt: version.createdAt },
      })

      return NextResponse.json({
        id: updatedPage.id,
        content: updatedPage.content,
        updatedAt: updatedPage.updatedAt,
      })
    } catch (error) {
      console.error('Restore page version error:', error)
      return NextResponse.json(
        { error: 'Failed to restore version' },
        { status: 500 }
      )
    }
  }
)
