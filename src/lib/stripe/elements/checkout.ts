/**
 * Stripe Checkout Utilities
 *
 * Helper functions for Stripe Checkout flows.
 */

import type {
  CreateCheckoutParams,
  CheckoutSessionResult,
  CreatePaymentIntentParams,
  PaymentIntentResult,
} from './types';

// ============================================================================
// SERVER-SIDE UTILITIES
// ============================================================================

/**
 * Create a payment intent via API
 * Can be used from Server Components or client-side
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams,
  options?: { baseUrl?: string }
): Promise<PaymentIntentResult> {
  const baseUrl = options?.baseUrl || '';

  const response = await fetch(`${baseUrl}/api/payments/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to create payment intent');
  }

  const data = await response.json();
  return {
    paymentIntentId: data.paymentIntentId,
    clientSecret: data.clientSecret,
    status: data.status,
    amount: params.amount,
    currency: params.currency || 'usd',
  };
}

/**
 * Create a checkout session via API
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams,
  options?: { baseUrl?: string }
): Promise<CheckoutSessionResult> {
  const baseUrl = options?.baseUrl || '';

  const response = await fetch(`${baseUrl}/api/checkout/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: params.items,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      customerEmail: params.customerEmail,
      customerId: params.customerId,
      orderId: params.orderId,
      mode: params.mode || 'payment',
      allowPromotionCodes: params.allowPromotionCodes,
      shippingAddressCollection: params.collectShippingAddress,
      shippingOptions: params.shippingOptions,
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Get payment intent status
 */
export async function getPaymentIntentStatus(
  paymentIntentId: string,
  options?: { baseUrl?: string }
): Promise<{ status: string; amount?: number; currency?: string }> {
  const baseUrl = options?.baseUrl || '';

  const response = await fetch(
    `${baseUrl}/api/payments/intent?paymentIntentId=${encodeURIComponent(paymentIntentId)}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to get payment status');
  }

  return response.json();
}

/**
 * Get checkout session status
 */
export async function getCheckoutSessionStatus(
  sessionId: string,
  options?: { baseUrl?: string }
): Promise<{
  status: string;
  paymentStatus: string;
  amountTotal?: number;
  currency?: string;
  customerEmail?: string;
}> {
  const baseUrl = options?.baseUrl || '';

  const response = await fetch(
    `${baseUrl}/api/checkout/session?sessionId=${encodeURIComponent(sessionId)}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to get session status');
  }

  return response.json();
}

// ============================================================================
// URL UTILITIES
// ============================================================================

/**
 * Parse Stripe redirect parameters from URL
 */
export function parseStripeRedirectParams(url?: string): {
  paymentIntentId: string | null;
  clientSecret: string | null;
  redirectStatus: string | null;
  sessionId: string | null;
} {
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(url || window.location.search)
    : new URLSearchParams(url || '');

  return {
    paymentIntentId: searchParams.get('payment_intent'),
    clientSecret: searchParams.get('payment_intent_client_secret'),
    redirectStatus: searchParams.get('redirect_status'),
    sessionId: searchParams.get('session_id'),
  };
}

/**
 * Build checkout success URL with session ID placeholder
 */
export function buildCheckoutSuccessUrl(basePath: string, baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}${basePath}?session_id={CHECKOUT_SESSION_ID}`;
}

/**
 * Build payment return URL
 */
export function buildPaymentReturnUrl(basePath: string, baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}${basePath}`;
}

// ============================================================================
// AMOUNT UTILITIES
// ============================================================================

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format amount for display
 */
export function formatAmount(cents: number, currency = 'usd', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * Calculate order total from line items
 */
export function calculateTotal(
  items: Array<{ price: number; quantity: number }>
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate payment amount (must be positive, reasonable)
 */
export function validateAmount(
  cents: number,
  options?: { minCents?: number; maxCents?: number; currency?: string }
): { valid: boolean; error?: string } {
  const { minCents = 50, maxCents = 99999999 } = options || {};

  if (!Number.isInteger(cents)) {
    return { valid: false, error: 'Amount must be a whole number (cents)' };
  }

  if (cents < minCents) {
    return { valid: false, error: `Minimum amount is ${formatAmount(minCents)}` };
  }

  if (cents > maxCents) {
    return { valid: false, error: `Maximum amount is ${formatAmount(maxCents)}` };
  }

  return { valid: true };
}

/**
 * Validate checkout items
 */
export function validateCheckoutItems(
  items: Array<{ name: string; price: number; quantity: number }>
): { valid: boolean; error?: string } {
  if (!items || items.length === 0) {
    return { valid: false, error: 'At least one item is required' };
  }

  for (const item of items) {
    if (!item.name || item.name.trim() === '') {
      return { valid: false, error: 'All items must have a name' };
    }

    if (item.price < 0) {
      return { valid: false, error: 'Item prices cannot be negative' };
    }

    if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
      return { valid: false, error: 'Item quantities must be positive integers' };
    }
  }

  return { valid: true };
}

// ============================================================================
// ORDER INTEGRATION
// ============================================================================

/**
 * Create checkout from order data
 * Helper for integrating with your order system
 */
export async function createCheckoutFromOrder(
  orderId: string,
  options?: {
    successPath?: string;
    cancelPath?: string;
    baseUrl?: string;
  }
): Promise<CheckoutSessionResult> {
  const baseUrl = options?.baseUrl || '';
  const successPath = options?.successPath || '/checkout/success';
  const cancelPath = options?.cancelPath || '/checkout/cancel';

  const response = await fetch(`${baseUrl}/api/checkout/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      successUrl: buildCheckoutSuccessUrl(successPath, baseUrl),
      cancelUrl: buildPaymentReturnUrl(cancelPath, baseUrl),
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to create checkout for order');
  }

  return response.json();
}

/**
 * Create payment intent from order
 */
export async function createPaymentIntentFromOrder(
  orderId: string,
  options?: { baseUrl?: string }
): Promise<PaymentIntentResult> {
  const baseUrl = options?.baseUrl || '';

  const response = await fetch(`${baseUrl}/api/payments/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to create payment for order');
  }

  const data = await response.json();
  return {
    paymentIntentId: data.paymentIntentId,
    clientSecret: data.clientSecret,
    status: data.status,
    amount: data.amount,
    currency: data.currency || 'usd',
  };
}
