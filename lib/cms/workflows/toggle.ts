/**
 * Workflow Toggle Service
 *
 * Manages workflow enabled/disabled states with validation,
 * event subscription management, and execution tracking.
 */

import { prisma } from '../db'
import type { Workflow, WorkflowTrigger } from '@prisma/client'
import { eventBus, subscribe, unsubscribe } from './event-bus'

// =============================================================================
// TYPES
// =============================================================================

export interface ToggleResult {
  success: boolean
  workflow?: Workflow
  error?: string
  message?: string
}

export interface BulkToggleResult {
  success: boolean
  results: Array<{
    workflowId: string
    success: boolean
    enabled?: boolean
    error?: string
  }>
  enabledCount: number
  disabledCount: number
  errorCount: number
}

export interface WorkflowStatus {
  id: string
  name: string
  slug: string
  enabled: boolean
  triggerType: WorkflowTrigger
  lastRunAt: Date | null
  executionCount: number
  successCount: number
  failureCount: number
  successRate: number
}

// Track active event subscriptions for cleanup
const activeSubscriptions = new Map<string, () => void>()

// =============================================================================
// SINGLE WORKFLOW TOGGLE
// =============================================================================

/**
 * Enable a workflow
 */
export async function enableWorkflow(workflowId: string): Promise<ToggleResult> {
  return setWorkflowEnabled(workflowId, true)
}

/**
 * Disable a workflow
 */
export async function disableWorkflow(workflowId: string): Promise<ToggleResult> {
  return setWorkflowEnabled(workflowId, false)
}

/**
 * Toggle a workflow's enabled state
 */
export async function toggleWorkflow(workflowId: string): Promise<ToggleResult> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  })

  if (!workflow) {
    return {
      success: false,
      error: `Workflow not found: ${workflowId}`
    }
  }

  return setWorkflowEnabled(workflowId, !workflow.enabled)
}

/**
 * Set workflow enabled state with validation
 */
