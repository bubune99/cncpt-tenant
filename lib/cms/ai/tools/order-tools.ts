/**
 * Order CRUD Tools
 *
 * AI tools for updating order status, fulfilling, refunding, and cancelling orders.
 */

import { tool } from 'ai';
import { z } from 'zod';

async function getDb() {
  try {
    const { prisma } = await import('../../db');
    return prisma;
  } catch (error) {
    console.error('[OrderTools] Failed to import database:', error);
    throw new Error('Database connection unavailable');
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

export const updateOrderStatus = tool({
  description: 'Change the status of an order.',
  inputSchema: z.object({
    id: z.string().describe('Order ID'),
    status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).describe('New order status'),
  }),
  execute: async ({ id, status }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.order.findUnique({
        where: { id },
        select: { id: true, orderNumber: true, status: true },
      });
      if (!existing) return { success: false, error: 'Order not found' };

      // Validate status transitions
      const invalidTransitions: Record<string, string[]> = {
        CANCELLED: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
        REFUNDED: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
        DELIVERED: ['PROCESSING'],
      };
      if (invalidTransitions[existing.status]?.includes(status)) {
        return { success: false, error: `Cannot change order from ${existing.status} to ${status}` };
      }

      const order = await withTimeout(
        prisma.order.update({
          where: { id },
          data: { status: status as any },
          select: { id: true, orderNumber: true, status: true, email: true },
        }),
        5000,
        'Update order status timed out'
      );

      return {
        success: true,
        order: { ...order, adminUrl: `/admin/orders/${order.id}` },
        message: `Order ${order.orderNumber} status changed to ${order.status}`,
      };
    } catch (error) {
      console.error('[OrderTools] updateOrderStatus error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update order status' };
    }
  },
});

export const fulfillOrder = tool({
  description: 'Mark an order as shipped with optional tracking information.',
  inputSchema: z.object({
    id: z.string().describe('Order ID'),
    trackingNumber: z.string().optional().describe('Shipping tracking number'),
    carrier: z.string().optional().describe('Shipping carrier (e.g. USPS, UPS, FedEx)'),
  }),
  execute: async ({ id, trackingNumber, carrier }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.order.findUnique({
        where: { id },
        select: { id: true, orderNumber: true, status: true },
      });
      if (!existing) return { success: false, error: 'Order not found' };

      if (existing.status === 'CANCELLED' || existing.status === 'REFUNDED') {
        return { success: false, error: `Cannot fulfill a ${existing.status.toLowerCase()} order` };
      }

      // Create shipment record
      const shipment = await prisma.shipment.create({
        data: {
          orderId: id,
          carrier,
          trackingNumber,
          status: 'IN_TRANSIT',
          shippedAt: new Date(),
        },
        select: { id: true, carrier: true, trackingNumber: true },
      });

      // Update order status to SHIPPED
      const order = await withTimeout(
        prisma.order.update({
          where: { id },
          data: { status: 'SHIPPED' },
          select: { id: true, orderNumber: true, status: true, email: true },
        }),
        5000,
        'Fulfill order timed out'
      );

      return {
        success: true,
        order: { ...order, adminUrl: `/admin/orders/${order.id}` },
        shipment,
        message: `Order ${order.orderNumber} marked as shipped${trackingNumber ? ` (tracking: ${trackingNumber})` : ''}`,
      };
    } catch (error) {
      console.error('[OrderTools] fulfillOrder error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fulfill order' };
    }
  },
});

export const refundOrder = tool({
  description: 'Process a full or partial refund for an order. If the order has a Stripe payment, the refund is processed through Stripe.',
  inputSchema: z.object({
    id: z.string().describe('Order ID'),
    amount: z.number().optional().describe('Refund amount in dollars (omit for full refund)'),
    reason: z.string().optional().describe('Reason for refund'),
  }),
  execute: async ({ id, amount, reason }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          stripePaymentIntentId: true,
          paymentStatus: true,
        },
      });
      if (!existing) return { success: false, error: 'Order not found' };

      if (existing.paymentStatus === 'REFUNDED') {
        return { success: false, error: 'Order has already been fully refunded' };
      }

      const refundAmountCents = amount ? Math.round(amount * 100) : existing.total;
      const isPartial = refundAmountCents < existing.total;

      if (refundAmountCents > existing.total) {
        return { success: false, error: `Refund amount ($${amount}) exceeds order total ($${(existing.total / 100).toFixed(2)})` };
      }

      // Process Stripe refund if payment was through Stripe
      if (existing.stripePaymentIntentId) {
        try {
          const Stripe = (await import('stripe')).default;
          const stripeSettings = await prisma.setting.findMany({
            where: { key: { startsWith: 'stripe.' } },
          });
          const secretKey = stripeSettings.find((s: any) => s.key === 'stripe.secretKey')?.value ||
            process.env.STRIPE_SECRET_KEY;

          if (secretKey) {
            const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
            await stripe.refunds.create({
              payment_intent: existing.stripePaymentIntentId,
              amount: refundAmountCents,
              reason: reason === 'duplicate' ? 'duplicate' :
                      reason === 'fraudulent' ? 'fraudulent' :
                      'requested_by_customer',
            });
          }
        } catch (stripeError) {
          console.error('[OrderTools] Stripe refund error:', stripeError);
          return {
            success: false,
            error: `Stripe refund failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`,
          };
        }
      }

      // Update order status
      const order = await withTimeout(
        prisma.order.update({
          where: { id },
          data: {
            status: isPartial ? existing.status : 'REFUNDED',
            paymentStatus: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
            internalNotes: reason
              ? `${existing.orderNumber}: Refund — ${reason}`
              : undefined,
          },
          select: { id: true, orderNumber: true, status: true, paymentStatus: true },
        }),
        5000,
        'Refund order timed out'
      );

      return {
        success: true,
        order: { ...order, adminUrl: `/admin/orders/${order.id}` },
        refundedAmount: refundAmountCents / 100,
        isPartial,
        message: `Order ${order.orderNumber} ${isPartial ? 'partially ' : ''}refunded $${(refundAmountCents / 100).toFixed(2)}`,
      };
    } catch (error) {
      console.error('[OrderTools] refundOrder error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to refund order' };
    }
  },
});

