/**
 * Order Progress API Routes
 *
 * GET  /api/orders/:id/progress - Get order progress with history
 * POST /api/orders/:id/progress - Transition to a new stage
 * PUT  /api/orders/:id/progress - Revert to previous stage or toggle auto-sync
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderProgress,
  getCustomerProgressView,
  transitionToStage,
  advanceToNextStage,
  revertToStage,
  skipToStage,
  setOrderTrackingAutoSync,
  syncOrderWithShipment,
} from '@/lib/cms/order-workflows/progress'
import {
  initializeOrderWorkflow,
  assignWorkflowToOrder,
} from '@/lib/cms/order-workflows'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params
    const { searchParams } = new URL(request.url)
    const customerView = searchParams.get('customerView') === 'true'

    if (customerView) {
      const progress = await getCustomerProgressView(orderId)
      if (!progress) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      return NextResponse.json({ progress })
    }

    const order = await getOrderProgress(orderId)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error getting order progress:', error)
    return NextResponse.json(
      { error: 'Failed to get order progress' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params
    const body = await request.json()

    // Initialize workflow if not set
    if (body.action === 'initialize') {
      await initializeOrderWorkflow(orderId)
      const order = await getOrderProgress(orderId)
      return NextResponse.json({ order })
    }

    // Assign a specific workflow
    if (body.action === 'assignWorkflow') {
      if (!body.workflowId) {
        return NextResponse.json(
          { error: 'workflowId is required' },
          { status: 400 }
        )
      }
      await assignWorkflowToOrder(orderId, body.workflowId)
      const order = await getOrderProgress(orderId)
      return NextResponse.json({ order })
    }

    // Advance to next stage
    if (body.action === 'advance') {
      const advanced = await advanceToNextStage(
        orderId,
        'manual',
        body.updatedById,
        body.notes
      )

      if (!advanced) {
        return NextResponse.json(
          { error: 'Cannot advance - already at final stage or no workflow' },
          { status: 400 }
        )
      }

      const order = await getOrderProgress(orderId)
      return NextResponse.json({ order })
    }

    // Sync with shipment tracking
    if (body.action === 'syncShipment') {
      const synced = await syncOrderWithShipment(orderId)
      const order = await getOrderProgress(orderId)
      return NextResponse.json({ order, synced })
    }

    // Transition to specific stage
    if (body.stageId) {
      await transitionToStage({
        orderId,
        stageId: body.stageId,
        source: body.source || 'manual',
        isOverride: body.isOverride,
        reason: body.reason,
        updatedById: body.updatedById,
        notes: body.notes,
      })

      const order = await getOrderProgress(orderId)
      return NextResponse.json({ order })
    }

    return NextResponse.json(
      { error: 'action or stageId is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating order progress:', error)
    const message = error instanceof Error ? error.message : 'Failed to update progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params
    const body = await request.json()

    // Toggle auto-sync
    if (body.action === 'toggleAutoSync') {
      await setOrderTrackingAutoSync(orderId, body.enabled)
      const order = await getOrderProgress(orderId)
      return NextResponse.json({ order })
    }

    // Revert to previous stage
    if (body.action === 'revert') {
      if (!body.targetStageId || !body.reason) {
        return NextResponse.json(
          { error: 'targetStageId and reason are required for reversion' },
          { status: 400 }
        )
      }

      await revertToStage({
        orderId,
        targetStageId: body.targetStageId,
        reason: body.reason,
        updatedById: body.updatedById,
        notes: body.notes,
      })

      const order = await getOrderProgress(orderId)
      return NextResponse.json({ order })
    }

    // Skip to a specific stage
    if (body.action === 'skip') {
      if (!body.targetStageId || !body.reason) {
        return NextResponse.json(
          { error: 'targetStageId and reason are required for skipping' },
          { status: 400 }
        )
      }

      await skipToStage(
        orderId,
        body.targetStageId,
        body.reason,
        body.updatedById,
        body.notes
      )

      const order = await getOrderProgress(orderId)
      return NextResponse.json({ order })
    }

    return NextResponse.json(
      { error: 'action is required (toggleAutoSync, revert, or skip)' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating order progress:', error)
    const message = error instanceof Error ? error.message : 'Failed to update progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
