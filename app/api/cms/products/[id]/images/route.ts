/**
 * Product Images API
 *
 * Attach Media library items to a product, and reorder/remove existing
 * attachments.
 *
 * GET    /api/cms/products/[id]/images               — list ProductImage rows
 * POST   /api/cms/products/[id]/images               — attach a media item
 *        body: { mediaId: string; alt?: string|null; position?: number }
 * PATCH  /api/cms/products/[id]/images               — bulk reorder/alt update
 *        body: { items: Array<{ id: string; position?: number; alt?: string|null }> }
 *
 * (Per-image DELETE lives at /images/[imageId]/route.ts.)
 *
 * Tenant-scoped via withTenantAuth — only operators with `edit` access can
 * mutate.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant(request, async () => {
    try {
      const { id } = await params
      const images = await prisma.productImage.findMany({
        where: { productId: id },
        include: { media: true },
        orderBy: { position: 'asc' },
      })
      return NextResponse.json({ images })
    } catch (error) {
      console.error('List product images error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list images' },
        { status: 500 }
      )
    }
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id } = await params
      const body = (await request.json()) as {
        mediaId?: unknown
        alt?: unknown
        position?: unknown
      }

      const mediaId = typeof body.mediaId === 'string' ? body.mediaId : ''
      if (!mediaId) {
        return NextResponse.json({ error: 'mediaId is required' }, { status: 400 })
      }

      const product = await prisma.product.findUnique({ where: { id } })
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // Explicit tenant scope on the media lookup (IDOR guard — don't attach
      // another tenant's media to this product).
      const media = await prisma.media.findFirst({ where: { id: mediaId, tenantId: tenant.tenantId } })
      if (!media) {
        return NextResponse.json({ error: 'Media not found' }, { status: 404 })
      }

      // Default position = end of current order.
      const last = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { position: 'desc' },
        select: { position: true },
      })
      const nextPosition =
        typeof body.position === 'number'
          ? body.position
          : (last?.position ?? -1) + 1

      const created = await prisma.productImage.create({
        data: {
          productId: id,
          mediaId,
          alt: typeof body.alt === 'string' ? body.alt : null,
          position: nextPosition,
        },
        include: { media: true },
      })

      return NextResponse.json({ image: created }, { status: 201 })
    } catch (error) {
      console.error('Attach product image error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to attach image' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const { id } = await params
      const body = (await request.json()) as {
        items?: Array<{ id: unknown; position?: unknown; alt?: unknown }>
      }
      const items = Array.isArray(body.items) ? body.items : []
      if (items.length === 0) {
        return NextResponse.json({ ok: true, updated: 0 })
      }

      // Make sure each id belongs to this product before mutating.
      const ids = items
        .map((it) => (typeof it.id === 'string' ? it.id : ''))
        .filter(Boolean)
      const existing = await prisma.productImage.findMany({
        where: { productId: id, id: { in: ids } },
        select: { id: true },
      })
      const ownedIds = new Set(existing.map((e) => e.id))

      const updates = items
        .filter((it) => typeof it.id === 'string' && ownedIds.has(it.id))
        .map((it) =>
          prisma.productImage.update({
            where: { id: it.id as string },
            data: {
              position: typeof it.position === 'number' ? it.position : undefined,
              alt: typeof it.alt === 'string' ? it.alt : it.alt === null ? null : undefined,
            },
          })
        )

      await prisma.$transaction(updates)
      return NextResponse.json({ ok: true, updated: updates.length })
    } catch (error) {
      console.error('Reorder product images error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update images' },
        { status: 500 }
      )
    }
  })
}
