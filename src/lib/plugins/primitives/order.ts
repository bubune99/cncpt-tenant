/**
 * Order Primitives
 *
 * Primitives for managing orders: creation, status updates, cancellation, refunds, and tracking.
 */

import type { CreatePrimitiveRequest } from '../types';

export const ORDER_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // ORDER MANAGEMENT PRIMITIVES
  // ============================================================================
  {
    name: 'order.create',
    description: 'Create a new order from cart or direct product purchase. Calculates totals, applies discounts, and initializes order workflow.',
    category: 'order',
    tags: ['order', 'create', 'checkout', 'e-commerce'],
    icon: 'ShoppingBag',
    timeout: 30000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Optional customer ID for logged-in users',
        },
        email: {
          type: 'string',
          description: 'Customer email address (required)',
        },
        items: {
          type: 'array',
          description: 'Array of order items with productId, variantId, quantity',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              variantId: { type: 'string' },
              quantity: { type: 'number' },
            },
            required: ['productId', 'quantity'],
          },
        },
        shippingAddressId: {
          type: 'string',
          description: 'ID of the shipping address',
        },
        billingAddressId: {
          type: 'string',
          description: 'ID of the billing address',
        },
        discountCode: {
          type: 'string',
          description: 'Optional discount code to apply',
        },
        customerNotes: {
          type: 'string',
          description: 'Optional notes from customer',
        },
      },
      required: ['email', 'items'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');
      const { generateOrderNumber } = await import('@/lib/orders');

      // Validate items and get product info
      const orderItems = [];
      let subtotal = 0;

      for (const item of args.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });

        if (!product) {
          throw new Error('Product not found: ' + item.productId);
        }

        const variant = item.variantId
          ? product.variants.find(v => v.id === item.variantId)
          : null;

        const price = variant?.price ?? product.price;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product.id,
          variantId: variant?.id,
          title: product.title,
          variantTitle: variant?.title,
          sku: variant?.sku || product.sku,
          quantity: item.quantity,
          price: price,
          total: itemTotal,
        });
      }

      // Apply discount if provided
      let discountTotal = 0;
      let discountCodeId = null;

      if (args.discountCode) {
        const discount = await prisma.discountCode.findUnique({
          where: { code: args.discountCode, enabled: true },
        });

        if (discount) {
          if (discount.type === 'PERCENTAGE') {
            discountTotal = Math.floor(subtotal * discount.value / 100);
            if (discount.maxDiscount) {
              discountTotal = Math.min(discountTotal, discount.maxDiscount);
            }
          } else {
            discountTotal = discount.value;
          }
          discountCodeId = discount.id;
        }
      }

      const total = subtotal - discountTotal;

      // Create order with items
      const order = await prisma.order.create({
        data: {
          orderNumber: await generateOrderNumber(),
          customerId: args.customerId,
          email: args.email,
          status: 'PENDING',
          subtotal,
          discountTotal,
          total,
          discountCodeId,
          shippingAddressId: args.shippingAddressId,
          billingAddressId: args.billingAddressId,
          customerNotes: args.customerNotes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          itemCount: order.items.length,
        },
      };
    `,
  },
  {
    name: 'order.get',
    description: 'Get order details by ID or order number. Includes items, shipments, and workflow progress.',
    category: 'order',
    tags: ['order', 'get', 'details', 'e-commerce'],
    icon: 'FileText',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID',
        },
        orderNumber: {
          type: 'string',
          description: 'Order number (alternative to orderId)',
        },
        includeItems: {
          type: 'boolean',
          description: 'Include order items (default: true)',
          default: true,
        },
        includeShipments: {
          type: 'boolean',
          description: 'Include shipment info (default: true)',
          default: true,
        },
        includeProgress: {
          type: 'boolean',
          description: 'Include workflow progress (default: false)',
          default: false,
        },
      },
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      if (!args.orderId && !args.orderNumber) {
        throw new Error('Either orderId or orderNumber is required');
      }

      const where = args.orderId
        ? { id: args.orderId }
        : { orderNumber: args.orderNumber };

      const order = await prisma.order.findUnique({
        where,
        include: {
          items: args.includeItems !== false ? {
            include: {
              product: { select: { id: true, title: true, slug: true } },
              variant: { select: { id: true, title: true } },
            },
          } : false,
          shipments: args.includeShipments !== false,
          progress: args.includeProgress ? {
            include: { stage: true },
            orderBy: { enteredAt: 'desc' },
          } : false,
          customer: { select: { id: true, name: true, email: true } },
          shippingAddress: true,
          billingAddress: true,
          workflow: args.includeProgress ? { include: { stages: true } } : false,
        },
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      return { success: true, order };
    `,
  },
  {
    name: 'order.list',
    description: 'List orders with filtering, pagination, and sorting options.',
    category: 'order',
    tags: ['order', 'list', 'search', 'e-commerce'],
    icon: 'List',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Filter by customer ID',
        },
        email: {
          type: 'string',
          description: 'Filter by customer email',
        },
        status: {
          type: 'string',
          description: 'Filter by order status',
          enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
        },
        paymentStatus: {
          type: 'string',
          description: 'Filter by payment status',
          enum: ['UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'],
        },
        dateFrom: {
          type: 'string',
          description: 'Filter orders from this date (ISO string)',
        },
        dateTo: {
          type: 'string',
          description: 'Filter orders up to this date (ISO string)',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 1)',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page (default: 20, max: 100)',
          default: 20,
        },
        sortBy: {
          type: 'string',
          description: 'Sort field',
          enum: ['createdAt', 'updatedAt', 'total', 'orderNumber'],
          default: 'createdAt',
        },
        sortOrder: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      const page = Math.max(1, args.page || 1);
      const limit = Math.min(100, Math.max(1, args.limit || 20));
      const skip = (page - 1) * limit;

      const where = {};

      if (args.customerId) where.customerId = args.customerId;
      if (args.email) where.email = { contains: args.email, mode: 'insensitive' };
      if (args.status) where.status = args.status;
      if (args.paymentStatus) where.paymentStatus = args.paymentStatus;

      if (args.dateFrom || args.dateTo) {
        where.createdAt = {};
        if (args.dateFrom) where.createdAt.gte = new Date(args.dateFrom);
        if (args.dateTo) where.createdAt.lte = new Date(args.dateTo);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [args.sortBy || 'createdAt']: args.sortOrder || 'desc' },
          include: {
            items: { select: { id: true, title: true, quantity: true, total: true } },
            customer: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `,
  },
  {
    name: 'order.updateStatus',
    description: 'Update order status with optional notes and notification trigger.',
    category: 'order',
    tags: ['order', 'status', 'update', 'e-commerce'],
    icon: 'RefreshCw',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to update',
        },
        status: {
          type: 'string',
          description: 'New order status',
          enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
        },
        internalNotes: {
          type: 'string',
          description: 'Internal notes for this status change',
        },
        notifyCustomer: {
          type: 'boolean',
          description: 'Send notification to customer (default: true)',
          default: true,
        },
        updatedById: {
          type: 'string',
          description: 'User ID who made the change',
        },
      },
      required: ['orderId', 'status'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const previousStatus = order.status;

      const updated = await prisma.order.update({
        where: { id: args.orderId },
        data: {
          status: args.status,
          internalNotes: args.internalNotes
            ? (order.internalNotes ? order.internalNotes + '\\n' : '') +
              '[' + new Date().toISOString() + '] Status: ' + args.status + ' - ' + args.internalNotes
            : order.internalNotes,
        },
      });

      // TODO: Trigger notification if notifyCustomer is true

      return {
        success: true,
        order: {
          id: updated.id,
          orderNumber: updated.orderNumber,
          previousStatus,
          newStatus: updated.status,
        },
      };
    `,
  },
  {
    name: 'order.cancel',
    description: 'Cancel an order. Restores inventory, voids payment if applicable, and updates status.',
    category: 'order',
    tags: ['order', 'cancel', 'void', 'e-commerce'],
    icon: 'XCircle',
    timeout: 30000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to cancel',
        },
        reason: {
          type: 'string',
          description: 'Reason for cancellation',
        },
        restoreInventory: {
          type: 'boolean',
          description: 'Restore product inventory (default: true)',
          default: true,
        },
        notifyCustomer: {
          type: 'boolean',
          description: 'Send cancellation notification (default: true)',
          default: true,
        },
        cancelledById: {
          type: 'string',
          description: 'User ID who cancelled',
        },
      },
      required: ['orderId', 'reason'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'CANCELLED') {
        throw new Error('Order is already cancelled');
      }

      if (order.status === 'DELIVERED') {
        throw new Error('Cannot cancel a delivered order. Use refund instead.');
      }

      // Restore inventory if requested
      if (args.restoreInventory !== false) {
        for (const item of order.items) {
          if (item.variantId) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { inventory: { increment: item.quantity } },
            });
          } else {
            await prisma.product.update({
              where: { id: item.productId },
              data: { inventory: { increment: item.quantity } },
            });
          }
        }
      }

      const updated = await prisma.order.update({
        where: { id: args.orderId },
        data: {
          status: 'CANCELLED',
          internalNotes: (order.internalNotes ? order.internalNotes + '\\n' : '') +
            '[' + new Date().toISOString() + '] CANCELLED: ' + args.reason,
        },
      });

      return {
        success: true,
        order: {
          id: updated.id,
          orderNumber: updated.orderNumber,
          status: updated.status,
          reason: args.reason,
          inventoryRestored: args.restoreInventory !== false,
        },
      };
    `,
  },
  {
    name: 'order.refund',
    description: 'Process a refund for an order. Supports full or partial refunds with optional inventory restoration.',
    category: 'order',
    tags: ['order', 'refund', 'payment', 'e-commerce'],
    icon: 'RotateCcw',
    timeout: 30000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to refund',
        },
        amount: {
          type: 'number',
          description: 'Refund amount in cents. If not provided, full refund.',
        },
        reason: {
          type: 'string',
          description: 'Reason for refund',
        },
        items: {
          type: 'array',
          description: 'Specific items to refund (for partial refunds)',
          items: {
            type: 'object',
            properties: {
              orderItemId: { type: 'string' },
              quantity: { type: 'number' },
            },
            required: ['orderItemId', 'quantity'],
          },
        },
        restoreInventory: {
          type: 'boolean',
          description: 'Restore inventory for refunded items',
          default: true,
        },
        processStripeRefund: {
          type: 'boolean',
          description: 'Process refund through Stripe (default: true)',
          default: true,
        },
        refundedById: {
          type: 'string',
          description: 'User ID who processed refund',
        },
      },
      required: ['orderId', 'reason'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'PARTIALLY_REFUNDED') {
        throw new Error('Order must be paid to process refund');
      }

      const refundAmount = args.amount || order.total;

      // Process Stripe refund if applicable
      let stripeRefundId = null;
      if (args.processStripeRefund !== false && order.stripePaymentIntentId) {
        try {
          const stripe = (await import('@/lib/stripe')).stripe;
          const refund = await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            amount: refundAmount,
            reason: 'requested_by_customer',
          });
          stripeRefundId = refund.id;
        } catch (err) {
          throw new Error('Stripe refund failed: ' + err.message);
        }
      }

      // Update order status
      const isFullRefund = refundAmount >= order.total;
      const updated = await prisma.order.update({
        where: { id: args.orderId },
        data: {
          status: isFullRefund ? 'REFUNDED' : order.status,
          paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          internalNotes: (order.internalNotes ? order.internalNotes + '\\n' : '') +
            '[' + new Date().toISOString() + '] REFUND: $' + (refundAmount / 100).toFixed(2) +
            ' - ' + args.reason + (stripeRefundId ? ' (Stripe: ' + stripeRefundId + ')' : ''),
        },
      });

      return {
        success: true,
        refund: {
          orderId: updated.id,
          orderNumber: updated.orderNumber,
          amount: refundAmount,
          isFullRefund,
          stripeRefundId,
          newPaymentStatus: updated.paymentStatus,
        },
      };
    `,
  },
  {
    name: 'order.getTracking',
    description: 'Get tracking information for an order including shipment status and history.',
    category: 'order',
    tags: ['order', 'tracking', 'shipment', 'e-commerce'],
    icon: 'Truck',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID',
        },
        orderNumber: {
          type: 'string',
          description: 'Order number (alternative to orderId)',
        },
      },
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      if (!args.orderId && !args.orderNumber) {
        throw new Error('Either orderId or orderNumber is required');
      }

      const where = args.orderId
        ? { id: args.orderId }
        : { orderNumber: args.orderNumber };

      const order = await prisma.order.findUnique({
        where,
        include: {
          shipments: true,
          progress: {
            include: { stage: true },
            orderBy: { enteredAt: 'desc' },
          },
          workflow: {
            include: {
              stages: { orderBy: { position: 'asc' } },
            },
          },
        },
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Get current stage from workflow
      const currentProgress = order.progress[0];
      const stages = order.workflow?.stages || [];
      const currentStageIndex = currentProgress
        ? stages.findIndex(s => s.id === currentProgress.stageId)
        : -1;

      return {
        success: true,
        tracking: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderStatus: order.status,
          shipments: order.shipments.map(s => ({
            id: s.id,
            carrier: s.carrier,
            service: s.service,
            trackingNumber: s.trackingNumber,
            trackingUrl: s.trackingUrl,
            status: s.status,
            shippedAt: s.shippedAt,
            deliveredAt: s.deliveredAt,
          })),
          workflow: order.workflow ? {
            name: order.workflow.name,
            currentStage: currentProgress?.stage ? {
              name: currentProgress.stage.displayName,
              message: currentProgress.stage.customerMessage,
              icon: currentProgress.stage.icon,
              color: currentProgress.stage.color,
              enteredAt: currentProgress.enteredAt,
            } : null,
            stages: stages.map((s, i) => ({
              name: s.displayName,
              icon: s.icon,
              color: s.color,
              isComplete: i < currentStageIndex,
              isCurrent: i === currentStageIndex,
              isPending: i > currentStageIndex,
            })),
          } : null,
          history: order.progress.map(p => ({
            stage: p.stage.displayName,
            enteredAt: p.enteredAt,
            exitedAt: p.exitedAt,
            source: p.source,
          })),
        },
      };
    `,
  },
  {
    name: 'order.reorder',
    description: 'Create a new order based on a previous order. Validates product availability and current prices.',
    category: 'order',
    tags: ['order', 'reorder', 'repeat', 'e-commerce'],
    icon: 'Copy',
    timeout: 30000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Original order ID to reorder from',
        },
        customerId: {
          type: 'string',
          description: 'Customer ID (uses original if not provided)',
        },
        email: {
          type: 'string',
          description: 'Email (uses original if not provided)',
        },
        shippingAddressId: {
          type: 'string',
          description: 'Shipping address (uses original if not provided)',
        },
        skipUnavailable: {
          type: 'boolean',
          description: 'Skip unavailable items instead of failing (default: false)',
          default: false,
        },
      },
      required: ['orderId'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');
      const { generateOrderNumber } = await import('@/lib/orders');

      const originalOrder = await prisma.order.findUnique({
        where: { id: args.orderId },
        include: { items: true },
      });

      if (!originalOrder) {
        throw new Error('Original order not found');
      }

      // Validate items are still available
      const validItems = [];
      const unavailableItems = [];
      let subtotal = 0;

      for (const item of originalOrder.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });

        if (!product || product.status !== 'ACTIVE') {
          unavailableItems.push({ title: item.title, reason: 'Product no longer available' });
          continue;
        }

        const variant = item.variantId
          ? product.variants.find(v => v.id === item.variantId)
          : null;

        if (item.variantId && !variant) {
          unavailableItems.push({ title: item.title, reason: 'Variant no longer available' });
          continue;
        }

        const currentPrice = variant?.price ?? product.price;
        const itemTotal = currentPrice * item.quantity;
        subtotal += itemTotal;

        validItems.push({
          productId: product.id,
          variantId: variant?.id,
          title: product.title,
          variantTitle: variant?.title,
          sku: variant?.sku || product.sku,
          quantity: item.quantity,
          price: currentPrice,
          total: itemTotal,
        });
      }

      if (validItems.length === 0) {
        throw new Error('No items available for reorder');
      }

      if (unavailableItems.length > 0 && !args.skipUnavailable) {
        return {
          success: false,
          error: 'Some items are unavailable',
          unavailableItems,
        };
      }

      // Create new order
      const newOrder = await prisma.order.create({
        data: {
          orderNumber: await generateOrderNumber(),
          customerId: args.customerId || originalOrder.customerId,
          email: args.email || originalOrder.email,
          status: 'PENDING',
          subtotal,
          total: subtotal,
          shippingAddressId: args.shippingAddressId || originalOrder.shippingAddressId,
          billingAddressId: originalOrder.billingAddressId,
          items: {
            create: validItems,
          },
        },
        include: { items: true },
      });

      return {
        success: true,
        order: {
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          total: newOrder.total,
          itemCount: newOrder.items.length,
        },
        originalOrderId: originalOrder.id,
        unavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined,
      };
    `,
  },
];
