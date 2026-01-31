/**
 * Discount Calculator
 *
 * Calculates discount amounts for carts and orders
 */

import type { DiscountCode } from '@prisma/client';
import { getApplicableItems } from './validator';

export interface CartItem {
  productId: string;
  variantId?: string;
  categoryIds: string[];
  name?: string; // Optional - not always provided in validation context
  quantity: number;
  price: number; // Price per unit in cents
  isOnSale?: boolean;
}

export interface CartTotals {
  subtotal: number; // Sum of item prices in cents
  shippingTotal: number; // Shipping cost in cents
}

export interface DiscountCalculation {
  discountAmount: number; // Total discount in cents
  discountedSubtotal: number; // Subtotal after discount
  discountedShipping: number; // Shipping after discount
  appliedTo: 'order' | 'products' | 'categories' | 'shipping';
  itemDiscounts: Array<{
    productId: string;
    variantId?: string;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
  }>;
  description: string; // Human-readable discount description
}

/**
 * Calculate discount amount for a cart
 */
export function calculateDiscount(
  discount: DiscountCode,
  items: CartItem[],
  totals: CartTotals
): DiscountCalculation {
  const { subtotal, shippingTotal } = totals;

  // Handle FREE_SHIPPING type
  if (discount.type === 'FREE_SHIPPING') {
    return {
      discountAmount: shippingTotal,
      discountedSubtotal: subtotal,
      discountedShipping: 0,
      appliedTo: 'shipping',
      itemDiscounts: [],
      description: 'Free Shipping',
    };
  }

  // Get applicable items for the discount
  const applicableItems = discount.applyTo === 'SHIPPING'
    ? []
    : getApplicableItems(discount, items);

  // Calculate base amount for discount
  const applicableSubtotal =
    discount.applyTo === 'ORDER'
      ? subtotal
      : applicableItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (applicableSubtotal === 0) {
    return {
      discountAmount: 0,
      discountedSubtotal: subtotal,
      discountedShipping: shippingTotal,
      appliedTo: mapApplyTo(discount.applyTo),
      itemDiscounts: [],
      description: 'No applicable items',
    };
  }

  // Calculate raw discount amount
  let rawDiscount = 0;
  let description = '';

  switch (discount.type) {
    case 'PERCENTAGE':
      rawDiscount = Math.floor((applicableSubtotal * discount.value) / 100);
      description = `${discount.value}% off`;
      break;

    case 'FIXED':
      rawDiscount = discount.value;
      description = `$${(discount.value / 100).toFixed(2)} off`;
      break;

    case 'BUY_X_GET_Y':
      // For BUY_X_GET_Y, value represents the discount on Y items
      // This is a simplified implementation
      rawDiscount = calculateBuyXGetYDiscount(discount, applicableItems);
      description = 'Buy X Get Y promotion';
      break;

    default:
      rawDiscount = 0;
      description = 'Unknown discount type';
  }

  // Apply maximum discount cap
  let discountAmount = rawDiscount;
  if (discount.maxDiscount !== null && discountAmount > discount.maxDiscount) {
    discountAmount = discount.maxDiscount;
    description += ` (max $${(discount.maxDiscount / 100).toFixed(2)})`;
  }

  // Ensure discount doesn't exceed applicable amount
  discountAmount = Math.min(discountAmount, applicableSubtotal);

  // Calculate per-item discounts for display
  const itemDiscounts = calculateItemDiscounts(
    discount,
    applicableItems,
    discountAmount,
    applicableSubtotal
  );

  return {
    discountAmount,
    discountedSubtotal: subtotal - discountAmount,
    discountedShipping: shippingTotal,
    appliedTo: mapApplyTo(discount.applyTo),
    itemDiscounts,
    description,
  };
}

/**
 * Calculate BUY_X_GET_Y discount
 * This is a simplified implementation - value represents the discount percentage on Y
 */
function calculateBuyXGetYDiscount(
  discount: DiscountCode,
  items: CartItem[]
): number {
  // Simple implementation: every 3rd item is discounted by value%
  // Can be enhanced with more complex BuyX/GetY config
  let totalDiscount = 0;

  for (const item of items) {
    const freeItems = Math.floor(item.quantity / 3);
    const itemDiscount = Math.floor((item.price * freeItems * discount.value) / 100);
    totalDiscount += itemDiscount;
  }

  return totalDiscount;
}

