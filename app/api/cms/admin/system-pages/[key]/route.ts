/**
 * System Pages API — per-key endpoint.
 *
 * POST   /api/cms/admin/system-pages/[key]   Create the tenant's custom row
 *                                            for this system key (idempotent
 *                                            — returns the existing row if
 *                                            already created).
 * DELETE /api/cms/admin/system-pages/[key]   Reset to default (delete the
 *                                            tenant's custom row).
 *
 * `[key]` is one of the SystemPageKey enum values (NOT_FOUND, etc.). MVP
 * only allows customising NOT_FOUND — the others return 400 until shipped.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { SystemPageKey } from '@prisma/client'
import { prisma } from '@/lib/cms/db'
import { withPermission, type AuthContext } from '@/lib/cms/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/cms/permissions'
import { getSystemPageDescriptor } from '@/lib/cms/system-pages'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ key: string }>
}

/**
 * Resolve the URL `[key]` segment to a known SystemPageKey, or null if
 * unknown / not yet available for customisation.
 */
function resolveKey(rawKey: string): {
  ok: false
  status: number
  message: string
} | {
  ok: true
  key: SystemPageKey
  descriptor: NonNullable<ReturnType<typeof getSystemPageDescriptor>>
} {
  const descriptor = getSystemPageDescriptor(rawKey)
  if (!descriptor) {
    return { ok: false, status: 404, message: 'Unknown system page key' }
  }
  if (!descriptor.available) {
    return {
      ok: false,
      status: 400,
      message: `System page "${descriptor.label}" is not yet available for customisation.`,
    }
  }
  return { ok: true, key: descriptor.key, descriptor }
}

// POST — create (or return existing) the tenant's custom system page row.
export const POST = withPermission(
  PERMISSIONS.PAGES_CREATE,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { key: rawKey } = await params
      const resolved = resolveKey(rawKey)
      if (!resolved.ok) {
        return NextResponse.json(
          { error: resolved.message },
          { status: resolved.status }
        )
      }

      // Idempotent: if a row already exists return it untouched.
      const existing = await prisma.page.findFirst({
        where: { systemKey: resolved.key },
      })

      if (existing) {
        return NextResponse.json(
          {
            id: existing.id,
            slug: existing.slug,
            systemKey: existing.systemKey,
            status: existing.status.toLowerCase(),
            alreadyExists: true,
          },
          { status: 200 }
        )
      }

      // Create with sensible defaults. Status starts as DRAFT — admin must
      // explicitly publish from the editor before the tenant's custom 404
      // takes over from the platform default.
      const created = await prisma.page.create({
        data: {
          title: resolved.descriptor.defaultTitle,
          slug: resolved.descriptor.slug,
          status: 'DRAFT',
          systemKey: resolved.key,
          metaTitle: resolved.descriptor.defaultTitle,
          metaDescription: resolved.descriptor.defaultMetaDescription,
        },
      })

      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'system-page.create',
        targetType: 'page',
        targetId: created.id,
        details: {
          systemKey: resolved.key,
          slug: created.slug,
        },
      })

      return NextResponse.json(
        {
          id: created.id,
          slug: created.slug,
          systemKey: created.systemKey,
          status: created.status.toLowerCase(),
          alreadyExists: false,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Create system page error:', error)
      return NextResponse.json(
        { error: 'Failed to create system page' },
        { status: 500 }
      )
    }
  }
)

// DELETE — reset to default by removing the tenant's custom row.
export const DELETE = withPermission(
  PERMISSIONS.PAGES_DELETE,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { key: rawKey } = await params
      const resolved = resolveKey(rawKey)
      if (!resolved.ok) {
        return NextResponse.json(
          { error: resolved.message },
          { status: resolved.status }
        )
      }

      const existing = await prisma.page.findFirst({
        where: { systemKey: resolved.key },
      })

      if (!existing) {
        // Nothing to reset — already on the default. 200 is intentional
        // (idempotent reset) so the admin UI doesn't show a confusing error.
        return NextResponse.json({ reset: true, alreadyDefault: true })
      }

      await prisma.page.delete({ where: { id: existing.id } })

      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'system-page.reset',
        targetType: 'page',
        targetId: existing.id,
        details: {
          systemKey: resolved.key,
          slug: existing.slug,
        },
      })

      return NextResponse.json({ reset: true, alreadyDefault: false })
    } catch (error) {
      console.error('Reset system page error:', error)
      return NextResponse.json(
        { error: 'Failed to reset system page' },
        { status: 500 }
      )
    }
  }
)
