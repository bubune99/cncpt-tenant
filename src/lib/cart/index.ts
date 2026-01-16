/**
 * Cart Management Service
 *
 * Handles cart operations including:
 * - Guest and authenticated carts
 * - Item management (add, update, remove)
 * - Discount application
 * - Total calculation
 * - Cart merging on login
 * - Abandonment tracking
 */

import { prisma } from '../db';
import { CartStatus } from '@prisma/client';

// Types
export interface CartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CartIdentifier {
  sessionId?: string;
  userId?: string;
  cartId?: string;
}

export interface CartWithItems {
  id: string;
  sessionId: string | null;
  userId: string | null;
  email: string | null;
  status: CartStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  total: number;
  discountCodeId: string | null;
  abandonedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    title: string;
    variantTitle: string | null;
    price: number;
    imageUrl: string | null;
  }>;
  discountCode: {
    id: string;
    code: string;
    type: string;
    value: number;
  } | null;
}

/**
 * Get or create a cart by session ID or user ID
 */
export async function getOrCreateCart(
  identifier: CartIdentifier
): Promise<CartWithItems> {
  const { sessionId, userId, cartId } = identifier;

  // If cartId provided, fetch directly
  if (cartId) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        discountCode: {
          select: { id: true, code: true, type: true, value: true },
        },
      },
    });

    if (cart && cart.status === CartStatus.ACTIVE) {
      return cart as CartWithItems;
    }
  }

  // Try to find existing cart
  let cart = await findExistingCart(identifier);

  // Create new cart if none exists
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        sessionId: sessionId || null,
        userId: userId || null,
        status: CartStatus.ACTIVE,
      },
      include: {
        items: true,
        discountCode: {
          select: { id: true, code: true, type: true, value: true },
        },
      },
    });
  }

  return cart as CartWithItems;
}

/**
 * Find existing active cart
 */
async function findExistingCart(
  identifier: CartIdentifier
): Promise<CartWithItems | null> {
  const { sessionId, userId } = identifier;

  // Prefer user cart over session cart
  if (userId) {
    const cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: CartStatus.ACTIVE,
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        discountCode: {
          select: { id: true, code: true, type: true, value: true },
        },
      },
    });
    if (cart) return cart as CartWithItems;
  }

  // Fall back to session cart
  if (sessionId) {
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        discountCode: {
          select: { id: true, code: true, type: true, value: true },
        },
      },
    });
    if (cart && cart.status === CartStatus.ACTIVE) {
      return cart as CartWithItems;
    }
  }

  return null;
}

/**
 * Add item to cart
 */
export async function addToCart(
  cartId: string,
  item: CartItemInput
): Promise<CartWithItems> {
  const { productId, variantId, quantity } = item;

  // Get product/variant info for snapshot
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: variantId ? { where: { id: variantId } } : false,
      images: { take: 1, orderBy: { position: 'asc' }, include: { media: true } },
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const variant = variantId
    ? await prisma.productVariant.findUnique({ where: { id: variantId } })
    : null;

  // Determine price (variant price or product basePrice)
  const price = variant?.price ?? product.basePrice ?? 0;
  const title = product.title;
  const variantTitle = variant?.sku || null;
  const imageUrl = product.images[0]?.media?.url || null;

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId: {
        cartId,
        productId,
        variantId: variantId || '',
      },
    },
  });

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    // Create new item
    await prisma.cartItem.create({
      data: {
        cartId,
        productId,
        variantId,
        quantity,
        title,
        variantTitle,
        price,
        imageUrl,
      },
    });
  }

  // Recalculate totals and return updated cart
  return recalculateCart(cartId);
}

/**
 * Update item quantity
 */
