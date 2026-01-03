/**
 * Stripe Product Sync Functions
 *
 * Handles synchronization of products and variants to Stripe
 */

import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import type {
  Product,
  ProductVariant,
  ProductImage,
  Media,
} from '@prisma/client'

// Get Stripe client
let stripeClient: Stripe | null = null

async function getStripeClient(): Promise<Stripe> {
  if (stripeClient) return stripeClient

  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: 'stripe.' } },
  })

  const secretKey = settings.find((s) => s.key === 'stripe.secretKey')?.value ||
    process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Stripe secret key not configured')
  }

  stripeClient = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })
  return stripeClient
}

type ProductWithImages = Product & {
  images?: (ProductImage & { media: Media })[]
}

/**
 * Sync a product to Stripe
 */
export async function syncProductToStripe(
  product: ProductWithImages,
  forceUpdate = false
): Promise<{
  stripeProductId: string
  stripePriceId: string
  syncedAt: Date
}> {
  const stripe = await getStripeClient()

  // Get product images for Stripe
  const images = product.images
    ?.slice(0, 8) // Stripe limits to 8 images
    .map((img) => img.media.url)
    .filter(Boolean) || []

  // Build metadata
  const metadata: Record<string, string> = {
    productId: product.id,
    productType: product.type,
    sku: product.sku || '',
  }

  let stripeProduct: Stripe.Product
  let stripePrice: Stripe.Price

  // Check if product already exists in Stripe
  if (product.stripeProductId && !forceUpdate) {
    try {
      stripeProduct = await stripe.products.retrieve(product.stripeProductId)

      // Update product if needed
      stripeProduct = await stripe.products.update(product.stripeProductId, {
        name: product.title,
        description: product.description || undefined,
        images: images.length > 0 ? images : undefined,
        metadata,
        active: product.status === 'ACTIVE',
      })
    } catch {
      // Product doesn't exist, create new
      stripeProduct = await stripe.products.create({
        name: product.title,
        description: product.description || undefined,
        images: images.length > 0 ? images : undefined,
        metadata,
        default_price_data: product.type !== 'SUBSCRIPTION' ? {
          unit_amount: product.basePrice,
          currency: 'usd',
        } : undefined,
      })
    }
  } else {
    // Create new product
    stripeProduct = await stripe.products.create({
      name: product.title,
      description: product.description || undefined,
      images: images.length > 0 ? images : undefined,
      metadata,
      default_price_data: product.type !== 'SUBSCRIPTION' ? {
        unit_amount: product.basePrice,
        currency: 'usd',
      } : undefined,
    })
  }

  // Handle pricing
  if (product.type === 'SUBSCRIPTION' && product.subscriptionInterval) {
    // Create recurring price for subscriptions
    stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.basePrice,
      currency: 'usd',
      recurring: {
        interval: product.subscriptionInterval as 'day' | 'week' | 'month' | 'year',
        interval_count: product.subscriptionIntervalCount || 1,
      },
      metadata: {
        productId: product.id,
      },
    })

    // Set as default price
    await stripe.products.update(stripeProduct.id, {
      default_price: stripePrice.id,
    })
  } else if (product.stripePriceId) {
    // Get existing price
    try {
      stripePrice = await stripe.prices.retrieve(product.stripePriceId)

      // If price amount changed, create new price
      if (stripePrice.unit_amount !== product.basePrice) {
        // Archive old price
        await stripe.prices.update(product.stripePriceId, { active: false })

        // Create new price
        stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: product.basePrice,
          currency: 'usd',
          metadata: {
            productId: product.id,
          },
        })

        // Set as default
        await stripe.products.update(stripeProduct.id, {
          default_price: stripePrice.id,
        })
      }
    } catch {
      // Price doesn't exist, use default
      stripePrice = await stripe.prices.retrieve(stripeProduct.default_price as string)
    }
  } else {
    // Get default price
    stripePrice = await stripe.prices.retrieve(stripeProduct.default_price as string)
  }

  const now = new Date()

  // Update product in database
  await prisma.product.update({
    where: { id: product.id },
    data: {
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
      stripeSyncedAt: now,
      stripeSyncError: null,
    },
  })

  return {
    stripeProductId: stripeProduct.id,
    stripePriceId: stripePrice.id,
    syncedAt: now,
  }
}

