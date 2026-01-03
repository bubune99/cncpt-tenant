/**
 * Order Workflows - Core CRUD Operations
 *
 * Manage order workflow templates and stages
 */

import { prisma } from '@/lib/db'
import type {
  WorkflowCreateInput,
  WorkflowUpdateInput,
  WorkflowStageInput,
  StageUpdateInput,
  WorkflowWithStages,
  WorkflowStage,
} from './types'

// =============================================================================
// WORKFLOW CRUD
// =============================================================================

/**
 * List all workflows
 */
export async function listWorkflows(includeInactive = false): Promise<WorkflowWithStages[]> {
  const workflows = await prisma.orderWorkflow.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      stages: {
        orderBy: { position: 'asc' },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  })

  return workflows as WorkflowWithStages[]
}

/**
 * Get a single workflow by ID or slug
 */
export async function getWorkflow(idOrSlug: string): Promise<WorkflowWithStages | null> {
  const workflow = await prisma.orderWorkflow.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      stages: {
        orderBy: { position: 'asc' },
      },
    },
  })

  return workflow as WorkflowWithStages | null
}

/**
 * Get the default workflow
 */
export async function getDefaultWorkflow(): Promise<WorkflowWithStages | null> {
  const workflow = await prisma.orderWorkflow.findFirst({
    where: { isDefault: true, isActive: true },
    include: {
      stages: {
        orderBy: { position: 'asc' },
      },
    },
  })

  return workflow as WorkflowWithStages | null
}

/**
 * Create a new workflow with stages
 */
export async function createWorkflow(input: WorkflowCreateInput): Promise<WorkflowWithStages> {
  const { stages, ...workflowData } = input

  // If setting as default, unset other defaults first
  if (workflowData.isDefault) {
    await prisma.orderWorkflow.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })
  }

  const workflow = await prisma.orderWorkflow.create({
    data: {
      ...workflowData,
      stages: stages
        ? {
            create: stages.map((stage, index) => ({
              ...stage,
              position: stage.position ?? index,
            })),
          }
        : undefined,
    },
    include: {
      stages: {
        orderBy: { position: 'asc' },
      },
    },
  })

  return workflow as WorkflowWithStages
}

/**
 * Update a workflow
 */
export async function updateWorkflow(
  id: string,
  input: WorkflowUpdateInput
): Promise<WorkflowWithStages> {
  // If setting as default, unset other defaults first
  if (input.isDefault) {
    await prisma.orderWorkflow.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    })
  }

  const workflow = await prisma.orderWorkflow.update({
    where: { id },
    data: input,
    include: {
      stages: {
        orderBy: { position: 'asc' },
      },
    },
  })

  return workflow as WorkflowWithStages
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string): Promise<void> {
  // Check if any orders are using this workflow
  const orderCount = await prisma.order.count({
    where: { workflowId: id },
  })

  if (orderCount > 0) {
    throw new Error(`Cannot delete workflow: ${orderCount} orders are using it`)
  }

  await prisma.orderWorkflow.delete({
    where: { id },
  })
}

/**
 * Duplicate a workflow
 */
export async function duplicateWorkflow(
  id: string,
  newName: string,
  newSlug: string
): Promise<WorkflowWithStages> {
  const original = await getWorkflow(id)
  if (!original) {
    throw new Error('Workflow not found')
  }

  return createWorkflow({
    name: newName,
    slug: newSlug,
    description: original.description || undefined,
    isDefault: false,
    isActive: true,
    enableShippoSync: original.enableShippoSync,
    stages: original.stages.map((stage) => ({
      name: stage.name,
      slug: stage.slug,
      displayName: stage.displayName,
      customerMessage: stage.customerMessage || undefined,
      icon: stage.icon || undefined,
      color: stage.color || undefined,
      position: stage.position,
      isTerminal: stage.isTerminal,
      notifyCustomer: stage.notifyCustomer,
      estimatedDuration: stage.estimatedDuration || undefined,
      shippoEventTrigger: (stage.shippoEventTrigger as any) || null,
    })),
  })
}

// =============================================================================
// STAGE CRUD
// =============================================================================

/**
 * Get a single stage
 */
export async function getStage(id: string): Promise<WorkflowStage | null> {
  const stage = await prisma.orderWorkflowStage.findUnique({
    where: { id },
  })

  return stage as WorkflowStage | null
}

/**
 * Add a stage to a workflow
 */
