/**
 * System Pages API — list endpoint.
 *
 * GET /api/cms/admin/system-pages
 *
 * Returns the full catalog of system pages (404, 500, maintenance, coming
 * soon) merged with the tenant's customisations. Each entry indicates
 * whether a custom Page row exists, and if so includes its id + status so
 * the admin UI can deep-link straight into the block editor.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { withPermission, type AuthContext } from '@/lib/cms/permissions/middleware'
import { PERMISSIONS } from '@/lib/cms/permissions'
import { SYSTEM_PAGE_CATALOG } from '@/lib/cms/system-pages'

export const dynamic = 'force-dynamic'

export const GET = withPermission(
  PERMISSIONS.PAGES_VIEW,
  async (_request: NextRequest, _context: AuthContext) => {
    try {
      // Tenant scoping is auto-applied by the Prisma middleware via
      // applyTenantMiddleware. The result will only include rows belonging
      // to the current tenant.
      const customised = await prisma.page.findMany({
        where: { systemKey: { not: null } },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          systemKey: true,
          updatedAt: true,
          publishedAt: true,
          content: true,
        },
      })

      const customisedByKey = new Map(
        customised.map((page) => [
          page.systemKey as string,
          {
            id: page.id,
            title: page.title,
            slug: page.slug,
            status: page.status.toLowerCase(),
            hasContent: page.content !== null,
            updatedAt: page.updatedAt,
            publishedAt: page.publishedAt,
          },
        ])
      )

      const items = SYSTEM_PAGE_CATALOG.map((descriptor) => ({
        key: descriptor.key,
        slug: descriptor.slug,
        label: descriptor.label,
        description: descriptor.description,
        defaultTitle: descriptor.defaultTitle,
        defaultMetaDescription: descriptor.defaultMetaDescription,
        available: descriptor.available,
        customized: customisedByKey.get(descriptor.key) ?? null,
      }))

      return NextResponse.json({ items })
    } catch (error) {
      console.error('List system pages error:', error)
      return NextResponse.json(
        { error: 'Failed to list system pages' },
        { status: 500 }
      )
    }
  }
)
