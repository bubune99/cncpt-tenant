/**
 * Workflow Stages API Routes
 *
 * POST /api/workflows/:id/stages - Add a new stage
 * PUT  /api/workflows/:id/stages - Reorder stages
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  addStage,
  updateStage,
  deleteStage,
  reorderStages,
  getWorkflow,
} from '@/lib/cms/order-workflows'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workflowId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug || !body.displayName) {
      return NextResponse.json(
        { error: 'name, slug, and displayName are required' },
        { status: 400 }
      )
    }

    const stage = await addStage(workflowId, {
      name: body.name,
      slug: body.slug,
      displayName: body.displayName,
      customerMessage: body.customerMessage,
      icon: body.icon,
      color: body.color,
      position: body.position,
      isTerminal: body.isTerminal,
      notifyCustomer: body.notifyCustomer,
      estimatedDuration: body.estimatedDuration,
      shippoEventTrigger: body.shippoEventTrigger,
    })

    return NextResponse.json({ stage }, { status: 201 })
  } catch (error) {
    console.error('Error adding stage:', error)
    const message = error instanceof Error ? error.message : 'Failed to add stage'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workflowId } = await params
    const body = await request.json()

    // Check for reorder action
    if (body.action === 'reorder' && Array.isArray(body.stageIds)) {
      const stages = await reorderStages(workflowId, body.stageIds)
      return NextResponse.json({ stages })
    }

    // Update single stage
    if (body.stageId) {
      const stage = await updateStage(body.stageId, {
        name: body.name,
        slug: body.slug,
        displayName: body.displayName,
        customerMessage: body.customerMessage,
        icon: body.icon,
        color: body.color,
        position: body.position,
        isTerminal: body.isTerminal,
        notifyCustomer: body.notifyCustomer,
        estimatedDuration: body.estimatedDuration,
        shippoEventTrigger: body.shippoEventTrigger,
      })

      return NextResponse.json({ stage })
    }

    return NextResponse.json(
      { error: 'stageId or action=reorder with stageIds is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating stage:', error)
    const message = error instanceof Error ? error.message : 'Failed to update stage'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url)
    const stageId = searchParams.get('stageId')

    if (!stageId) {
      return NextResponse.json(
        { error: 'stageId query parameter is required' },
        { status: 400 }
      )
    }

    await deleteStage(stageId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stage:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete stage'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