async function setWorkflowEnabled(
  workflowId: string,
  enabled: boolean
): Promise<ToggleResult> {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        workflowNodes: true
      }
    })

    if (!workflow) {
      return {
        success: false,
        error: `Workflow not found: ${workflowId}`
      }
    }

    // If enabling, validate workflow is ready
    if (enabled) {
      const validation = validateWorkflowForEnable(workflow)
      if (!validation.valid) {
        return {
          success: false,
          error: `Cannot enable workflow: ${validation.errors.join(', ')}`
        }
      }
    }

    // Update the workflow
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: { enabled }
    })

    // Handle event subscriptions based on trigger type
    if (enabled) {
      await activateWorkflowTrigger(updatedWorkflow)
    } else {
      await deactivateWorkflowTrigger(updatedWorkflow)
    }

    return {
      success: true,
      workflow: updatedWorkflow,
      message: `Workflow ${enabled ? 'enabled' : 'disabled'} successfully`
    }
  } catch (error) {
    console.error('Failed to toggle workflow:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Enable multiple workflows
 */
export async function enableWorkflows(workflowIds: string[]): Promise<BulkToggleResult> {
  return bulkSetEnabled(workflowIds, true)
}

/**
 * Disable multiple workflows
 */
export async function disableWorkflows(workflowIds: string[]): Promise<BulkToggleResult> {
  return bulkSetEnabled(workflowIds, false)
}

/**
 * Disable all workflows (emergency stop)
 */
export async function disableAllWorkflows(): Promise<BulkToggleResult> {
  const enabledWorkflows = await prisma.workflow.findMany({
    where: { enabled: true },
    select: { id: true }
  })

  const workflowIds = enabledWorkflows.map(w => w.id)

  if (workflowIds.length === 0) {
    return {
      success: true,
      results: [],
      enabledCount: 0,
      disabledCount: 0,
      errorCount: 0
    }
  }

  return bulkSetEnabled(workflowIds, false)
}

/**
 * Enable all workflows by category
 */
export async function enableWorkflowsByCategory(
  templateCategory: string
): Promise<BulkToggleResult> {
  const workflows = await prisma.workflow.findMany({
    where: {
      template: { category: templateCategory as any }
    },
    select: { id: true }
  })

  return bulkSetEnabled(workflows.map(w => w.id), true)
}

/**
 * Disable all workflows by trigger type
 */
export async function disableWorkflowsByTrigger(
  triggerType: WorkflowTrigger
): Promise<BulkToggleResult> {
  const workflows = await prisma.workflow.findMany({
    where: { triggerType, enabled: true },
    select: { id: true }
  })

  return bulkSetEnabled(workflows.map(w => w.id), false)
}

/**
 * Bulk set enabled state for multiple workflows
 */
async function bulkSetEnabled(
  workflowIds: string[],
  enabled: boolean
): Promise<BulkToggleResult> {
  const results: BulkToggleResult['results'] = []
  let enabledCount = 0
  let disabledCount = 0
  let errorCount = 0

  for (const workflowId of workflowIds) {
    const result = await setWorkflowEnabled(workflowId, enabled)

    if (result.success) {
      if (enabled) enabledCount++
      else disabledCount++
    } else {
      errorCount++
    }

    results.push({
      workflowId,
      success: result.success,
      enabled: result.workflow?.enabled,
      error: result.error
    })
  }

  return {
    success: errorCount === 0,
    results,
    enabledCount,
    disabledCount,
    errorCount
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate that a workflow is ready to be enabled
 */
function validateWorkflowForEnable(workflow: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for trigger node
  const nodes = workflow.nodes as any[]
  const hasTrigger = nodes.some(
    node => node.type === 'trigger' || node.data?.stepType === 'TRIGGER'
  )

  if (!hasTrigger) {
    errors.push('Workflow must have a trigger node')
  }

  // Check for at least one action
  const hasAction = nodes.some(
    node => node.type === 'primitive' ||
           node.type === 'action' ||
           node.data?.stepType === 'ACTION'
  )

  if (!hasAction) {
    warnings.push('Workflow has no action nodes')
  }

  // Check trigger configuration for scheduled/event workflows
  if (workflow.triggerType === 'SCHEDULE') {
    const triggerConfig = workflow.triggerConfig as any
    if (!triggerConfig?.cron) {
      errors.push('Scheduled workflow must have a cron expression')
    }
  }

  if (workflow.triggerType === 'EVENT') {
    const triggerConfig = workflow.triggerConfig as any
    if (!triggerConfig?.eventType) {
      errors.push('Event workflow must specify an event type')
    }
  }

  if (workflow.triggerType === 'WEBHOOK') {
    const triggerConfig = workflow.triggerConfig as any
    if (!triggerConfig?.path) {
      errors.push('Webhook workflow must specify a path')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if a workflow can be enabled
 */
export async function canEnableWorkflow(workflowId: string): Promise<{
  canEnable: boolean
  validation: ValidationResult
}> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { workflowNodes: true }
  })

  if (!workflow) {
    return {
      canEnable: false,
      validation: {
        valid: false,
        errors: ['Workflow not found'],
        warnings: []
      }
    }
  }

  const validation = validateWorkflowForEnable(workflow)

  return {
    canEnable: validation.valid,
    validation
  }
}

// =============================================================================
// TRIGGER MANAGEMENT
// =============================================================================

/**
 * Activate a workflow's trigger (subscribe to events, register webhook, etc.)
 */
async function activateWorkflowTrigger(workflow: Workflow): Promise<void> {
  const triggerConfig = workflow.triggerConfig as Record<string, any> ?? {}

  switch (workflow.triggerType) {
    case 'EVENT':
      await activateEventTrigger(workflow, triggerConfig)
      break

    case 'SCHEDULE':
      // Scheduled workflows are handled by a cron job that checks getScheduledWorkflows()
      // No additional activation needed
      break

    case 'WEBHOOK':
      // Webhook workflows are handled by the webhook API route
      // No additional activation needed, but log for debugging
      console.log(`Activated webhook workflow: ${workflow.slug} at path ${triggerConfig.path}`)
      break

    case 'MANUAL':
      // Manual workflows are triggered by user action
      // No activation needed
      break

    case 'AI_AGENT':
      // AI agent workflows are triggered by the AI system
      // No additional activation needed
      break
  }
}

/**
 * Deactivate a workflow's trigger
 */
async function deactivateWorkflowTrigger(workflow: Workflow): Promise<void> {
  // Remove event subscription if exists
  const unsubscribeFn = activeSubscriptions.get(workflow.id)
  if (unsubscribeFn) {
    unsubscribeFn()
    activeSubscriptions.delete(workflow.id)
  }
}

/**
 * Activate an event-based trigger
 */
async function activateEventTrigger(
  workflow: Workflow,
  triggerConfig: Record<string, any>
): Promise<void> {
  const eventType = triggerConfig.eventType

  if (!eventType) {
    console.warn(`Event workflow ${workflow.id} has no eventType configured`)
    return
  }

  // Subscribe to the event
  const subscriptionId = subscribe({
    eventType,
    handler: async (event) => {
      try {
        // Import executeWorkflow dynamically to avoid circular dependency
        const { executeWorkflow } = await import('./engine')

        // Check event filters if configured
        if (triggerConfig.filters) {
          const matches = matchEventFilters(event.data as Record<string, unknown>, triggerConfig.filters)
          if (!matches) return
        }

        // Execute the workflow
        await executeWorkflow(workflow.id, {
          triggeredBy: 'event',
          eventData: {
            type: eventType,
            data: event.data,
            timestamp: event.timestamp
          }
        })
      } catch (error) {
        console.error(`Failed to execute workflow ${workflow.id} for event ${eventType}:`, error)
      }
    }
  })

  // Store the unsubscribe function for cleanup
  activeSubscriptions.set(workflow.id, () => unsubscribe(subscriptionId))

  console.log(`Activated event trigger for workflow ${workflow.slug}: ${eventType}`)
}

/**
 * Check if event data matches configured filters
 */
function matchEventFilters(
  eventData: Record<string, any>,
  filters: Record<string, any>
): boolean {
  for (const [key, value] of Object.entries(filters)) {
    const eventValue = getNestedValue(eventData, key)

    if (typeof value === 'object' && value !== null) {
      // Handle operators like { $gt: 100, $lt: 200 }
      for (const [op, opValue] of Object.entries(value as Record<string, any>)) {
        switch (op) {
          case '$eq':
            if (eventValue !== opValue) return false
            break
          case '$ne':
            if (eventValue === opValue) return false
            break
          case '$gt':
            if (!(eventValue > opValue)) return false
            break
          case '$gte':
            if (!(eventValue >= opValue)) return false
            break
          case '$lt':
            if (!(eventValue < opValue)) return false
            break
          case '$lte':
            if (!(eventValue <= opValue)) return false
            break
          case '$in':
            if (!Array.isArray(opValue) || !opValue.includes(eventValue)) return false
            break
          case '$nin':
            if (!Array.isArray(opValue) || opValue.includes(eventValue)) return false
            break
          case '$contains':
            if (typeof eventValue !== 'string' || !eventValue.includes(opValue)) return false
            break
        }
      }
    } else {
      // Simple equality check
      if (eventValue !== value) return false
    }
  }

  return true
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// =============================================================================
// STATUS QUERIES
// =============================================================================

/**
 * Get workflow status summary
 */
export async function getWorkflowStatus(workflowId: string): Promise<WorkflowStatus | null> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  })

  if (!workflow) return null

  const successRate = workflow.executionCount > 0
    ? (workflow.successCount / workflow.executionCount) * 100
    : 0

  return {
    id: workflow.id,
    name: workflow.name,
    slug: workflow.slug,
    enabled: workflow.enabled,
    triggerType: workflow.triggerType,
    lastRunAt: workflow.lastRunAt,
    executionCount: workflow.executionCount,
    successCount: workflow.successCount,
    failureCount: workflow.failureCount,
    successRate: Math.round(successRate * 100) / 100
  }
}

/**
 * Get all workflow statuses
 */
export async function getAllWorkflowStatuses(): Promise<WorkflowStatus[]> {
  const workflows = await prisma.workflow.findMany({
    orderBy: [
      { enabled: 'desc' },
      { name: 'asc' }
    ]
  })

  return workflows.map(workflow => {
    const successRate = workflow.executionCount > 0
      ? (workflow.successCount / workflow.executionCount) * 100
      : 0

    return {
      id: workflow.id,
      name: workflow.name,
      slug: workflow.slug,
      enabled: workflow.enabled,
      triggerType: workflow.triggerType,
      lastRunAt: workflow.lastRunAt,
      executionCount: workflow.executionCount,
      successCount: workflow.successCount,
      failureCount: workflow.failureCount,
      successRate: Math.round(successRate * 100) / 100
    }
  })
}

/**
 * Get enabled workflows count by trigger type
 */
export async function getEnabledWorkflowCounts(): Promise<Record<WorkflowTrigger, number>> {
  const counts = await prisma.workflow.groupBy({
    by: ['triggerType'],
    where: { enabled: true },
    _count: true
  })

  const result: Record<string, number> = {
    MANUAL: 0,
    SCHEDULE: 0,
    WEBHOOK: 0,
    EVENT: 0,
    AI_AGENT: 0
  }

  counts.forEach(c => {
    result[c.triggerType] = c._count
  })

  return result as Record<WorkflowTrigger, number>
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize all enabled event-based workflows on app startup
 */
export async function initializeEventWorkflows(): Promise<void> {
  const eventWorkflows = await prisma.workflow.findMany({
    where: {
      enabled: true,
      triggerType: 'EVENT'
    }
  })

  console.log(`Initializing ${eventWorkflows.length} event workflows...`)

  for (const workflow of eventWorkflows) {
    try {
      await activateWorkflowTrigger(workflow)
    } catch (error) {
      console.error(`Failed to initialize workflow ${workflow.id}:`, error)
    }
  }

  console.log('Event workflow initialization complete')
}

/**
 * Cleanup all active subscriptions (for shutdown)
 */
export function cleanupAllSubscriptions(): void {
  console.log(`Cleaning up ${activeSubscriptions.size} workflow subscriptions...`)

  for (const [workflowId, unsubscribeFn] of activeSubscriptions) {
    try {
      unsubscribeFn()
    } catch (error) {
      console.error(`Failed to cleanup subscription for workflow ${workflowId}:`, error)
    }
  }

  activeSubscriptions.clear()
  console.log('Workflow subscription cleanup complete')
}