export async function updateCartItem(
  cartId: string,
  itemId: string,
  quantity: number
): Promise<CartWithItems> {
  if (quantity <= 0) {
    return removeFromCart(cartId, itemId);
  }

  await prisma.cartItem.update({
    where: { id: itemId, cartId },
    data: { quantity },
  });

  return recalculateCart(cartId);
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  cartId: string,
  itemId: string
): Promise<CartWithItems> {
  await prisma.cartItem.delete({
    where: { id: itemId, cartId },
  });

  return recalculateCart(cartId);
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<CartWithItems> {
  await prisma.cartItem.deleteMany({
    where: { cartId },
  });

  return recalculateCart(cartId);
}

/**
 * Apply discount code to cart
 */
export async function applyDiscount(
  cartId: string,
  code: string
): Promise<{ cart: CartWithItems; error?: string }> {
  // Find discount code
  const discount = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!discount) {
    return {
      cart: await getCartById(cartId),
      error: 'Invalid discount code',
    };
  }

  // Check if discount is enabled
  if (!discount.enabled) {
    return {
      cart: await getCartById(cartId),
      error: 'This discount code is no longer active',
    };
  }

  // Check date validity
  const now = new Date();
  if (discount.startsAt && discount.startsAt > now) {
    return {
      cart: await getCartById(cartId),
      error: 'This discount code is not yet active',
    };
  }
  if (discount.expiresAt && discount.expiresAt < now) {
    return {
      cart: await getCartById(cartId),
      error: 'This discount code has expired',
    };
  }

  // Check usage limit
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return {
      cart: await getCartById(cartId),
      error: 'This discount code has reached its usage limit',
    };
  }

  // Apply discount to cart
  await prisma.cart.update({
    where: { id: cartId },
    data: { discountCodeId: discount.id },
  });

  const cart = await recalculateCart(cartId);

  // Check minimum order value
  if (discount.minOrderValue && cart.subtotal < discount.minOrderValue) {
    // Remove discount if minimum not met
    await prisma.cart.update({
      where: { id: cartId },
      data: { discountCodeId: null },
    });

    return {
      cart: await recalculateCart(cartId),
      error: `Minimum order value of $${(discount.minOrderValue / 100).toFixed(2)} required`,
    };
  }

  return { cart };
}

/**
 * Remove discount from cart
 */
export async function removeDiscount(cartId: string): Promise<CartWithItems> {
  await prisma.cart.update({
    where: { id: cartId },
    data: { discountCodeId: null },
  });

  return recalculateCart(cartId);
}

/**
 * Update cart email (for guest abandonment recovery)
 */
export async function updateCartEmail(
  cartId: string,
  email: string
): Promise<CartWithItems> {
  await prisma.cart.update({
    where: { id: cartId },
    data: { email },
  });

  return getCartById(cartId);
}

/**
 * Merge guest cart into user cart on login
 */
export async function mergeCartsOnLogin(
  sessionId: string,
  userId: string
): Promise<CartWithItems | null> {
  // Find guest cart
  const guestCart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: true },
  });

  if (!guestCart || guestCart.status !== CartStatus.ACTIVE) {
    // No guest cart to merge, return user's existing cart if any
    return findExistingCart({ userId });
  }

  // Find or create user cart
  let userCart = await prisma.cart.findFirst({
    where: { userId, status: CartStatus.ACTIVE },
    include: { items: true },
  });

  if (!userCart) {
    // Convert guest cart to user cart
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: {
        userId,
        sessionId: null, // Clear session ID
      },
    });
    return getCartById(guestCart.id);
  }

  // Merge guest items into user cart
  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find(
      (item) =>
        item.productId === guestItem.productId &&
        item.variantId === guestItem.variantId
    );

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + guestItem.quantity },
      });
    } else {
      // Move item to user cart
      await prisma.cartItem.update({
        where: { id: guestItem.id },
        data: { cartId: userCart.id },
      });
    }
  }

  // Mark guest cart as expired
  await prisma.cart.update({
    where: { id: guestCart.id },
    data: { status: CartStatus.EXPIRED },
  });

  return recalculateCart(userCart.id);
}

/**
 * Mark cart as converted (after successful checkout)
 */
export async function convertCart(
  cartId: string,
  orderId: string
): Promise<void> {
  await prisma.cart.update({
    where: { id: cartId },
    data: {
      status: CartStatus.CONVERTED,
      convertedToOrderId: orderId,
    },
  });
}

/**
 * Get cart by ID
 */
async function getCartById(cartId: string): Promise<CartWithItems> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
      discountCode: {
        select: { id: true, code: true, type: true, value: true },
      },
    },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  return cart as CartWithItems;
}

/**
 * Recalculate cart totals
 */
async function recalculateCart(cartId: string): Promise<CartWithItems> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: true,
      discountCode: true,
    },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  // Calculate subtotal
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate discount
  let discountTotal = 0;
  if (cart.discountCode) {
    const discount = cart.discountCode;
    if (discount.type === 'PERCENTAGE') {
      discountTotal = Math.round(subtotal * (discount.value / 100));
      // Apply max discount cap if set
      if (discount.maxDiscount && discountTotal > discount.maxDiscount) {
        discountTotal = discount.maxDiscount;
      }
    } else if (discount.type === 'FIXED') {
      discountTotal = Math.min(discount.value, subtotal);
    }
    // FREE_SHIPPING handled separately
  }

  // Calculate total (tax and shipping calculated at checkout)
  const total = Math.max(0, subtotal - discountTotal);

  // Update cart totals
  await prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotal,
      discountTotal,
      total,
      updatedAt: new Date(),
    },
  });

  return getCartById(cartId);
}

