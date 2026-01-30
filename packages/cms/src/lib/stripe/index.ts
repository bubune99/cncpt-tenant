/**
 * Stripe Integration Library
 *
 * Provides payment processing, subscriptions, and billing management
 */

import Stripe from 'stripe'
import { prisma } from '../db'
import { safeDecrypt } from '../encryption'
import type {
  StripeSettings,
  CreateCheckoutSessionRequest,
  CreatePaymentIntentRequest,
  CreateCustomerRequest,
  CreateSubscriptionRequest,
  CreateRefundRequest,
  CheckoutSessionResponse,
  PaymentIntentResponse,
  RefundResponse,
} from './types'
import { DEFAULT_STRIPE_SETTINGS } from './types'

// Cache for settings
let settingsCache: StripeSettings | null = null
let settingsCacheTime = 0
const SETTINGS_CACHE_TTL = 60 * 1000 // 1 minute

// Get Stripe client instance
let stripeClient: Stripe | null = null

async function getStripeClient(): Promise<Stripe> {
  const settings = await getStripeSettings()

  if (!settings.secretKey) {
    // Fallback to environment variable
    const envKey = process.env.STRIPE_SECRET_KEY
    if (!envKey) {
      throw new Error('Stripe secret key not configured')
    }
    if (!stripeClient) {
      stripeClient = new Stripe(envKey, { apiVersion: '2025-02-24.acacia' })
    }
    return stripeClient
  }

  // Create new client if key changed
  stripeClient = new Stripe(settings.secretKey, { apiVersion: '2025-02-24.acacia' })
  return stripeClient
}

/**
 * Get Stripe settings from database
 */
export async function getStripeSettings(): Promise<StripeSettings> {
  const now = Date.now()
  if (settingsCache && now - settingsCacheTime < SETTINGS_CACHE_TTL) {
    return settingsCache
  }

  const settingRecords = await prisma.setting.findMany({
    where: {
      key: { startsWith: 'stripe.' },
    },
  })

  const settings: StripeSettings = { ...DEFAULT_STRIPE_SETTINGS }

  for (const record of settingRecords) {
    const key = record.key.replace('stripe.', '')
    switch (key) {
      case 'enabled':
        settings.enabled = record.value === 'true'
        break
      case 'testMode':
        settings.testMode = record.value === 'true'
        break
      case 'secretKey':
        settings.secretKey = safeDecrypt(record.value)
        break
      case 'publishableKey':
        settings.publishableKey = safeDecrypt(record.value)
        break
      case 'webhookSecret':
        settings.webhookSecret = safeDecrypt(record.value)
        break
      case 'currency':
        settings.currency = record.value
        break
      case 'statementDescriptor':
        settings.statementDescriptor = record.value
        break
      case 'supportedPaymentMethods':
        settings.supportedPaymentMethods = JSON.parse(record.value)
        break
      case 'automaticTax':
        settings.automaticTax = record.value === 'true'
        break
      case 'billingAddressCollection':
        settings.billingAddressCollection = record.value as 'auto' | 'required'
        break
    }
  }

  // Use environment variables as fallback
  if (!settings.secretKey) {
    settings.secretKey = process.env.STRIPE_SECRET_KEY
  }
  if (!settings.publishableKey) {
    settings.publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  }
  if (!settings.webhookSecret) {
    settings.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  }

  settingsCache = settings
  settingsCacheTime = now

  return settings
}

/**
 * Clear settings cache
 */
export function clearStripeSettingsCache(): void {
  settingsCache = null
  settingsCacheTime = 0
  stripeClient = null
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  const stripe = await getStripeClient()
  const settings = await getStripeSettings()

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = request.items.map((item) => {
    // Use existing Stripe price if available
    if (item.stripePriceId) {
      return {
        price: item.stripePriceId,
        quantity: item.quantity,
      }
    }

    // Fall back to inline pricing
    return {
      price_data: {
        currency: settings.currency,
        product_data: {
          name: item.name,
          description: item.description,
          images: item.images,
          metadata: item.productId ? { productId: item.productId } : undefined,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }
  })

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: request.mode || 'payment',
    line_items: lineItems,
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
    customer_email: request.customerEmail,
    allow_promotion_codes: request.allowPromotionCodes,
    billing_address_collection: settings.billingAddressCollection,
    metadata: {
      ...request.metadata,
      orderId: request.orderId || '',
    },
  }

  // Add customer if provided
  if (request.customerId) {
    sessionParams.customer = request.customerId
    delete sessionParams.customer_email
  }

  // Add shipping options
  if (request.shippingAddressCollection) {
    sessionParams.shipping_address_collection = {
      allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
    }
  }

  if (request.shippingOptions && request.shippingOptions.length > 0) {
    sessionParams.shipping_options = request.shippingOptions.map((option) => ({
      shipping_rate_data: {
        type: 'fixed_amount' as const,
        fixed_amount: {
          amount: option.amount,
          currency: settings.currency,
        },
        display_name: option.displayName,
        delivery_estimate: option.deliveryEstimate,
      },
    }))
  }

  // Enable automatic tax if configured
  if (settings.automaticTax) {
    sessionParams.automatic_tax = { enabled: true }
  }

  // Set payment method types
  if (settings.supportedPaymentMethods.length > 0) {
    sessionParams.payment_method_types = settings.supportedPaymentMethods as Stripe.Checkout.SessionCreateParams.PaymentMethodType[]
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return {
    sessionId: session.id,
    url: session.url!,
  }
}

/**
 * Create a Payment Intent for custom payment flows
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> {
  const stripe = await getStripeClient()
  const settings = await getStripeSettings()

  const params: Stripe.PaymentIntentCreateParams = {
    amount: request.amount,
    currency: request.currency || settings.currency,
    capture_method: request.captureMethod || 'automatic',
    metadata: {
      ...request.metadata,
      orderId: request.orderId || '',
    },
  }

  if (request.customerId) {
    params.customer = request.customerId
  }

  if (request.paymentMethodTypes && request.paymentMethodTypes.length > 0) {
    params.payment_method_types = request.paymentMethodTypes as string[]
  } else {
    params.automatic_payment_methods = { enabled: true }
  }

  if (settings.statementDescriptor) {
    params.statement_descriptor = settings.statementDescriptor.substring(0, 22)
  }

  const paymentIntent = await stripe.paymentIntents.create(params)

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
    status: paymentIntent.status,
  }
}

/**
 * Capture a payment intent (for manual capture mode)
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  amount?: number
): Promise<PaymentIntentResponse> {
  const stripe = await getStripeClient()

  const params: Stripe.PaymentIntentCaptureParams = {}
  if (amount) {
    params.amount_to_capture = amount
  }

  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, params)

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
    status: paymentIntent.status,
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<void> {
  const stripe = await getStripeClient()
  await stripe.paymentIntents.cancel(paymentIntentId)
}

/**
 * Create or update a Stripe customer
 */
export async function createCustomer(request: CreateCustomerRequest): Promise<string> {
  const stripe = await getStripeClient()

  const params: Stripe.CustomerCreateParams = {
    email: request.email,
    name: request.name,
    phone: request.phone,
    metadata: request.metadata,
  }

  if (request.address) {
    params.address = {
      line1: request.address.line1,
      line2: request.address.line2,
      city: request.address.city,
      state: request.address.state,
      postal_code: request.address.postalCode,
      country: request.address.country,
    }
  }

  const customer = await stripe.customers.create(params)
  return customer.id
}

/**
 * Get or create a Stripe customer by email
 */
export async function getOrCreateCustomer(email: string, name?: string): Promise<string> {
  const stripe = await getStripeClient()

  // Search for existing customer
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0].id
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
  })

  return customer.id
}

