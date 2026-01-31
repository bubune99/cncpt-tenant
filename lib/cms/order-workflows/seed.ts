/**
 * Order Workflow Seeding
 *
 * Create default workflow templates
 */

import { prisma } from '../db'
import { DEFAULT_WORKFLOW_TEMPLATES } from './types'
import type { WorkflowTemplate } from './types'

/**
 * Seed default workflow templates
 * Safe to run multiple times - skips existing workflows
 */
export async function seedDefaultWorkflows(): Promise<{
  created: string[]
  skipped: string[]
}> {
  const created: string[] = []
  const skipped: string[] = []

  for (const template of DEFAULT_WORKFLOW_TEMPLATES) {
    // Check if workflow already exists
    const existing = await prisma.orderWorkflow.findFirst({
      where: { slug: template.slug, tenantId: null },
    })

    if (existing) {
      skipped.push(template.slug)
      continue
    }

    // Create workflow with stages
    await prisma.orderWorkflow.create({
      data: {
        name: template.name,
        slug: template.slug,
        description: template.description,
        isDefault: template.slug === 'standard-shipping', // Make standard shipping the default
        isActive: true,
        enableShippoSync: template.enableShippoSync,
        stages: {
          create: template.stages.map((stage) => ({
            name: stage.name,
            slug: stage.slug,
            displayName: stage.displayName,
            customerMessage: stage.customerMessage,
            icon: stage.icon,
            color: stage.color,
            position: stage.position,
            isTerminal: stage.isTerminal ?? false,
            notifyCustomer: stage.notifyCustomer ?? true,
            estimatedDuration: stage.estimatedDuration,
            shippoEventTrigger: stage.shippoEventTrigger,
          })),
        },
      },
    })

    created.push(template.slug)
  }

  return { created, skipped }
}

/**
 * Seed a single workflow from a template
 */
export async function seedWorkflowFromTemplate(template: WorkflowTemplate): Promise<string> {
  // Check if workflow already exists
  const existing = await prisma.orderWorkflow.findFirst({
    where: { slug: template.slug, tenantId: null },
  })

  if (existing) {
    throw new Error(`Workflow with slug "${template.slug}" already exists`)
  }

  const workflow = await prisma.orderWorkflow.create({
    data: {
      name: template.name,
      slug: template.slug,
      description: template.description,
      isDefault: false,
      isActive: true,
      enableShippoSync: template.enableShippoSync,
      stages: {
        create: template.stages.map((stage) => ({
          name: stage.name,
          slug: stage.slug,
          displayName: stage.displayName,
          customerMessage: stage.customerMessage,
          icon: stage.icon,
          color: stage.color,
          position: stage.position,
          isTerminal: stage.isTerminal ?? false,
          notifyCustomer: stage.notifyCustomer ?? true,
          estimatedDuration: stage.estimatedDuration,
          shippoEventTrigger: stage.shippoEventTrigger,
        })),
      },
    },
  })

  return workflow.id
}

/**
 * Reset all workflows to defaults
 * WARNING: This will delete all custom workflows and their history
 */
export async function resetToDefaultWorkflows(): Promise<void> {
  // Delete all existing workflows (cascades to stages and progress)
  await prisma.orderProgress.deleteMany({})
  await prisma.orderWorkflowStage.deleteMany({})
  await prisma.orderWorkflow.deleteMany({})

  // Clear workflow assignments from orders
  await prisma.order.updateMany({
    data: {
      workflowId: null,
      currentStageId: null,
    },
  })

  // Clear workflow assignments from products and categories
  await prisma.product.updateMany({
    data: { orderWorkflowId: null },
  })
  await prisma.category.updateMany({
    data: { orderWorkflowId: null },
  })

  // Seed defaults
  await seedDefaultWorkflows()
}

/**
 * Ensure at least one default workflow exists
 * Creates standard shipping workflow if none exists
 */
export async function ensureDefaultWorkflow(): Promise<string> {
  // Check for any default workflow
  const defaultWorkflow = await prisma.orderWorkflow.findFirst({
    where: { isDefault: true, isActive: true },
  })

  if (defaultWorkflow) {
    return defaultWorkflow.id
  }

  // Check for any active workflow
  const anyWorkflow = await prisma.orderWorkflow.findFirst({
    where: { isActive: true },
  })

  if (anyWorkflow) {
    // Make it the default
    await prisma.orderWorkflow.update({
      where: { id: anyWorkflow.id },
      data: { isDefault: true },
    })
    return anyWorkflow.id
  }

  // Create the standard shipping workflow
  const standardTemplate = DEFAULT_WORKFLOW_TEMPLATES.find(
    (t) => t.slug === 'standard-shipping'
  )

  if (!standardTemplate) {
    throw new Error('Standard shipping template not found')
  }

  const workflow = await prisma.orderWorkflow.create({
    data: {
      name: standardTemplate.name,
      slug: standardTemplate.slug,
      description: standardTemplate.description,
      isDefault: true,
      isActive: true,
      enableShippoSync: standardTemplate.enableShippoSync,
      stages: {
        create: standardTemplate.stages.map((stage) => ({
          name: stage.name,
          slug: stage.slug,
          displayName: stage.displayName,
          customerMessage: stage.customerMessage,
          icon: stage.icon,
          color: stage.color,
          position: stage.position,
          isTerminal: stage.isTerminal ?? false,
          notifyCustomer: stage.notifyCustomer ?? true,
          estimatedDuration: stage.estimatedDuration,
          shippoEventTrigger: stage.shippoEventTrigger,
        })),
      },
    },
  })

  return workflow.id
}
