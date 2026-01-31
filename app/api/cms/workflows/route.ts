/**
 * Workflows API Routes
 *
 * GET  /api/workflows - List all workflows
 * POST /api/workflows - Create a new workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  listWorkflows,
  createWorkflow,
  getDefaultWorkflow,
} from '@/lib/cms/order-workflows'
import { seedDefaultWorkflows } from '@/lib/cms/order-workflows/seed'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const workflows = await listWorkflows(includeInactive)

    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('Error listing workflows:', error)
    return NextResponse.json(
      { error: 'Failed to list workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check for special seed action
    if (body.action === 'seed') {
      const result = await seedDefaultWorkflows()
      return NextResponse.json({
        message: 'Default workflows seeded',
        ...result,
      })
    }

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const workflow = await createWorkflow({
      name: body.name,
      slug: body.slug,
      description: body.description,
      isDefault: body.isDefault,
      isActive: body.isActive ?? true,
      enableShippoSync: body.enableShippoSync ?? true,
      stages: body.stages,
    })

    return NextResponse.json({ workflow }, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    const message = error instanceof Error ? error.message : 'Failed to create workflow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
