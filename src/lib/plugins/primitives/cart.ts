/**
 * Cart Primitives
 *
 * Primitives for shopping cart management including items,
 * coupons, and shipping rate calculations.
 */

import type { CreatePrimitiveRequest } from '../types';

export const CART_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // CART RETRIEVAL
  // ============================================================================
  {
    name: 'cart.get',
    description: 'Get a cart by ID, session ID, or user ID. Returns cart with items and totals.',
    category: 'cart',
    tags: ['cart', 'ecommerce', 'get'],
    icon: 'ShoppingCart',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID to retrieve',
        },
        sessionId: {
          type: 'string',
          description: 'Session ID (for guest carts)',
        },
        userId: {
          type: 'string',
          description: 'User ID (for logged-in users)',
        },
        includeItems: {
          type: 'boolean',
          description: 'Include cart items in response (default: true)',
          default: true,
        },
      },
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      let cart = null;
      const include = args.includeItems !== false ? {
        items: {
          include: {
            product: { select: { id: true, slug: true, status: true } },
            variant: { select: { id: true, sku: true, inventory: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      } : undefined;

      if (args.cartId) {
        cart = await prisma.cart.findUnique({
          where: { id: args.cartId },
          include,
        });
      } else if (args.sessionId) {
        cart = await prisma.cart.findFirst({
          where: { sessionId: args.sessionId, status: 'ACTIVE' },
          include,
        });
      } else if (args.userId) {
        cart = await prisma.cart.findFirst({
          where: { userId: args.userId, status: 'ACTIVE' },
          include,
        });
      } else {
        throw new Error('Must provide cartId, sessionId, or userId');
      }

      return cart;
    `,
  },

  // ============================================================================
  // CART CREATION
  // ============================================================================
  {
    name: 'cart.create',
    description: 'Create a new shopping cart for a session or user.',
    category: 'cart',
    tags: ['cart', 'ecommerce', 'create'],
    icon: 'ShoppingCart',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session ID for guest cart',
        },
        userId: {
          type: 'string',
          description: 'User ID for logged-in user cart',
        },
        email: {
          type: 'string',
          description: 'Email for cart recovery',
        },
      },
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      if (!args.sessionId && !args.userId) {
        throw new Error('Must provide sessionId or userId');
      }

      // Check for existing active cart
      const existing = await prisma.cart.findFirst({
        where: {
          OR: [
            args.sessionId ? { sessionId: args.sessionId, status: 'ACTIVE' } : {},
            args.userId ? { userId: args.userId, status: 'ACTIVE' } : {},
          ].filter(c => Object.keys(c).length > 0),
        },
      });

      if (existing) {
        return existing;
      }

      // Create new cart
      const cart = await prisma.cart.create({
        data: {
          sessionId: args.sessionId,
          userId: args.userId,
          email: args.email,
          status: 'ACTIVE',
          subtotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          shippingTotal: 0,
          total: 0,
        },
      });

      return cart;
    `,
  },

  // ============================================================================
  // CART ITEM MANAGEMENT
  // ============================================================================
  {
    name: 'cart.addItem',
    description: 'Add a product to the cart. Creates cart item or increments quantity if exists.',
    category: 'cart',
    tags: ['cart', 'ecommerce', 'add', 'item'],
    icon: 'Plus',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID',
        },
        productId: {
          type: 'string',
          description: 'Product ID to add',
        },
        variantId: {
          type: 'string',
          description: 'Product variant ID (optional)',
        },
        quantity: {
          type: 'number',
          description: 'Quantity to add (default: 1)',
          default: 1,
        },
      },
      required: ['cartId', 'productId'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      const quantity = args.quantity || 1;

      // Get product and variant info
      const product = await prisma.product.findUnique({
        where: { id: args.productId },
        include: {
          images: { take: 1, orderBy: { position: 'asc' } },
          variants: args.variantId ? { where: { id: args.variantId } } : undefined,
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.status !== 'ACTIVE') {
        throw new Error('Product is not available');
      }

      const variant = args.variantId ? product.variants?.[0] : null;
      const price = variant?.price ?? product.price;
      const imageUrl = product.images[0]?.url || null;

      // Check for existing item
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: args.cartId,
          productId: args.productId,
          variantId: args.variantId || null,
        },
      });

      let item;
      if (existingItem) {
        // Update quantity
        item = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        // Create new item
        item = await prisma.cartItem.create({
          data: {
            cartId: args.cartId,
            productId: args.productId,
            variantId: args.variantId || null,
            quantity,
            title: product.title,
            variantTitle: variant?.title || null,
            price,
            imageUrl,
          },
        });
      }

      // Recalculate cart totals
      const items = await prisma.cartItem.findMany({
        where: { cartId: args.cartId },
      });

      const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

      await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          subtotal,
          total: subtotal, // Will be adjusted when discount/shipping applied
        },
      });

      return item;
    `,
  },
  {
    name: 'cart.updateItem',
    description: 'Update quantity of a cart item.',
    category: 'cart',
    tags: ['cart', 'ecommerce', 'update', 'item'],
    icon: 'Edit',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID',
        },
        itemId: {
          type: 'string',
          description: 'Cart item ID',
        },
        quantity: {
          type: 'number',
          description: 'New quantity (0 removes item)',
        },
      },
      required: ['cartId', 'itemId', 'quantity'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      if (args.quantity <= 0) {
        // Remove item
        await prisma.cartItem.delete({
          where: { id: args.itemId },
        });
      } else {
        // Update quantity
        await prisma.cartItem.update({
          where: { id: args.itemId },
          data: { quantity: args.quantity },
        });
      }

      // Recalculate cart totals
      const items = await prisma.cartItem.findMany({
        where: { cartId: args.cartId },
      });

      const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

      const cart = await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          subtotal,
          total: subtotal - (await prisma.cart.findUnique({ where: { id: args.cartId } }))?.discountTotal || 0,
        },
        include: { items: true },
      });

      return cart;
    `,
  },
  {
    name: 'cart.removeItem',
    description: 'Remove an item from the cart.',
    category: 'cart',
    tags: ['cart', 'ecommerce', 'remove', 'item'],
    icon: 'Trash',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID',
        },
        itemId: {
          type: 'string',
          description: 'Cart item ID to remove',
        },
      },
      required: ['cartId', 'itemId'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      await prisma.cartItem.delete({
        where: { id: args.itemId },
      });

      // Recalculate cart totals
      const items = await prisma.cartItem.findMany({
        where: { cartId: args.cartId },
      });

      const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const cart = await prisma.cart.findUnique({ where: { id: args.cartId } });

      const updated = await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          subtotal,
          total: subtotal - (cart?.discountTotal || 0) + (cart?.shippingTotal || 0) + (cart?.taxTotal || 0),
        },
        include: { items: true },
      });

      return updated;
    `,
  },
  {
    name: 'cart.clear',
    description: 'Remove all items from a cart.',
    category: 'cart',
    tags: ['cart', 'ecommerce', 'clear'],
    icon: 'Trash2',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID to clear',
        },
      },
      required: ['cartId'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      // Delete all items
      await prisma.cartItem.deleteMany({
        where: { cartId: args.cartId },
      });

      // Reset cart totals
      const cart = await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          subtotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          shippingTotal: 0,
          total: 0,
          discountCodeId: null,
        },
        include: { items: true },
      });

      return cart;
    `,
  },

  // ============================================================================
  // COUPON/DISCOUNT MANAGEMENT
  // ============================================================================
  {
    name: 'cart.applyCoupon',
    description: 'Apply a discount code to the cart.',
    category: 'cart',
    tags: ['cart', 'ecommerce', 'coupon', 'discount'],
    icon: 'Tag',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID',
        },
        code: {
          type: 'string',
          description: 'Discount code to apply',
        },
        email: {
          type: 'string',
          description: 'Customer email (for usage validation)',
        },
      },
      required: ['cartId', 'code'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      // Find the discount code
      const discount = await prisma.discountCode.findUnique({
        where: { code: args.code.toUpperCase() },
      });

      if (!discount) {
        throw new Error('Invalid discount code');
      }

      // Check if active
      if (!discount.isActive) {
        throw new Error('Discount code is not active');
      }

      // Check dates
      const now = new Date();
      if (discount.startDate && discount.startDate > now) {
        throw new Error('Discount code is not yet valid');
      }
      if (discount.endDate && discount.endDate < now) {
        throw new Error('Discount code has expired');
      }

      // Check usage limit
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        throw new Error('Discount code usage limit reached');
      }

      // Check per-customer limit
      if (discount.perCustomerLimit && args.email) {
        const customerUsage = await prisma.discountUsage.count({
          where: {
            discountCodeId: discount.id,
            email: args.email,
          },
        });
        if (customerUsage >= discount.perCustomerLimit) {
          throw new Error('You have already used this discount code');
        }
      }

      // Get cart
      const cart = await prisma.cart.findUnique({
        where: { id: args.cartId },
        include: { items: true },
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Check minimum order value
      if (discount.minOrderValue && cart.subtotal < discount.minOrderValue) {
        throw new Error('Order does not meet minimum value for this discount');
      }

      // Calculate discount amount
      let discountAmount = 0;

      if (discount.type === 'PERCENTAGE') {
        discountAmount = Math.floor(cart.subtotal * (discount.value / 100));
        if (discount.maxDiscount) {
          discountAmount = Math.min(discountAmount, discount.maxDiscount);
        }
      } else if (discount.type === 'FIXED') {
        discountAmount = discount.value;
      } else if (discount.type === 'FREE_SHIPPING') {
        discountAmount = cart.shippingTotal;
      }

      // Don't discount more than the subtotal
      discountAmount = Math.min(discountAmount, cart.subtotal);

      // Update cart
      const updated = await prisma.cart.update({
        where: { id: args.cartId },
        data: {
          discountCodeId: discount.id,
          discountTotal: discountAmount,
          total: cart.subtotal - discountAmount + cart.shippingTotal + cart.taxTotal,
        },
        include: { items: true },
      });

      return {
        cart: updated,
        discount: {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          discountAmount,
        },
      };
    `,
  },
  {
    name: 'cart.removeCoupon',
    description: 'Remove applied discount code from the cart.',
    category: 'cart',
    tags: ['cart', 'ecommerce', 'coupon', 'remove'],
    icon: 'X',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID',
        },
      },
      required: ['cartId'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

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
        include: { items: true },
      });

      return updated;
    `,
  },

  // ============================================================================
  // SHIPPING
  // ============================================================================
  {
    name: 'cart.getShippingRates',
    description: 'Get available shipping rates for the cart based on address.',
    category: 'cart',
    tags: ['cart', 'ecommerce', 'shipping', 'rates'],
    icon: 'Truck',
    timeout: 30000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID',
        },
        address: {
          type: 'object',
          description: 'Shipping address',
          properties: {
            street1: { type: 'string' },
            street2: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string' },
          },
          required: ['city', 'state', 'postalCode', 'country'],
        },
      },
      required: ['cartId', 'address'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      const cart = await prisma.cart.findUnique({
        where: { id: args.cartId },
        include: { items: { include: { product: true, variant: true } } },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate total weight
      let totalWeightGrams = 0;
      for (const item of cart.items) {
        const weight = item.variant?.weight ?? item.product?.weight ?? 100; // Default 100g
        totalWeightGrams += weight * item.quantity;
      }

      // Try to get rates from Shippo if configured
      try {
        const { getShippingRates } = await import('@/lib/shippo');
        const rates = await getShippingRates({
          addressTo: {
            street1: args.address.street1,
            street2: args.address.street2,
            city: args.address.city,
            state: args.address.state,
            zip: args.address.postalCode,
            country: args.address.country,
          },
          parcels: [{
            length: 10,
            width: 10,
            height: 10,
            weight: totalWeightGrams / 1000, // Convert to kg
            massUnit: 'kg',
            distanceUnit: 'cm',
          }],
        });

        return {
          rates: rates.map(r => ({
            id: r.objectId,
            carrier: r.provider,
            service: r.servicelevel?.name || 'Standard',
            price: Math.round(parseFloat(r.amount) * 100), // Convert to cents
            currency: r.currency,
            estimatedDays: r.estimatedDays,
          })),
        };
      } catch (e) {
        // Fallback to flat rate shipping
        return {
          rates: [
            {
              id: 'flat_standard',
              carrier: 'Flat Rate',
              service: 'Standard Shipping',
              price: 999, // $9.99
              currency: 'USD',
              estimatedDays: 5,
            },
            {
              id: 'flat_express',
              carrier: 'Flat Rate',
              service: 'Express Shipping',
              price: 1999, // $19.99
              currency: 'USD',
              estimatedDays: 2,
            },
          ],
        };
      }
    `,
  },
];
