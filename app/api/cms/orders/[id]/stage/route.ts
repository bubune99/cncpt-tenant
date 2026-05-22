/**
 * Order Stage Move API — Atlas Redesign G09
 *
 * PATCH /api/cms/orders/[id]/stage — move order to a workflow stage
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const moveStageSchema = z.object({
  stageId: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (_tenant, user) => {
    try {
      const { id: orderId } = await context.params
      const body: unknown = await request.json()

      const parsed = moveStageSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }
      const { stageId, notes } = parsed.data

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true, currentStageId: true, workflowId: true },
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Validate stage belongs to the order's workflow
      if (order.workflowId) {
        const stage = await prisma.orderWorkflowStage.findFirst({
          where: { id: stageId, workflowId: order.workflowId },
        })
        if (!stage) {
          return NextResponse.json({ error: 'Stage not found in order workflow' }, { status: 400 })
        }
      }

      const [, updatedOrder] = await prisma.$transaction([
        prisma.orderProgress.create({
          data: {
            orderId,
            stageId,
            updatedById: user.id,
            ...(notes ? { notes } : {}),
          },
        }),
        prisma.order.update({
          where: { id: orderId },
          data: { currentStageId: stageId },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            currentStageId: true,
            currentStage: { select: { id: true, displayName: true, color: true } },
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        data: { ...updatedOrder, previousStageId: order.currentStageId },
      })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to move order stage' },
        { status: 500 }
      )
    }
  })
}