// =============================================================================
// ABANDONMENT TRACKING
// =============================================================================

/**
 * Mark carts as abandoned after timeout (called by scheduled job)
 */
export async function markAbandonedCarts(
  timeoutMinutes: number = 60
): Promise<number> {
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  const result = await prisma.cart.updateMany({
    where: {
      status: CartStatus.ACTIVE,
      updatedAt: { lt: cutoffTime },
      abandonedAt: null,
      items: { some: {} }, // Has at least one item
    },
    data: {
      status: CartStatus.ABANDONED,
      abandonedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Get abandoned carts for recovery emails
 */
export async function getAbandonedCartsForRecovery(
  minAgeMinutes: number = 60,
  maxAgeHours: number = 72
): Promise<Array<CartWithItems & { email: string }>> {
  const minAge = new Date(Date.now() - minAgeMinutes * 60 * 1000);
  const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const carts = await prisma.cart.findMany({
    where: {
      status: CartStatus.ABANDONED,
      abandonedAt: {
        gte: maxAge,
        lte: minAge,
      },
      recoveryEmailAt: null,
      email: { not: null },
    },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
      discountCode: {
        select: { id: true, code: true, type: true, value: true },
      },
    },
  });

  return carts.filter((cart) => cart.email !== null) as Array<
    CartWithItems & { email: string }
  >;
}

/**
 * Mark recovery email as sent
 */
export async function markRecoveryEmailSent(cartId: string): Promise<void> {
  await prisma.cart.update({
    where: { id: cartId },
    data: { recoveryEmailAt: new Date() },
  });
}

/**
 * Mark cart as recovered (customer returned)
 */
export async function markCartRecovered(cartId: string): Promise<CartWithItems> {
  await prisma.cart.update({
    where: { id: cartId },
    data: {
      status: CartStatus.ACTIVE,
      recoveredAt: new Date(),
    },
  });

  return getCartById(cartId);
}

/**
 * Clean up expired carts (called by scheduled job)
 */
export async function cleanupExpiredCarts(
  expiryDays: number = 30
): Promise<number> {
  const cutoffTime = new Date(Date.now() - expiryDays * 24 * 60 * 60 * 1000);

  // Delete cart items first (cascade should handle this, but being explicit)
  await prisma.cartItem.deleteMany({
    where: {
      cart: {
        OR: [
          { status: CartStatus.EXPIRED },
          {
            status: CartStatus.ABANDONED,
            abandonedAt: { lt: cutoffTime },
          },
        ],
      },
    },
  });

  // Delete expired/old abandoned carts
  const result = await prisma.cart.deleteMany({
    where: {
      OR: [
        { status: CartStatus.EXPIRED },
        {
          status: CartStatus.ABANDONED,
          abandonedAt: { lt: cutoffTime },
        },
      ],
    },
  });

  return result.count;
}

/**
 * Get cart statistics for analytics
 */
export async function getCartStats(): Promise<{
  activeCarts: number;
  abandonedCarts: number;
  recoveredCarts: number;
  conversionRate: number;
  averageCartValue: number;
}> {
  const [active, abandoned, recovered, converted, avgValue] = await Promise.all([
    prisma.cart.count({ where: { status: CartStatus.ACTIVE } }),
    prisma.cart.count({ where: { status: CartStatus.ABANDONED } }),
    prisma.cart.count({ where: { recoveredAt: { not: null } } }),
    prisma.cart.count({ where: { status: CartStatus.CONVERTED } }),
    prisma.cart.aggregate({
      where: { status: CartStatus.ACTIVE, total: { gt: 0 } },
      _avg: { total: true },
    }),
  ]);

  const totalWithItems = abandoned + converted + recovered;
  const conversionRate = totalWithItems > 0 ? (converted / totalWithItems) * 100 : 0;

  return {
    activeCarts: active,
    abandonedCarts: abandoned,
    recoveredCarts: recovered,
    conversionRate: Math.round(conversionRate * 100) / 100,
    averageCartValue: avgValue._avg.total || 0,
  };
}
