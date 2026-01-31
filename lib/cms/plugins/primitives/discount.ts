/**
 * Discount Primitives
 *
 * Primitives for discount and coupon management: validation, application, and tracking.
 */

import type { CreatePrimitiveRequest } from '../types';

export const DISCOUNT_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // DISCOUNT PRIMITIVES
  // ============================================================================
  {
    name: 'discount.validate',
    description: 'Validate a discount code and check eligibility for an order.',
    category: 'discount',
    tags: ['discount', 'coupon', 'validate', 'e-commerce'],
    icon: 'Percent',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Discount code to validate',
        },
        orderTotal: {
          type: 'number',
          description: 'Order subtotal in cents (for minimum order validation)',
        },
        productIds: {
          type: 'array',
          description: 'Product IDs in the order (for product-specific discounts)',
          items: { type: 'string' },
        },
        categoryIds: {
          type: 'array',
          description: 'Category IDs of products (for category-specific discounts)',
          items: { type: 'string' },
        },
        customerId: {
          type: 'string',
          description: 'Customer ID (for per-customer limits and first-order discounts)',
        },
        email: {
          type: 'string',
          description: 'Customer email (for tracking usage)',
        },
      },
      required: ['code'],
    },
    handler: `
      const { prisma } = await import('../../db');

      const discount = await prisma.discountCode.findUnique({
        where: { code: args.code.toUpperCase() },
        include: {
          _count: {
            select: { usages: true },
          },
        },
      });

      if (!discount) {
        return { valid: false, error: 'Invalid discount code' };
      }

      // Check if enabled
      if (!discount.enabled) {
        return { valid: false, error: 'This discount code is no longer active' };
      }

      // Check date validity
      const now = new Date();
      if (discount.startsAt > now) {
        return { valid: false, error: 'This discount code is not yet active' };
      }
      if (discount.expiresAt && discount.expiresAt < now) {
        return { valid: false, error: 'This discount code has expired' };
      }

      // Check usage limits
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        return { valid: false, error: 'This discount code has reached its usage limit' };
      }

      // Check per-customer limit
      if (discount.perCustomer && (args.customerId || args.email)) {
        const customerUsages = await prisma.discountUsage.count({
          where: {
            discountCodeId: discount.id,
            OR: [
              args.customerId ? { userId: args.customerId } : {},
              args.email ? { email: args.email } : {},
            ].filter(o => Object.keys(o).length > 0),
          },
        });

        if (customerUsages >= discount.perCustomer) {
          return { valid: false, error: 'You have already used this discount code the maximum number of times' };
        }
      }

      // Check first order only
      if (discount.firstOrderOnly && (args.customerId || args.email)) {
        const previousOrders = await prisma.order.count({
          where: {
            OR: [
              args.customerId ? { customerId: args.customerId } : {},
              args.email ? { email: args.email } : {},
            ].filter(o => Object.keys(o).length > 0),
            status: { notIn: ['CANCELLED'] },
          },
        });

        if (previousOrders > 0) {
          return { valid: false, error: 'This discount code is only valid for first orders' };
        }
      }

      // Check minimum order value
      if (discount.minOrderValue && args.orderTotal && args.orderTotal < discount.minOrderValue) {
        return {
          valid: false,
          error: 'Minimum order of $' + (discount.minOrderValue / 100).toFixed(2) + ' required',
        };
      }

      // Check product/category applicability
      if (discount.applyTo === 'PRODUCT' && discount.productIds.length > 0) {
        const hasApplicableProduct = args.productIds?.some(id => discount.productIds.includes(id));
        if (!hasApplicableProduct) {
          return { valid: false, error: 'This discount does not apply to items in your cart' };
        }
      }

      if (discount.applyTo === 'CATEGORY' && discount.categoryIds.length > 0) {
        const hasApplicableCategory = args.categoryIds?.some(id => discount.categoryIds.includes(id));
        if (!hasApplicableCategory) {
          return { valid: false, error: 'This discount does not apply to items in your cart' };
        }
      }

      // Calculate discount amount if order total provided
      let discountAmount = 0;
      if (args.orderTotal) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount = Math.floor(args.orderTotal * discount.value / 100);
          if (discount.maxDiscount) {
            discountAmount = Math.min(discountAmount, discount.maxDiscount);
          }
        } else {
          discountAmount = Math.min(discount.value, args.orderTotal);
        }
      }

      return {
        valid: true,
        discount: {
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          description: discount.description,
          minOrderValue: discount.minOrderValue,
          maxDiscount: discount.maxDiscount,
          expiresAt: discount.expiresAt?.toISOString(),
        },
        discountAmount,
        savings: discountAmount > 0 ? '$' + (discountAmount / 100).toFixed(2) : null,
      };
    `,
  },
  {
    name: 'discount.apply',
    description: 'Apply a validated discount code to an order or cart.',
    category: 'discount',
    tags: ['discount', 'coupon', 'apply', 'e-commerce'],
    icon: 'Tag',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Discount code to apply',
        },
        orderId: {
          type: 'string',
          description: 'Order ID to apply discount to',
        },
        cartId: {
          type: 'string',
          description: 'Cart ID to apply discount to (alternative to orderId)',
        },
      },
      required: ['code'],
    },
    handler: `
      const { prisma } = await import('../../db');

      if (!args.orderId && !args.cartId) {
        throw new Error('Either orderId or cartId is required');
      }

      const discount = await prisma.discountCode.findUnique({
        where: { code: args.code.toUpperCase(), enabled: true },
      });

      if (!discount) {
        throw new Error('Invalid discount code');
      }

      if (args.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: args.orderId },
        });

        if (!order) {
          throw new Error('Order not found');
        }

        // Calculate discount
        let discountAmount = 0;
        if (discount.type === 'PERCENTAGE') {
          discountAmount = Math.floor(order.subtotal * discount.value / 100);
          if (discount.maxDiscount) {
            discountAmount = Math.min(discountAmount, discount.maxDiscount);
          }
        } else {
          discountAmount = Math.min(discount.value, order.subtotal);
        }

        // Update order
        const updated = await prisma.order.update({
          where: { id: args.orderId },
          data: {
            discountCodeId: discount.id,
            discountTotal: discountAmount,
            total: order.subtotal + order.shippingTotal + order.taxTotal - discountAmount,
          },
        });

        return {
          success: true,
          applied: 'order',
          orderId: updated.id,
          discountAmount,
          newTotal: updated.total,
        };
      }

      if (args.cartId) {
        const cart = await prisma.cart.findUnique({
          where: { id: args.cartId },
        });

        if (!cart) {
          throw new Error('Cart not found');
        }

        // Calculate discount
        let discountAmount = 0;
        if (discount.type === 'PERCENTAGE') {
          discountAmount = Math.floor(cart.subtotal * discount.value / 100);
          if (discount.maxDiscount) {
            discountAmount = Math.min(discountAmount, discount.maxDiscount);
          }
        } else {
          discountAmount = Math.min(discount.value, cart.subtotal);
        }

        // Update cart
        const updated = await prisma.cart.update({
          where: { id: args.cartId },
          data: {
            discountCodeId: discount.id,
            discountTotal: discountAmount,
            total: cart.subtotal + cart.shippingTotal + cart.taxTotal - discountAmount,
          },
        });

        return {
          success: true,
          applied: 'cart',
          cartId: updated.id,
          discountAmount,
          newTotal: updated.total,
        };
      }
    `,
  },
  {
    name: 'discount.remove',
    description: 'Remove a discount code from an order or cart.',
    category: 'discount',
    tags: ['discount', 'coupon', 'remove', 'e-commerce'],
    icon: 'X',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to remove discount from',
        },
        cartId: {
          type: 'string',
          description: 'Cart ID to remove discount from',
        },
      },
    },
    handler: `
      const { prisma } = await import('../../db');

      if (!args.orderId && !args.cartId) {
        throw new Error('Either orderId or cartId is required');
      }

      if (args.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: args.orderId },
        });

        if (!order) {
          throw new Error('Order not found');
        }

        const updated = await prisma.order.update({
          where: { id: args.orderId },
          data: {
            discountCodeId: null,
            discountTotal: 0,
            total: order.subtotal + order.shippingTotal + order.taxTotal,
          },
        });

        return {
          success: true,
          removed: 'order',
          orderId: updated.id,
          newTotal: updated.total,
        };
      }

      if (args.cartId) {
        const cart = await prisma.cart.findUnique({
          where: { id: args.cartId },
        });

        if (!cart) {
          throw new Error('Cart not found');
        }

        const updated = await prisma.cart.update({
          where: { id: args.cartId },
          data: {
            discountCodeId: null,
            discountTotal: 0,
            total: cart.subtotal + cart.shippingTotal + cart.taxTotal,
          },
        });

        return {
          success: true,
          removed: 'cart',
          cartId: updated.id,
          newTotal: updated.total,
        };
      }
    `,
  },
  {
    name: 'discount.list',
    description: 'List discount codes with filtering and pagination.',
    category: 'discount',
    tags: ['discount', 'coupon', 'list', 'e-commerce'],
    icon: 'List',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Filter by enabled status',
        },
        type: {
          type: 'string',
          description: 'Filter by discount type',
          enum: ['PERCENTAGE', 'FIXED'],
        },
        active: {
          type: 'boolean',
          description: 'Filter active discounts (enabled, within date range, not exhausted)',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 1)',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page (default: 20)',
          default: 20,
        },
      },
    },
    handler: `
      const { prisma } = await import('../../db');

      const page = Math.max(1, args.page || 1);
      const limit = Math.min(100, Math.max(1, args.limit || 20));
      const skip = (page - 1) * limit;

      const where = {};
      const now = new Date();

      if (typeof args.enabled === 'boolean') {
        where.enabled = args.enabled;
      }

      if (args.type) {
        where.type = args.type;
      }

      if (args.active) {
        where.enabled = true;
        where.startsAt = { lte: now };
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ];
      }

      const [discounts, total] = await Promise.all([
        prisma.discountCode.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { usages: true } },
          },
        }),
        prisma.discountCode.count({ where }),
      ]);

      return {
        success: true,
        discounts: discounts.map(d => ({
          id: d.id,
          code: d.code,
          description: d.description,
          type: d.type,
          value: d.value,
          minOrderValue: d.minOrderValue,
          maxDiscount: d.maxDiscount,
          enabled: d.enabled,
          usageCount: d.usageCount,
          usageLimit: d.usageLimit,
          startsAt: d.startsAt.toISOString(),
          expiresAt: d.expiresAt?.toISOString(),
        })),
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
    name: 'discount.get',
    description: 'Get details of a specific discount code by ID or code.',
    category: 'discount',
    tags: ['discount', 'coupon', 'get', 'e-commerce'],
    icon: 'Info',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Discount ID',
        },
        code: {
          type: 'string',
          description: 'Discount code (alternative to id)',
        },
        includeUsages: {
          type: 'boolean',
          description: 'Include usage history',
          default: false,
        },
      },
    },
    handler: `
      const { prisma } = await import('../../db');

      if (!args.id && !args.code) {
        throw new Error('Either id or code is required');
      }

      const where = args.id
        ? { id: args.id }
        : { code: args.code.toUpperCase() };

      const discount = await prisma.discountCode.findUnique({
        where,
        include: {
          usages: args.includeUsages ? {
            take: 50,
            orderBy: { createdAt: 'desc' },
          } : false,
          _count: { select: { usages: true } },
        },
      });

      if (!discount) {
        return { success: false, error: 'Discount not found' };
      }

      const now = new Date();
      const isActive = discount.enabled &&
        discount.startsAt <= now &&
        (!discount.expiresAt || discount.expiresAt > now) &&
        (!discount.usageLimit || discount.usageCount < discount.usageLimit);

      return {
        success: true,
        discount: {
          id: discount.id,
          code: discount.code,
          description: discount.description,
          type: discount.type,
          value: discount.value,
          applyTo: discount.applyTo,
          productIds: discount.productIds,
          categoryIds: discount.categoryIds,
          excludeProductIds: discount.excludeProductIds,
          excludeSaleItems: discount.excludeSaleItems,
          minOrderValue: discount.minOrderValue,
          maxDiscount: discount.maxDiscount,
          usageLimit: discount.usageLimit,
          usageCount: discount.usageCount,
          perCustomer: discount.perCustomer,
          firstOrderOnly: discount.firstOrderOnly,
          enabled: discount.enabled,
          startsAt: discount.startsAt.toISOString(),
          expiresAt: discount.expiresAt?.toISOString(),
          isActive,
          usages: args.includeUsages ? discount.usages.map(u => ({
            orderId: u.orderId,
            email: u.email,
            discountAmount: u.discountAmount,
            createdAt: u.createdAt.toISOString(),
          })) : undefined,
        },
      };
    `,
  },
  {
    name: 'discount.create',
    description: 'Create a new discount code.',
    category: 'discount',
    tags: ['discount', 'coupon', 'create', 'e-commerce'],
    icon: 'Plus',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Unique discount code',
        },
        description: {
          type: 'string',
          description: 'Description of the discount',
        },
        type: {
          type: 'string',
          description: 'Discount type',
          enum: ['PERCENTAGE', 'FIXED'],
        },
        value: {
          type: 'number',
          description: 'Discount value (percentage or cents)',
        },
        minOrderValue: {
          type: 'number',
          description: 'Minimum order value in cents',
        },
        maxDiscount: {
          type: 'number',
          description: 'Maximum discount amount in cents (for percentage)',
        },
        usageLimit: {
          type: 'number',
          description: 'Total usage limit',
        },
        perCustomer: {
          type: 'number',
          description: 'Uses per customer',
        },
        firstOrderOnly: {
          type: 'boolean',
          description: 'Only valid for first orders',
        },
        startsAt: {
          type: 'string',
          description: 'Start date (ISO string)',
        },
        expiresAt: {
          type: 'string',
          description: 'Expiry date (ISO string)',
        },
        enabled: {
          type: 'boolean',
          description: 'Enable immediately',
          default: true,
        },
      },
      required: ['code', 'type', 'value'],
    },
    handler: `
      const { prisma } = await import('../../db');

      // Check for existing code
      const existing = await prisma.discountCode.findUnique({
        where: { code: args.code.toUpperCase() },
      });

      if (existing) {
        throw new Error('Discount code already exists');
      }

      const discount = await prisma.discountCode.create({
        data: {
          code: args.code.toUpperCase(),
          description: args.description,
          type: args.type,
          value: args.value,
          minOrderValue: args.minOrderValue,
          maxDiscount: args.maxDiscount,
          usageLimit: args.usageLimit,
          perCustomer: args.perCustomer,
          firstOrderOnly: args.firstOrderOnly || false,
          startsAt: args.startsAt ? new Date(args.startsAt) : new Date(),
          expiresAt: args.expiresAt ? new Date(args.expiresAt) : null,
          enabled: args.enabled !== false,
        },
      });

      return {
        success: true,
        discount: {
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          enabled: discount.enabled,
        },
      };
    `,
  },
];
