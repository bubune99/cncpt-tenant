/**
 * Product Sale Schedules API — Atlas Redesign G06
 *
 * GET    /api/cms/products/[id]/sale-schedules
 * POST   /api/cms/products/[id]/sale-schedules
 * DELETE /api/cms/products/[id]/sale-schedules  (body: scheduleId)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const createScheduleSchema = z.object({
  salePrice: z.number().int().min(0),
  startsAt: z.string(),
  endsAt: z.string(),
  variantId: z.string().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  return withTenant(request, async (tenant) => {
    try {
      const { id: productId } = await context.params

      const product = await prisma.product.findFirst({ where: { id: productId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

      const schedules = await prisma.productSaleSchedule.findMany({
        where: { productId },
        orderBy: { startsAt: 'asc' },
      })

      return NextResponse.json({ success: true, data: schedules })
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

      const parsed = createScheduleSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })

      const product = await prisma.product.findFirst({ where: { id: productId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

      const { salePrice, startsAt, endsAt, variantId } = parsed.data

      const schedule = await prisma.productSaleSchedule.create({
        data: { productId, salePrice, startsAt: new Date(startsAt), endsAt: new Date(endsAt), ...(variantId ? { variantId } : {}) },
      })

      return NextResponse.json({ success: true, data: schedule }, { status: 201 })
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
      const { scheduleId } = z.object({ scheduleId: z.string() }).parse(body)

      const product = await prisma.product.findFirst({ where: { id: productId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

      await prisma.productSaleSchedule.delete({ where: { id: scheduleId } })

      return NextResponse.json({ success: true, data: { deleted: true, scheduleId } })
    } catch (error: unknown) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
    }
  })
}
