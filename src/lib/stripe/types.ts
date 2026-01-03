/**
 * Stripe Integration Types
 */

import type Stripe from 'stripe'

// Payment status enum matching Prisma
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

// Checkout session request
export interface CreateCheckoutSessionRequest {
  orderId?: string
  items: CheckoutItem[]
  customerEmail?: string
  customerId?: string
  successUrl: string
  cancelUrl: string
  mode?: 'payment' | 'subscription'
  allowPromotionCodes?: boolean
  shippingAddressCollection?: boolean
  shippingOptions?: ShippingOption[]
  metadata?: Record<string, string>
}

export interface CheckoutItem {
  name: string
  description?: string
  price: number // in cents
  quantity: number
  images?: string[]
  productId?: string
  variantId?: string
  stripePriceId?: string // Use existing Stripe price if available
}

export interface ShippingOption {
  id: string
  displayName: string
  amount: number // in cents
  deliveryEstimate?: {
    minimum: { unit: 'day' | 'week' | 'month'; value: number }
    maximum: { unit: 'day' | 'week' | 'month'; value: number }
  }
}

// Payment intent request
export interface CreatePaymentIntentRequest {
  amount: number // in cents
  currency?: string
  customerId?: string
  customerEmail?: string
  orderId?: string
  metadata?: Record<string, string>
  paymentMethodTypes?: string[]
  captureMethod?: 'automatic' | 'manual'
}

// Customer management
export interface CreateCustomerRequest {
  email: string
  name?: string
  phone?: string
  address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  metadata?: Record<string, string>
}

// Subscription management
export interface CreateSubscriptionRequest {
  customerId: string
  priceId: string
  trialPeriodDays?: number
  metadata?: Record<string, string>
  cancelAtPeriodEnd?: boolean
}

// Refund request
export interface CreateRefundRequest {
  paymentIntentId: string
  amount?: number // partial refund in cents, full if not specified
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  metadata?: Record<string, string>
}

// Webhook event types we handle
export type StripeWebhookEventType =
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'charge.refunded'
  | 'charge.dispute.created'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed'

// Stripe settings stored in database
export interface StripeSettings {
  enabled: boolean
  testMode: boolean
  secretKey?: string
  publishableKey?: string
  webhookSecret?: string
  currency: string
  statementDescriptor?: string
  supportedPaymentMethods: string[]
  automaticTax: boolean
  billingAddressCollection: 'auto' | 'required'
}

// Default Stripe settings
export const DEFAULT_STRIPE_SETTINGS: StripeSettings = {
  enabled: false,
  testMode: true,
  currency: 'usd',
  supportedPaymentMethods: ['card'],
  automaticTax: false,
  billingAddressCollection: 'auto',
}

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { value: 'usd', label: 'USD - US Dollar' },
  { value: 'eur', label: 'EUR - Euro' },
  { value: 'gbp', label: 'GBP - British Pound' },
  { value: 'cad', label: 'CAD - Canadian Dollar' },
  { value: 'aud', label: 'AUD - Australian Dollar' },
  { value: 'jpy', label: 'JPY - Japanese Yen' },
  { value: 'inr', label: 'INR - Indian Rupee' },
] as const

// Payment method options
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'us_bank_account', label: 'ACH Bank Transfer' },
  { value: 'sepa_debit', label: 'SEPA Direct Debit' },
  { value: 'klarna', label: 'Klarna' },
  { value: 'afterpay_clearpay', label: 'Afterpay / Clearpay' },
  { value: 'affirm', label: 'Affirm' },
  { value: 'link', label: 'Link' },
] as const

// Response types
export interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

export interface PaymentIntentResponse {
  paymentIntentId: string
  clientSecret: string
  status: string
}

export interface RefundResponse {
  refundId: string
  status: string
  amount: number
}

// Utility type for Stripe event data
export type StripeEventData = Stripe.Event['data']['object']