export const cancelOrder = tool({
  description: 'Cancel an order. Optionally restock items.',
  inputSchema: z.object({
    id: z.string().describe('Order ID'),
    reason: z.string().optional().describe('Cancellation reason'),
    restockItems: z.boolean().optional().default(false).describe('Whether to restock items back to inventory'),
  }),
  execute: async ({ id, reason, restockItems }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          items: restockItems
            ? {
                select: {
                  productId: true,
                  variantId: true,
                  quantity: true,
                },
              }
            : false,
        },
      });
      if (!existing) return { success: false, error: 'Order not found' };

      if (existing.status === 'DELIVERED') {
        return { success: false, error: 'Cannot cancel a delivered order. Use refund instead.' };
      }
      if (existing.status === 'CANCELLED') {
        return { success: false, error: 'Order is already cancelled' };
      }

      // Restock items if requested
      if (restockItems && 'items' in existing && Array.isArray(existing.items)) {
        for (const item of existing.items) {
          if (item.variantId) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      const order = await withTimeout(
        prisma.order.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            internalNotes: reason
              ? `Cancelled: ${reason}`
              : undefined,
          },
          select: { id: true, orderNumber: true, status: true, email: true },
        }),
        5000,
        'Cancel order timed out'
      );

      return {
        success: true,
        order: { ...order, adminUrl: `/admin/orders/${order.id}` },
        restocked: restockItems,
        message: `Order ${order.orderNumber} cancelled${restockItems ? ' (items restocked)' : ''}`,
      };
    } catch (error) {
      console.error('[OrderTools] cancelOrder error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel order' };
    }
  },
});

// Atlas redesign G09 — move order to workflow stage
export const moveOrderToStage = tool({
  description: 'Move an order to a specific workflow stage by stageId. Creates an OrderProgress record.',
  inputSchema: z.object({
    orderId: z.string().describe('Order ID'),
    stageId: z.string().describe('Target workflow stage ID'),
    reason: z.string().optional().describe('Reason for stage move'),
    notes: z.string().optional().describe('Additional notes'),
  }),
  execute: async ({ orderId, stageId, reason, notes }) => {
    try {
      const prisma = await getDb();

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true, currentStageId: true, workflowId: true },
      });
      if (!order) return { success: false, error: 'Order not found' };

      // Validate stage belongs to order's workflow if workflow is set
      if (order.workflowId) {
        const stage = await prisma.orderWorkflowStage.findFirst({
          where: { id: stageId, workflowId: order.workflowId },
          select: { id: true, displayName: true },
        });
        if (!stage) return { success: false, error: 'Stage not found in this order\'s workflow' };
      }

      const [, updatedOrder] = await withTimeout(
        prisma.$transaction([
          prisma.orderProgress.create({
            data: { orderId, stageId, updatedById: 'agent', ...(notes ? { notes } : {}) },
          }),
          prisma.order.update({
            where: { id: orderId },
            data: { currentStageId: stageId },
            select: { id: true, orderNumber: true, currentStageId: true, currentStage: true },
          }),
        ]),
        5000,
        'Move order to stage timed out'
      );

      return {
        success: true,
        order: updatedOrder,
        previousStageId: order.currentStageId,
        reason,
        message: `Order ${order.orderNumber} moved to stage ${stageId}`,
      };
    } catch (error) {
      console.error('[OrderTools] moveOrderToStage error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to move order to stage' };
    }
  },
});

export const orderTools = { updateOrderStatus, fulfillOrder, refundOrder, cancelOrder, moveOrderToStage };
