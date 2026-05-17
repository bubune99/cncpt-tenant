/**
 * Product Pricing Tiers API — Atlas Redesign G06
 *
 * GET    /api/cms/products/[id]/pricing-tiers
 * POST   /api/cms/products/[id]/pricing-tiers
 * PUT    /api/cms/products/[id]/pricing-tiers   (body: tierId + fields)
 * DELETE /api/cms/products/[id]/pricing-tiers   (body: tierId)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const createTierSchema = z.object({
  label: z.string().min(1).max(100),
  minQty: z.number().int().min(1),
  maxQty: z.number().int().optional(),
  price: z.number().int().min(0),
  type: z.enum(['QTY', 'MEMBER']).default('QTY'),
})

export async function GET(request: NextRequest, context: RouteContext) {
  return withTenant(request, async (tenant) => {
    try {
      const { id: productId } = await context.params

      const product = await prisma.product.findFirst({ where: { id: productId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

      const tiers = await prisma.productPricingTier.findMany({
        where: { productId },
        orderBy: [{ type: 'asc' }, { minQty: 'asc' }],
      })

      return NextResponse.json({ success: true, data: tiers })
    } catch (error: unknown) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: productId } = await context.params
      const body: unknown = await request.json()

      const parsed = createTierSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })

      const product = await prisma.product.findFirst({ where: { id: productId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

      const tier = await prisma.productPricingTier.create({
        data: { productId, ...parsed.data },
      })

      return NextResponse.json({ success: true, data: tier }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: productId } = await context.params
      const body: unknown = await request.json()
      const { tierId } = z.object({ tierId: z.string() }).parse(body)

      const product = await prisma.product.findFirst({ where: { id: productId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

      await prisma.productPricingTier.delete({ where: { id: tierId } })

      return NextResponse.json({ success: true, data: { deleted: true, tierId } })
    } catch (error: unknown) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
    }
  })
}
