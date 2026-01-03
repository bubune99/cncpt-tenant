/**
 * Order Progress Management
 *
 * Handle stage transitions, reversions, and progress history
 */

import { prisma } from '@/lib/db'
import type {
  ProgressTransitionInput,
  ProgressRevertInput,
  OrderProgressEntry,
  OrderWithProgress,
  CustomerProgressView,
  ProgressSource,
} from './types'

// =============================================================================
// PROGRESS QUERIES
// =============================================================================

/**
 * Get order with full progress history
 */
export async function getOrderProgress(orderId: string): Promise<OrderWithProgress | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      workflow: {
        include: {
          stages: {
            orderBy: { position: 'asc' },
          },
        },
      },
      currentStage: true,
      progress: {
        include: {
          stage: true,
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { enteredAt: 'desc' },
      },
    },
  })

  return order as OrderWithProgress | null
}

/**
 * Get progress history for an order
 */
export async function getProgressHistory(orderId: string): Promise<OrderProgressEntry[]> {
  const progress = await prisma.orderProgress.findMany({
    where: { orderId },
    include: {
      stage: true,
      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { enteredAt: 'desc' },
  })

  return progress as OrderProgressEntry[]
}

/**
 * Get customer-facing progress view
 */
export async function getCustomerProgressView(orderId: string): Promise<CustomerProgressView | null> {
  const order = await getOrderProgress(orderId)
  if (!order || !order.workflow) {
    return null
  }

  // Build completed stages map from progress history
  const completedStages = new Map<string, Date>()
  for (const entry of order.progress) {
    if (entry.exitedAt) {
      completedStages.set(entry.stageId, entry.enteredAt)
    }
  }

  // If current stage exists, mark all previous stages as completed
  if (order.currentStage) {
    const currentPosition = order.currentStage.position
    for (const stage of order.workflow.stages) {
      if (stage.position < currentPosition && !completedStages.has(stage.id)) {
        // Find the progress entry for this stage
        const progressEntry = order.progress.find((p) => p.stageId === stage.id)
        if (progressEntry) {
          completedStages.set(stage.id, progressEntry.enteredAt)
        }
      }
    }
  }

  // Calculate estimated delivery based on current stage and remaining durations
  let estimatedDelivery: Date | null = null
  if (order.currentStage && !order.currentStage.isTerminal) {
    const currentPosition = order.currentStage.position
    let hoursRemaining = 0

    for (const stage of order.workflow.stages) {
      if (stage.position >= currentPosition && stage.estimatedDuration) {
        hoursRemaining += stage.estimatedDuration
      }
    }

    if (hoursRemaining > 0) {
      estimatedDelivery = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000)
    }
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    currentStage: order.currentStage
      ? {
          displayName: order.currentStage.displayName,
          customerMessage: order.currentStage.customerMessage,
          icon: order.currentStage.icon,
          color: order.currentStage.color,
          isTerminal: order.currentStage.isTerminal,
        }
      : null,
    stages: order.workflow.stages.map((stage) => ({
      displayName: stage.displayName,
      icon: stage.icon,
      color: stage.color,
      isCompleted:
        completedStages.has(stage.id) ||
        Boolean(order.currentStage && stage.position < order.currentStage.position),
      isCurrent: order.currentStageId === stage.id,
      completedAt: completedStages.get(stage.id) || null,
    })),
    estimatedDelivery,
  }
}

// =============================================================================
// STAGE TRANSITIONS
// =============================================================================

/**
 * Transition order to a new stage
 */
export async function transitionToStage(input: ProgressTransitionInput): Promise<void> {
  const { orderId, stageId, source = 'manual', isOverride = false, reason, updatedById, notes } = input

  // Get current state
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      workflow: {
        include: {
          stages: {
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Validate the target stage belongs to the order's workflow
  const targetStage = order.workflow?.stages.find((s) => s.id === stageId)
  if (!targetStage) {
    throw new Error('Target stage not found in order workflow')
  }

  // Close out current progress entry if exists
  if (order.currentStageId) {
    await prisma.orderProgress.updateMany({
      where: {
        orderId,
        stageId: order.currentStageId,
        exitedAt: null,
      },
      data: {
        exitedAt: new Date(),
      },
    })
  }

  // Create new progress entry
  await prisma.orderProgress.create({
    data: {
      orderId,
      stageId,
      source,
      isOverride,
      reason,
      updatedById,
      notes,
    },
  })

  // Update order's current stage
  await prisma.order.update({
    where: { id: orderId },
    data: { currentStageId: stageId },
  })

  // TODO: Send notification if stage.notifyCustomer is true
  // This would integrate with the email system
}

/**
 * Advance order to the next stage
 */
export async function advanceToNextStage(
  orderId: string,
  source: ProgressSource = 'manual',
  updatedById?: string,
  notes?: string
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      workflow: {
        include: {
          stages: {
            orderBy: { position: 'asc' },
          },
        },
      },
      currentStage: true,
    },
  })

  if (!order || !order.workflow || !order.currentStage) {
    return false
  }

  // Find next stage
  const currentPosition = order.currentStage.position
  const nextStage = order.workflow.stages.find((s) => s.position === currentPosition + 1)

  if (!nextStage) {
    // Already at final stage
    return false
  }

  await transitionToStage({
    orderId,
    stageId: nextStage.id,
    source,
    updatedById,
    notes,
  })

  return true
}

