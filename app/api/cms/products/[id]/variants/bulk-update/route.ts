/**
 * Bulk Variant Update API — Atlas Redesign G12
 *
 * POST /api/cms/products/[id]/variants/bulk-update
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    variantId: z.string(),
    price: z.number().int().optional(),
    stock: z.number().int().optional(),
    sku: z.string().optional(),
    enabled: z.boolean().optional(),
    customFieldValues: z.record(z.string(), z.unknown()).optional(),
  })).min(1).max(200),
})

export async function POST(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: productId } = await context.params
      const body: unknown = await request.json()

      const parsed = bulkUpdateSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const product = await prisma.product.findFirst({ where: { id: productId, tenantId: tenant.tenantId }, select: { id: true, title: true } })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

      const { updates } = parsed.data

      const results = await prisma.$transaction(
        updates.map(({ variantId, price, stock, sku, enabled }) =>
          prisma.productVariant.update({
            where: { id: variantId },
            data: {
              ...(price !== undefined ? { price } : {}),
              ...(stock !== undefined ? { stock } : {}),
              ...(sku !== undefined ? { sku } : {}),
              ...(enabled !== undefined ? { enabled } : {}),
            },
            select: { id: true, price: true, stock: true, sku: true },
          })
        )
      )

      return NextResponse.json({
        success: true,
        data: { updated: results.length, variants: results },
      })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Bulk update failed' },
        { status: 500 }
      )
    }
  })
}
