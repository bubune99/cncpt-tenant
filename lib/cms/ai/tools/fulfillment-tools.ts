/**
 * Fulfillment Tools — Atlas Redesign G01
 *
 * Agent tools for reading and updating per-line-item fulfillment steps.
 */

import { tool } from 'ai'
import { z } from 'zod'

async function getDb() {
  const { prisma } = await import('../../db')
  return prisma
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 5000,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error: unknown) {
    clearTimeout(timeoutId!)
    throw error
  }
}

export const getOrderFulfillment = tool({
  description: 'Get per-line fulfillment steps for an order, showing step name, position, and completion state.',
  inputSchema: z.object({
    orderId: z.string().describe('Order ID'),
  }),
  execute: async ({ orderId }) => {
    try {
      const prisma = await getDb()

      const order = await withTimeout(
        prisma.order.findUnique({
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
                fulfillmentSteps: {
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        }),
        5000,
        'Get order fulfillment timed out'
      )

      if (!order) return { success: false, error: 'Order not found' }

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items,
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get order fulfillment' }
    }
  },
})

export const toggleFulfillmentStep = tool({
  description: 'Mark a per-line fulfillment sub-step complete or incomplete.',
  inputSchema: z.object({
    stepId: z.string().describe('Fulfillment step ID'),
    completed: z.boolean().describe('Whether the step is completed'),
    notes: z.string().optional().describe('Optional notes'),
  }),
  execute: async ({ stepId, completed, notes }) => {
    try {
      const prisma = await getDb()

      const step = await withTimeout(
        prisma.orderItemFulfillmentStep.update({
          where: { id: stepId },
          data: {
            completed,
            completedAt: completed ? new Date() : null,
            ...(notes !== undefined ? { notes } : {}),
          },
        }),
        5000,
        'Toggle fulfillment step timed out'
      )

      return {
        success: true,
        step: { id: step.id, name: step.name, completed: step.completed, completedAt: step.completedAt },
        message: `Step "${step.name}" marked ${completed ? 'complete' : 'incomplete'}`,
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update fulfillment step' }
    }
  },
})

export const addFulfillmentStep = tool({
  description: 'Add a new fulfillment step to an order line item.',
  inputSchema: z.object({
    orderItemId: z.string().describe('Order item ID'),
    name: z.string().describe('Step name e.g. "Pick blank", "Embroider", "QC"'),
    position: z.number().int().optional().describe('Step position/order (default: append)'),
  }),
  execute: async ({ orderItemId, name, position }) => {
    try {
      const prisma = await getDb()

      let pos = position
      if (pos === undefined) {
        const last = await prisma.orderItemFulfillmentStep.findFirst({
          where: { orderItemId },
          orderBy: { position: 'desc' },
          select: { position: true },
        })
        pos = (last?.position ?? -1) + 1
      }

      const step = await withTimeout(
        prisma.orderItemFulfillmentStep.create({
          data: { orderItemId, name, position: pos },
        }),
        5000,
        'Add fulfillment step timed out'
      )

      return { success: true, step, message: `Step "${name}" added` }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add fulfillment step' }
    }
  },
})

export const fulfillmentTools = { getOrderFulfillment, toggleFulfillmentStep, addFulfillmentStep }