export async function addStage(
  workflowId: string,
  input: WorkflowStageInput
): Promise<WorkflowStage> {
  // If no position specified, add at end
  if (input.position === undefined) {
    const lastStage = await prisma.orderWorkflowStage.findFirst({
      where: { workflowId },
      orderBy: { position: 'desc' },
    })
    input.position = lastStage ? lastStage.position + 1 : 0
  }

  // Shift existing stages if needed
  await prisma.orderWorkflowStage.updateMany({
    where: {
      workflowId,
      position: { gte: input.position },
    },
    data: {
      position: { increment: 1 },
    },
  })

  const stage = await prisma.orderWorkflowStage.create({
    data: {
      workflowId,
      ...input,
    },
  })

  return stage as WorkflowStage
}

/**
 * Update a stage
 */
export async function updateStage(id: string, input: StageUpdateInput): Promise<WorkflowStage> {
  const stage = await prisma.orderWorkflowStage.update({
    where: { id },
    data: input,
  })

  return stage as WorkflowStage
}

/**
 * Delete a stage
 */
export async function deleteStage(id: string): Promise<void> {
  // Check if any orders are at this stage
  const orderCount = await prisma.order.count({
    where: { currentStageId: id },
  })

  if (orderCount > 0) {
    throw new Error(`Cannot delete stage: ${orderCount} orders are currently at this stage`)
  }

  const stage = await prisma.orderWorkflowStage.findUnique({
    where: { id },
  })

  if (!stage) {
    throw new Error('Stage not found')
  }

  // Delete the stage
  await prisma.orderWorkflowStage.delete({
    where: { id },
  })

  // Reorder remaining stages
  await prisma.orderWorkflowStage.updateMany({
    where: {
      workflowId: stage.workflowId,
      position: { gt: stage.position },
    },
    data: {
      position: { decrement: 1 },
    },
  })
}

/**
 * Reorder stages within a workflow
 */
export async function reorderStages(
  workflowId: string,
  stageIds: string[]
): Promise<WorkflowStage[]> {
  // Update positions in a transaction
  await prisma.$transaction(
    stageIds.map((stageId, index) =>
      prisma.orderWorkflowStage.update({
        where: { id: stageId },
        data: { position: index },
      })
    )
  )

  const stages = await prisma.orderWorkflowStage.findMany({
    where: { workflowId },
    orderBy: { position: 'asc' },
  })

  return stages as WorkflowStage[]
}

// =============================================================================
// WORKFLOW ASSIGNMENT
// =============================================================================

/**
 * Determine the workflow for an order based on its items
 * Priority: Product workflow > Category workflow > Default workflow
 */
export async function determineOrderWorkflow(orderId: string): Promise<string | null> {
  // Get order items with product and category info
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      product: {
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  })

  // Check for product-level workflow
  for (const item of orderItems) {
    if (item.product.orderWorkflowId) {
      return item.product.orderWorkflowId
    }
  }

  // Check for category-level workflow
  for (const item of orderItems) {
    for (const pc of item.product.categories) {
      if (pc.category.orderWorkflowId) {
        return pc.category.orderWorkflowId
      }
    }
  }

  // Fall back to default workflow
  const defaultWorkflow = await getDefaultWorkflow()
  return defaultWorkflow?.id || null
}

/**
 * Assign a workflow to an order
 */
export async function assignWorkflowToOrder(
  orderId: string,
  workflowId: string | null
): Promise<void> {
  // Get the first stage of the workflow
  let firstStageId: string | null = null

  if (workflowId) {
    const workflow = await getWorkflow(workflowId)
    if (workflow && workflow.stages.length > 0) {
      firstStageId = workflow.stages[0].id
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      workflowId,
      currentStageId: firstStageId,
    },
  })
}

/**
 * Initialize workflow for a new order
 */
export async function initializeOrderWorkflow(orderId: string): Promise<void> {
  const workflowId = await determineOrderWorkflow(orderId)

  if (workflowId) {
    await assignWorkflowToOrder(orderId, workflowId)

    // Create initial progress entry
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { currentStageId: true },
    })

    if (order?.currentStageId) {
      await prisma.orderProgress.create({
        data: {
          orderId,
          stageId: order.currentStageId,
          source: 'system',
          notes: 'Order created - workflow initialized',
        },
      })
    }
  }
}

// Re-export types
export * from './types'
