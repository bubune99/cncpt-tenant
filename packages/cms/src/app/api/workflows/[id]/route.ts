/**
 * Single Workflow API Routes
 *
 * GET    /api/workflows/:id - Get workflow details
 * PUT    /api/workflows/:id - Update workflow
 * DELETE /api/workflows/:id - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
} from '@/lib/order-workflows'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const workflow = await getWorkflow(id)

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error getting workflow:', error)
    return NextResponse.json(
      { error: 'Failed to get workflow' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check for duplicate action
    if (body.action === 'duplicate') {
      if (!body.newName || !body.newSlug) {
        return NextResponse.json(
          { error: 'newName and newSlug are required for duplication' },
          { status: 400 }
        )
      }

      const workflow = await duplicateWorkflow(id, body.newName, body.newSlug)
      return NextResponse.json({ workflow })
    }

    const workflow = await updateWorkflow(id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      isDefault: body.isDefault,
      isActive: body.isActive,
      enableShippoSync: body.enableShippoSync,
    })

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error updating workflow:', error)
    const message = error instanceof Error ? error.message : 'Failed to update workflow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    await deleteWorkflow(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete workflow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