/**
 * Revert order to a previous stage
 */
export async function revertToStage(input: ProgressRevertInput): Promise<void> {
  const { orderId, targetStageId, reason, updatedById, notes } = input

  // Get current state
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      workflow: {
        include: {
          stages: {
            orderBy: { position: 'asc' },
          },
        },
      },
      currentStage: true,
    },
  })

  if (!order || !order.currentStage) {
    throw new Error('Order not found or has no current stage')
  }

  // Validate target stage
  const targetStage = order.workflow?.stages.find((s) => s.id === targetStageId)
  if (!targetStage) {
    throw new Error('Target stage not found in order workflow')
  }

  // Validate it's actually a reversion (going backwards)
  if (targetStage.position >= order.currentStage.position) {
    throw new Error('Target stage must be before current stage for reversion')
  }

  await transitionToStage({
    orderId,
    stageId: targetStageId,
    source: 'manual',
    isOverride: true,
    reason,
    updatedById,
    notes: notes || `Reverted from "${order.currentStage.displayName}" to "${targetStage.displayName}"`,
  })
}

/**
 * Skip to a specific stage (forward jump)
 */
export async function skipToStage(
  orderId: string,
  targetStageId: string,
  reason: string,
  updatedById?: string,
  notes?: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      workflow: {
        include: {
          stages: {
            orderBy: { position: 'asc' },
          },
        },
      },
      currentStage: true,
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  const targetStage = order.workflow?.stages.find((s) => s.id === targetStageId)
  if (!targetStage) {
    throw new Error('Target stage not found in order workflow')
  }

  await transitionToStage({
    orderId,
    stageId: targetStageId,
    source: 'manual',
    isOverride: true,
    reason,
    updatedById,
    notes,
  })
}

// =============================================================================
// SHIPPO INTEGRATION
// =============================================================================

/**
 * Handle Shippo tracking event and update order stage
 */
export async function handleShippoTrackingEvent(
  orderId: string,
  trackingStatus: string
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      workflow: {
        include: {
          stages: {
            orderBy: { position: 'asc' },
          },
        },
      },
      currentStage: true,
    },
  })

  if (!order || !order.workflow) {
    return false
  }

  // Check if auto-sync is enabled for this order and workflow
  if (!order.trackingAutoSync || !order.workflow.enableShippoSync) {
    return false
  }

  // Find stage matching this tracking event
  const targetStage = order.workflow.stages.find(
    (s) => s.shippoEventTrigger === trackingStatus
  )

  if (!targetStage) {
    // No stage mapped to this event
    return false
  }

  // Only advance forward, never backwards from tracking events
  if (order.currentStage && targetStage.position <= order.currentStage.position) {
    return false
  }

  await transitionToStage({
    orderId,
    stageId: targetStage.id,
    source: 'shippo',
    notes: `Auto-updated from Shippo tracking: ${trackingStatus}`,
  })

  return true
}

/**
 * Sync order progress with current shipment tracking status
 */
export async function syncOrderWithShipment(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shipments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!order || order.shipments.length === 0) {
    return false
  }

  const shipment = order.shipments[0]

  // Map shipment status to Shippo tracking event
  const statusToEvent: Record<string, string> = {
    'LABEL_CREATED': 'PRE_TRANSIT',
    'IN_TRANSIT': 'TRANSIT',
    'OUT_FOR_DELIVERY': 'TRANSIT',
    'DELIVERED': 'DELIVERED',
    'RETURNED': 'RETURNED',
    'FAILED': 'FAILURE',
  }

  const trackingEvent = statusToEvent[shipment.status]
  if (!trackingEvent) {
    return false
  }

  return handleShippoTrackingEvent(orderId, trackingEvent)
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Bulk advance multiple orders to next stage
 */
export async function bulkAdvanceOrders(
  orderIds: string[],
  updatedById?: string,
  notes?: string
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = []
  const failed: string[] = []

  for (const orderId of orderIds) {
    try {
      const advanced = await advanceToNextStage(orderId, 'manual', updatedById, notes)
      if (advanced) {
        success.push(orderId)
      } else {
        failed.push(orderId)
      }
    } catch {
      failed.push(orderId)
    }
  }

  return { success, failed }
}

/**
 * Bulk transition orders to a specific stage
 */
export async function bulkTransitionOrders(
  orderIds: string[],
  stageId: string,
  reason: string,
  updatedById?: string
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = []
  const failed: string[] = []

  for (const orderId of orderIds) {
    try {
      await transitionToStage({
        orderId,
        stageId,
        source: 'manual',
        isOverride: true,
        reason,
        updatedById,
      })
      success.push(orderId)
    } catch {
      failed.push(orderId)
    }
  }

  return { success, failed }
}

// =============================================================================
// TOGGLE AUTO-SYNC
// =============================================================================

/**
 * Enable/disable tracking auto-sync for an order
 */
export async function setOrderTrackingAutoSync(
  orderId: string,
  enabled: boolean
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { trackingAutoSync: enabled },
  })
}
