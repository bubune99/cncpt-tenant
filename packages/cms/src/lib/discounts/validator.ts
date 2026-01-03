/**
 * Discount Code Validator
 *
 * Validates discount codes against all business rules
 */

import { prisma } from '@/lib/db';
import type { DiscountCode, DiscountUsage } from '@prisma/client';

export interface ValidationContext {
  code: string;
  subtotal: number; // Cart subtotal in cents
  userId?: string | null;
  email?: string | null;
  isFirstOrder?: boolean;
  items?: Array<{
    productId: string;
    categoryIds: string[];
    quantity: number;
    price: number; // Price per unit in cents
    isOnSale?: boolean;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  discount: DiscountCode | null;
  error?: string;
  errorCode?: ValidationErrorCode;
}

export type ValidationErrorCode =
  | 'NOT_FOUND'
  | 'DISABLED'
  | 'EXPIRED'
  | 'NOT_STARTED'
  | 'USAGE_LIMIT_REACHED'
  | 'CUSTOMER_LIMIT_REACHED'
  | 'MIN_ORDER_NOT_MET'
  | 'FIRST_ORDER_ONLY'
  | 'NO_APPLICABLE_ITEMS'
  | 'EXCLUDED_ITEMS_ONLY';

/**
 * Validate a discount code against all business rules
 */
export async function validateDiscountCode(
  context: ValidationContext
): Promise<ValidationResult> {
  const { code, subtotal, userId, email, isFirstOrder, items } = context;

  // 1. Find the discount code
  const discount = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!discount) {
    return {
      valid: false,
      discount: null,
      error: 'Invalid discount code',
      errorCode: 'NOT_FOUND',
    };
  }

  // 2. Check if enabled
  if (!discount.enabled) {
    return {
      valid: false,
      discount: null,
      error: 'This discount code is no longer active',
      errorCode: 'DISABLED',
    };
  }

  // 3. Check validity period
  const now = new Date();
  if (discount.startsAt > now) {
    return {
      valid: false,
      discount: null,
      error: 'This discount code is not yet active',
      errorCode: 'NOT_STARTED',
    };
  }

  if (discount.expiresAt && discount.expiresAt < now) {
    return {
      valid: false,
      discount: null,
      error: 'This discount code has expired',
      errorCode: 'EXPIRED',
    };
  }

  // 4. Check total usage limit
  if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
    return {
      valid: false,
      discount: null,
      error: 'This discount code has reached its usage limit',
      errorCode: 'USAGE_LIMIT_REACHED',
    };
  }

  // 5. Check per-customer limit
  if (discount.perCustomer !== null && (userId || email)) {
    const customerUsageCount = await prisma.discountUsage.count({
      where: {
        discountCodeId: discount.id,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (customerUsageCount >= discount.perCustomer) {
      return {
        valid: false,
        discount: null,
        error: 'You have already used this discount code the maximum number of times',
        errorCode: 'CUSTOMER_LIMIT_REACHED',
      };
    }
  }

  // 6. Check minimum order value
  if (discount.minOrderValue !== null && subtotal < discount.minOrderValue) {
    const minAmount = (discount.minOrderValue / 100).toFixed(2);
    return {
      valid: false,
      discount: null,
      error: `Minimum order of $${minAmount} required for this discount`,
      errorCode: 'MIN_ORDER_NOT_MET',
    };
  }

  // 7. Check first order only
  if (discount.firstOrderOnly && !isFirstOrder) {
    return {
      valid: false,
      discount: null,
      error: 'This discount code is only valid for first orders',
      errorCode: 'FIRST_ORDER_ONLY',
    };
  }

  // 8. Check applicability to items (for PRODUCT and CATEGORY apply types)
  if (items && items.length > 0 && discount.applyTo !== 'ORDER' && discount.applyTo !== 'SHIPPING') {
    const applicableItems = getApplicableItems(discount, items);

    if (applicableItems.length === 0) {
      return {
        valid: false,
        discount: null,
        error: 'This discount code does not apply to any items in your cart',
        errorCode: 'NO_APPLICABLE_ITEMS',
      };
    }
  }

  return {
    valid: true,
    discount,
  };
}

/**
 * Get items that a discount applies to
 */
export function getApplicableItems(
  discount: DiscountCode,
  items: Array<{
    productId: string;
    categoryIds: string[];
    quantity: number;
    price: number;
    isOnSale?: boolean;
  }>
): typeof items {
  return items.filter((item) => {
    // Check if item is excluded
    if (discount.excludeProductIds.includes(item.productId)) {
      return false;
    }

    // Check if sale items are excluded
    if (discount.excludeSaleItems && item.isOnSale) {
      return false;
    }

    // For ORDER type, all items apply
    if (discount.applyTo === 'ORDER') {
      return true;
    }

    // For PRODUCT type, check product IDs
    if (discount.applyTo === 'PRODUCT') {
      return discount.productIds.length === 0 || discount.productIds.includes(item.productId);
    }

    // For CATEGORY type, check category IDs
    if (discount.applyTo === 'CATEGORY') {
      if (discount.categoryIds.length === 0) return true;
      return item.categoryIds.some((catId) => discount.categoryIds.includes(catId));
    }

    // For SHIPPING type, no items apply (discount is on shipping)
    if (discount.applyTo === 'SHIPPING') {
      return false;
    }

    return false;
  });
}

/**
 * Check if user is making their first order
 */
export async function isFirstOrderForUser(
  userId?: string | null,
  email?: string | null
): Promise<boolean> {
  if (!userId && !email) {
    return true; // Guest with no email - assume first order
  }

  const existingOrders = await prisma.order.count({
    where: {
      OR: [
        ...(userId ? [{ customerId: userId }] : []),
        ...(email ? [{ email }] : []),
      ],
      paymentStatus: 'PAID',
    },
  });

  return existingOrders === 0;
}

/**
 * Record discount usage after order is placed
 */
export async function recordDiscountUsage(
  discountCodeId: string,
  orderId: string,
  userId: string | null,
  email: string,
  discountAmount: number
): Promise<DiscountUsage> {
  // Create usage record and update discount stats in a transaction
  const [usage] = await prisma.$transaction([
    prisma.discountUsage.create({
      data: {
        discountCodeId,
        orderId,
        userId,
        email,
        discountAmount,
      },
    }),
    prisma.discountCode.update({
      where: { id: discountCodeId },
      data: {
        usageCount: { increment: 1 },
        ordersCount: { increment: 1 },
        revenue: { increment: discountAmount },
      },
    }),
  ]);

  return usage;
}
