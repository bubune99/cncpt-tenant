/**
 * Page Clone API
 *
 * POST /api/cms/admin/pages/[id]/clone
 * Duplicates a page — copies title (+ " (Copy)"), content, header/footer config
 * and SEO, assigns a unique slug, and forces status DRAFT.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma, getCurrentTenant } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/cms/permissions'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** Find a slug not already used by this tenant, appending -copy, -copy-2, … */
async function uniqueSlug(base: string, tenantId: number | null): Promise<string> {
  const root = base.replace(/\/$/, '') || '/page'
  let candidate = `${root}-copy`
  let n = 1
  // Bounded loop — degrade to a timestamp suffix rather than spin forever.
  while (n < 100) {
    const existing = await prisma.page.findFirst({
      where: { slug: candidate, tenantId: tenantId ?? undefined },
      select: { id: true },
    })
    if (!existing) return candidate
    n += 1
    candidate = `${root}-copy-${n}`
  }
  return `${root}-copy-${Date.now()}`
}

export const POST = withPermission(
  PERMISSIONS.PAGES_CREATE,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const source = await prisma.page.findUnique({ where: { id } })
      if (!source) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 })
      }

      const tenantId = getCurrentTenant()
      const slug = await uniqueSlug(source.slug, tenantId)

      const clone = await prisma.page.create({
        data: {
          title: `${source.title} (Copy)`,
          slug,
          status: 'DRAFT',
          content: source.content ?? undefined,
          metaTitle: source.metaTitle,
          metaDescription: source.metaDescription,
          featuredImageId: source.featuredImageId,
          parentId: source.parentId,
          headerMode: source.headerMode,
          footerMode: source.footerMode,
          customHeader: source.customHeader ?? undefined,
          customFooter: source.customFooter ?? undefined,
          showAnnouncement: source.showAnnouncement,
          customAnnouncement: source.customAnnouncement ?? undefined,
        },
      })

      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'page.create',
        targetType: 'page',
        targetId: clone.id,
        details: { clonedFrom: source.id, sourceTitle: source.title, slug },
      })

      return NextResponse.json(
        {
          id: clone.id,
          title: clone.title,
          slug: clone.slug,
          status: clone.status.toLowerCase(),
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Clone page error:', error)
      return NextResponse.json(
        { error: 'Failed to clone page' },
        { status: 500 }
      )
    }
  }
)