/**
 * Sync product variants to Stripe
 */
export async function syncVariantsToStripe(
  productId: string,
  stripeProductId: string,
  forceUpdate = false
): Promise<Array<{ variantId: string; stripePriceId: string }>> {
  const stripe = await getStripeClient()

  const variants = await prisma.productVariant.findMany({
    where: { productId, enabled: true },
    include: {
      optionValues: {
        include: { optionValue: true },
      },
    },
  })

  const results: Array<{ variantId: string; stripePriceId: string }> = []

  for (const variant of variants) {
    try {
      // Build variant name from option values
      const variantName = variant.optionValues
        .map((ov) => ov.optionValue.value)
        .join(' / ')

      const metadata: Record<string, string> = {
        productId,
        variantId: variant.id,
        sku: variant.sku || '',
        variantName,
      }

      let stripePrice: Stripe.Price

      if (variant.stripePriceId && !forceUpdate) {
        try {
          stripePrice = await stripe.prices.retrieve(variant.stripePriceId)

          // If price changed, create new price
          if (stripePrice.unit_amount !== variant.price) {
            await stripe.prices.update(variant.stripePriceId, { active: false })

            stripePrice = await stripe.prices.create({
              product: stripeProductId,
              unit_amount: variant.price,
              currency: 'usd',
              nickname: variantName || `Variant ${variant.id}`,
              metadata,
            })
          }
        } catch {
          // Price doesn't exist, create new
          stripePrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: variant.price,
            currency: 'usd',
            nickname: variantName || `Variant ${variant.id}`,
            metadata,
          })
        }
      } else {
        // Create new price
        stripePrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: variant.price,
          currency: 'usd',
          nickname: variantName || `Variant ${variant.id}`,
          metadata,
        })
      }

      // Update variant in database
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          stripePriceId: stripePrice.id,
          stripeSyncedAt: new Date(),
          stripeSyncError: null,
        },
      })

      results.push({
        variantId: variant.id,
        stripePriceId: stripePrice.id,
      })
    } catch (error) {
      // Update variant with error
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          stripeSyncError: error instanceof Error ? error.message : 'Sync failed',
        },
      })

      console.error(`Failed to sync variant ${variant.id}:`, error)
    }
  }

  return results
}

/**
 * Archive a product in Stripe
 */
export async function archiveStripeProduct(stripeProductId: string): Promise<void> {
  const stripe = await getStripeClient()

  await stripe.products.update(stripeProductId, {
    active: false,
  })
}

/**
 * Get or create Stripe product for a local product
 */
export async function getOrCreateStripeProduct(
  product: ProductWithImages
): Promise<string> {
  if (product.stripeProductId) {
    return product.stripeProductId
  }

  const result = await syncProductToStripe(product, false)
  return result.stripeProductId
}

/**
 * Get Stripe price for a product or variant
 */
export async function getStripePriceId(
  productId: string,
  variantId?: string
): Promise<string | null> {
  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    })

    if (variant?.stripePriceId) {
      return variant.stripePriceId
    }
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  return product?.stripePriceId || null
}

/**
 * Create PaymentIntent for an order
 */
export async function createOrderPaymentIntent(
  orderId: string
): Promise<{
  clientSecret: string
  paymentIntentId: string
}> {
  const stripe = await getStripeClient()

  // Get order with items
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      customer: true,
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Get or create Stripe customer
  let customerId: string | undefined

  if (order.customer) {
    const customers = await stripe.customers.list({
      email: order.customer.email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customerName = [order.customer.firstName, order.customer.lastName]
        .filter(Boolean)
        .join(' ') || undefined
      const customer = await stripe.customers.create({
        email: order.customer.email,
        name: customerName,
        metadata: {
          customerId: order.customer.id,
        },
      })
      customerId = customer.id
    }
  }

  // Build line items metadata
  const lineItems = order.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId || '',
    title: item.title,
    quantity: item.quantity,
    price: item.price,
  }))

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.total,
    currency: 'usd',
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      lineItems: JSON.stringify(lineItems).substring(0, 500), // Stripe metadata limit
    },
  })

  // Update order with payment intent
  await prisma.order.update({
    where: { id: orderId },
    data: {
      stripePaymentIntentId: paymentIntent.id,
    },
  })

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  }
}
