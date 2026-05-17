/**
 * Order Fulfillment API — Atlas Redesign G01
 *
 * GET  /api/cms/orders/[id]/fulfillment  — get order items with fulfillment steps
 * POST /api/cms/orders/[id]/fulfillment/steps  — add a fulfillment step to an item
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const addStepSchema = z.object({
  orderItemId: z.string(),
  name: z.string().min(1).max(100),
  position: z.number().int().optional(),
})

const completeStepSchema = z.object({
  stepId: z.string(),
  completed: z.boolean(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'view', async () => {
    try {
      const { id: orderId } = await context.params

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          items: {
            select: {
              id: true,
              title: true,
              variantTitle: true,
              quantity: true,
              configOptions: true,
              attachments: true,
              fulfillmentSteps: {
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: order })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch fulfillment' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const { id: orderId } = await context.params
      const body: unknown = await request.json()
      const { searchParams } = new URL(request.url)
      const action = searchParams.get('action')

      if (action === 'complete-step') {
        const parsed = completeStepSchema.safeParse(body)
        if (!parsed.success) {
          return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
        }
        const { stepId, completed, notes } = parsed.data

        const step = await prisma.orderItemFulfillmentStep.update({
          where: { id: stepId },
          data: {
            completed,
            completedAt: completed ? new Date() : null,
            ...(notes !== undefined ? { notes } : {}),
          },
        })

        return NextResponse.json({ success: true, data: step })
      }

      // Default: add a step
      const parsed = addStepSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }
      const { orderItemId, name, position } = parsed.data

      // Verify item belongs to order
      const item = await prisma.orderItem.findFirst({ where: { id: orderItemId, orderId } })
      if (!item) {
        return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
      }

      let pos = position
      if (pos === undefined) {
        const last = await prisma.orderItemFulfillmentStep.findFirst({
          where: { orderItemId },
          orderBy: { position: 'desc' },
          select: { position: true },
        })
        pos = (last?.position ?? -1) + 1
      }

      const step = await prisma.orderItemFulfillmentStep.create({
        data: { orderItemId, name, position: pos },
      })

      return NextResponse.json({ success: true, data: step }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update fulfillment' },
        { status: 500 }
      )
    }
  })
}