/**
 * Calculate per-item discount breakdown
 */
function calculateItemDiscounts(
  discount: DiscountCode,
  applicableItems: CartItem[],
  totalDiscount: number,
  applicableSubtotal: number
): DiscountCalculation['itemDiscounts'] {
  if (applicableSubtotal === 0) return [];

  return applicableItems.map((item) => {
    const itemTotal = item.price * item.quantity;
    // Distribute discount proportionally
    const itemDiscount = Math.floor((itemTotal / applicableSubtotal) * totalDiscount);

    return {
      productId: item.productId,
      variantId: item.variantId,
      originalPrice: itemTotal,
      discountAmount: itemDiscount,
      finalPrice: itemTotal - itemDiscount,
    };
  });
}

/**
 * Map applyTo enum to simplified type
 */
function mapApplyTo(applyTo: string): 'order' | 'products' | 'categories' | 'shipping' {
  switch (applyTo) {
    case 'ORDER':
      return 'order';
    case 'PRODUCT':
      return 'products';
    case 'CATEGORY':
      return 'categories';
    case 'SHIPPING':
      return 'shipping';
    default:
      return 'order';
  }
}

/**
 * Format discount for display
 */
export function formatDiscount(discount: DiscountCode): string {
  switch (discount.type) {
    case 'PERCENTAGE':
      return `${discount.value}% off`;
    case 'FIXED':
      return `$${(discount.value / 100).toFixed(2)} off`;
    case 'FREE_SHIPPING':
      return 'Free Shipping';
    case 'BUY_X_GET_Y':
      return 'Special Promotion';
    default:
      return discount.code;
  }
}

/**
 * Get discount code summary for display
 */
export function getDiscountSummary(discount: DiscountCode): {
  type: string;
  value: string;
  conditions: string[];
} {
  const conditions: string[] = [];

  if (discount.minOrderValue) {
    conditions.push(`Min order: $${(discount.minOrderValue / 100).toFixed(2)}`);
  }

  if (discount.maxDiscount) {
    conditions.push(`Max discount: $${(discount.maxDiscount / 100).toFixed(2)}`);
  }

  if (discount.usageLimit) {
    conditions.push(`${discount.usageLimit - discount.usageCount} uses remaining`);
  }

  if (discount.firstOrderOnly) {
    conditions.push('First order only');
  }

  if (discount.expiresAt) {
    const expires = new Date(discount.expiresAt);
    conditions.push(`Expires: ${expires.toLocaleDateString()}`);
  }

  if (discount.applyTo === 'PRODUCT' && discount.productIds.length > 0) {
    conditions.push('Specific products only');
  }

  if (discount.applyTo === 'CATEGORY' && discount.categoryIds.length > 0) {
    conditions.push('Specific categories only');
  }

  if (discount.excludeSaleItems) {
    conditions.push('Excludes sale items');
  }

  return {
    type: discount.type,
    value: formatDiscount(discount),
    conditions,
  };
}

/**
 * Calculate the final cart total with discount applied
 */
export function calculateCartTotals(
  items: CartItem[],
  shippingTotal: number,
  taxRate: number,
  discount: DiscountCode | null
): {
  subtotal: number;
  discountTotal: number;
  discountedSubtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  discountDescription: string | null;
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountTotal = 0;
  let discountedSubtotal = subtotal;
  let discountedShipping = shippingTotal;
  let discountDescription: string | null = null;

  if (discount) {
    const calculation = calculateDiscount(discount, items, { subtotal, shippingTotal });
    discountTotal = calculation.discountAmount;
    discountedSubtotal = calculation.discountedSubtotal;
    discountedShipping = calculation.discountedShipping;
    discountDescription = calculation.description;
  }

  // Calculate tax on discounted subtotal
  const taxTotal = Math.floor((discountedSubtotal * taxRate) / 100);

  // Final total
  const total = discountedSubtotal + discountedShipping + taxTotal;

  return {
    subtotal,
    discountTotal,
    discountedSubtotal,
    shippingTotal: discountedShipping,
    taxTotal,
    total,
    discountDescription,
  };
}