/**
 * Create a subscription
 */
export async function createSubscription(
  request: CreateSubscriptionRequest
): Promise<{ subscriptionId: string; status: string; clientSecret?: string }> {
  const stripe = await getStripeClient()

  const params: Stripe.SubscriptionCreateParams = {
    customer: request.customerId,
    items: [{ price: request.priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
    metadata: request.metadata,
  }

  if (request.trialPeriodDays) {
    params.trial_period_days = request.trialPeriodDays
  }

  if (request.cancelAtPeriodEnd) {
    params.cancel_at_period_end = true
  }

  const subscription = await stripe.subscriptions.create(params)

  // Get client secret for payment
  const invoice = subscription.latest_invoice as Stripe.Invoice
  const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    clientSecret: paymentIntent?.client_secret || undefined,
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
): Promise<void> {
  const stripe = await getStripeClient()

  if (immediately) {
    await stripe.subscriptions.cancel(subscriptionId)
  } else {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }
}

/**
 * Create a refund
 */
export async function createRefund(request: CreateRefundRequest): Promise<RefundResponse> {
  const stripe = await getStripeClient()

  const params: Stripe.RefundCreateParams = {
    payment_intent: request.paymentIntentId,
    reason: request.reason,
    metadata: request.metadata,
  }

  if (request.amount) {
    params.amount = request.amount
  }

  const refund = await stripe.refunds.create(params)

  return {
    refundId: refund.id,
    status: refund.status!,
    amount: refund.amount,
  }
}

/**
 * Get a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = await getStripeClient()
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'customer', 'payment_intent'],
  })
}

/**
 * Get a payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const stripe = await getStripeClient()
  return stripe.paymentIntents.retrieve(paymentIntentId)
}

/**
 * Construct and verify a Stripe webhook event
 */
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const stripe = await getStripeClient()
  const settings = await getStripeSettings()

  const webhookSecret = settings.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Create a billing portal session for customer self-service
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = await getStripeClient()

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

/**
 * List customer payment methods
 */
export async function listPaymentMethods(
  customerId: string,
  type: 'card' | 'us_bank_account' = 'card'
): Promise<Stripe.PaymentMethod[]> {
  const stripe = await getStripeClient()

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type,
  })

  return paymentMethods.data
}

/**
 * Get customer invoices
 */
export async function listInvoices(
  customerId: string,
  limit = 10
): Promise<Stripe.Invoice[]> {
  const stripe = await getStripeClient()

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  })

  return invoices.data
}

/**
 * Retrieve product by ID
 */
export async function getProduct(productId: string): Promise<Stripe.Product> {
  const stripe = await getStripeClient()
  return stripe.products.retrieve(productId)
}

/**
 * Create a product in Stripe
 */
export async function createProduct(
  name: string,
  description?: string,
  images?: string[],
  metadata?: Record<string, string>
): Promise<Stripe.Product> {
  const stripe = await getStripeClient()

  return stripe.products.create({
    name,
    description,
    images,
    metadata,
  })
}

/**
 * Create a price for a product
 */
export async function createPrice(
  productId: string,
  unitAmount: number,
  currency?: string,
  recurring?: { interval: 'day' | 'week' | 'month' | 'year'; interval_count?: number }
): Promise<Stripe.Price> {
  const stripe = await getStripeClient()
  const settings = await getStripeSettings()

  const params: Stripe.PriceCreateParams = {
    product: productId,
    unit_amount: unitAmount,
    currency: currency || settings.currency,
  }

  if (recurring) {
    params.recurring = recurring
  }

  return stripe.prices.create(params)
}

export * from './types'
