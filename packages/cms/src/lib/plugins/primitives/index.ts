/**
 * Domain Primitives Index
 *
 * Aggregates all domain-specific primitive definitions.
 * Each domain file exports a *_PRIMITIVES array.
 */

// Core e-commerce primitives
export { AI_PRIMITIVES } from './ai';
export { ANALYTICS_PRIMITIVES } from './analytics';
export { BLOG_PRIMITIVES } from './blog';
export { CART_PRIMITIVES } from './cart';
export { CUSTOMER_PRIMITIVES } from './customer';
export { DISCOUNT_PRIMITIVES } from './discount';
export { EMAIL_PRIMITIVES } from './email';
export { GIFTCARD_PRIMITIVES } from './giftcard';
export { MEDIA_PRIMITIVES } from './media';
export { NOTIFICATION_PRIMITIVES } from './notification';
export { ORDER_PRIMITIVES } from './order';
export { PAYMENT_PRIMITIVES } from './payment';
export { PRODUCT_PRIMITIVES } from './product';
export { REVIEW_PRIMITIVES } from './review';
export { SHIPPING_PRIMITIVES } from './shipping';
export { WISHLIST_PRIMITIVES } from './wishlist';

// Import all for aggregation
import { AI_PRIMITIVES } from './ai';
import { ANALYTICS_PRIMITIVES } from './analytics';
import { BLOG_PRIMITIVES } from './blog';
import { CART_PRIMITIVES } from './cart';
import { CUSTOMER_PRIMITIVES } from './customer';
import { DISCOUNT_PRIMITIVES } from './discount';
import { EMAIL_PRIMITIVES } from './email';
import { GIFTCARD_PRIMITIVES } from './giftcard';
import { MEDIA_PRIMITIVES } from './media';
import { NOTIFICATION_PRIMITIVES } from './notification';
import { ORDER_PRIMITIVES } from './order';
import { PAYMENT_PRIMITIVES } from './payment';
import { PRODUCT_PRIMITIVES } from './product';
import { REVIEW_PRIMITIVES } from './review';
import { SHIPPING_PRIMITIVES } from './shipping';
import { WISHLIST_PRIMITIVES } from './wishlist';

import type { CreatePrimitiveRequest } from '../types';

/**
 * All domain primitives combined
 */
export const DOMAIN_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  ...AI_PRIMITIVES,
  ...ANALYTICS_PRIMITIVES,
  ...BLOG_PRIMITIVES,
  ...CART_PRIMITIVES,
  ...CUSTOMER_PRIMITIVES,
  ...DISCOUNT_PRIMITIVES,
  ...EMAIL_PRIMITIVES,
  ...GIFTCARD_PRIMITIVES,
  ...MEDIA_PRIMITIVES,
  ...NOTIFICATION_PRIMITIVES,
  ...ORDER_PRIMITIVES,
  ...PAYMENT_PRIMITIVES,
  ...PRODUCT_PRIMITIVES,
  ...REVIEW_PRIMITIVES,
  ...SHIPPING_PRIMITIVES,
  ...WISHLIST_PRIMITIVES,
];

/**
 * Get primitives by category/domain
 */
export function getPrimitivesByDomain(domain: string): Array<CreatePrimitiveRequest & { builtIn: true }> {
  switch (domain) {
    case 'ai':
      return AI_PRIMITIVES;
    case 'analytics':
      return ANALYTICS_PRIMITIVES;
    case 'blog':
      return BLOG_PRIMITIVES;
    case 'cart':
      return CART_PRIMITIVES;
    case 'customer':
      return CUSTOMER_PRIMITIVES;
    case 'discount':
      return DISCOUNT_PRIMITIVES;
    case 'email':
      return EMAIL_PRIMITIVES;
    case 'giftcard':
      return GIFTCARD_PRIMITIVES;
    case 'media':
      return MEDIA_PRIMITIVES;
    case 'notification':
      return NOTIFICATION_PRIMITIVES;
    case 'order':
      return ORDER_PRIMITIVES;
    case 'payment':
      return PAYMENT_PRIMITIVES;
    case 'product':
      return PRODUCT_PRIMITIVES;
    case 'review':
      return REVIEW_PRIMITIVES;
    case 'shipping':
      return SHIPPING_PRIMITIVES;
    case 'wishlist':
      return WISHLIST_PRIMITIVES;
    default:
      return [];
  }
}

/**
 * List available domains
 */
export const AVAILABLE_DOMAINS = [
  'ai',
  'analytics',
  'blog',
  'cart',
  'customer',
  'discount',
  'email',
  'giftcard',
  'media',
  'notification',
  'order',
  'payment',
  'product',
  'review',
  'shipping',
  'wishlist',
] as const;

export type PrimitiveDomain = typeof AVAILABLE_DOMAINS[number];
