/**
 * Stripe Customer Sync Functions
 *
 * Handles synchronization of customers to Stripe
 */

import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import type { Customer, CustomerAddress } from '@prisma/client'

// Get Stripe client
let stripeClient: Stripe | null = null

async function getStripeClient(): Promise<Stripe> {
  if (stripeClient) return stripeClient

  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: 'stripe.' } },
  })

  const secretKey =
    settings.find((s) => s.key === 'stripe.secretKey')?.value ||
    process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Stripe secret key not configured')
  }

  stripeClient = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })
  return stripeClient
}

type CustomerWithAddresses = Customer & {
  addresses?: CustomerAddress[]
}

/**
 * Sync a customer to Stripe
 */
export async function syncCustomerToStripe(
  customer: CustomerWithAddresses,
  forceUpdate = false
): Promise<{
  stripeCustomerId: string
  syncedAt: Date
}> {
  const stripe = await getStripeClient()

  // Get default shipping address
  const defaultAddress =
    customer.addresses?.find((a) => a.isDefaultShipping) ||
    customer.addresses?.[0]

  // Build customer name
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || undefined

  // Build metadata
  const metadata: Record<string, string> = {
    customerId: customer.id,
    source: 'cms_sync',
  }

  if (customer.userId) {
    metadata.userId = customer.userId
  }

  if (customer.company) {
    metadata.company = customer.company
  }

  if (customer.taxId) {
    metadata.taxId = customer.taxId
  }

  let stripeCustomer: Stripe.Customer

  // Check if customer already exists in Stripe
  if (customer.stripeCustomerId && !forceUpdate) {
    try {
      stripeCustomer = (await stripe.customers.retrieve(
        customer.stripeCustomerId
      )) as Stripe.Customer

      if (stripeCustomer.deleted) {
        throw new Error('Customer was deleted')
      }

      // Update customer
      stripeCustomer = await stripe.customers.update(customer.stripeCustomerId, {
        email: customer.email,
        name,
        phone: customer.phone || undefined,
        metadata,
        address: defaultAddress
          ? {
              line1: defaultAddress.street1,
              line2: defaultAddress.street2 || undefined,
              city: defaultAddress.city,
              state: defaultAddress.state || undefined,
              postal_code: defaultAddress.postalCode,
              country: defaultAddress.country,
            }
          : undefined,
      })
    } catch {
      // Customer doesn't exist or was deleted, create new
      stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name,
        phone: customer.phone || undefined,
        metadata,
        address: defaultAddress
          ? {
              line1: defaultAddress.street1,
              line2: defaultAddress.street2 || undefined,
              city: defaultAddress.city,
              state: defaultAddress.state || undefined,
              postal_code: defaultAddress.postalCode,
              country: defaultAddress.country,
            }
          : undefined,
      })
    }
  } else if (customer.stripeCustomerId && forceUpdate) {
    // Force update - update existing
    stripeCustomer = await stripe.customers.update(customer.stripeCustomerId, {
      email: customer.email,
      name,
      phone: customer.phone || undefined,
      metadata,
      address: defaultAddress
        ? {
            line1: defaultAddress.street1,
            line2: defaultAddress.street2 || undefined,
            city: defaultAddress.city,
            state: defaultAddress.state || undefined,
            postal_code: defaultAddress.postalCode,
            country: defaultAddress.country,
          }
        : undefined,
    })
  } else {
    // Check if customer exists by email first
    const existingCustomers = await stripe.customers.list({
      email: customer.email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      // Link to existing customer
      stripeCustomer = existingCustomers.data[0]

      // Update with our metadata
      stripeCustomer = await stripe.customers.update(stripeCustomer.id, {
        name: name || stripeCustomer.name || undefined,
        phone: customer.phone || stripeCustomer.phone || undefined,
        metadata: { ...stripeCustomer.metadata, ...metadata },
      })
    } else {
      // Create new customer
      stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name,
        phone: customer.phone || undefined,
        metadata,
        address: defaultAddress
          ? {
              line1: defaultAddress.street1,
              line2: defaultAddress.street2 || undefined,
              city: defaultAddress.city,
              state: defaultAddress.state || undefined,
              postal_code: defaultAddress.postalCode,
              country: defaultAddress.country,
            }
          : undefined,
      })
    }
  }

  const now = new Date()

  // Update customer in database
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      stripeCustomerId: stripeCustomer.id,
      stripeSyncedAt: now,
      stripeSyncError: null,
    },
  })

  return {
    stripeCustomerId: stripeCustomer.id,
    syncedAt: now,
  }
}

/**
 * Sync multiple customers to Stripe
 */
export async function syncCustomersToStripe(
  customerIds: string[],
  forceUpdate = false
): Promise<{
  succeeded: Array<{ customerId: string; stripeCustomerId: string }>
  failed: Array<{ customerId: string; error: string }>
}> {
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    include: { addresses: true },
  })

  const succeeded: Array<{ customerId: string; stripeCustomerId: string }> = []
  const failed: Array<{ customerId: string; error: string }> = []

  for (const customer of customers) {
    try {
      const result = await syncCustomerToStripe(customer, forceUpdate)
      succeeded.push({
        customerId: customer.id,
        stripeCustomerId: result.stripeCustomerId,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sync failed'

      // Update customer with error
      await prisma.customer.update({
        where: { id: customer.id },
        data: { stripeSyncError: errorMessage },
      })

      failed.push({
        customerId: customer.id,
        error: errorMessage,
      })
    }
  }

  return { succeeded, failed }
}

/**
 * Get Stripe customer for a customer, creating if needed
 */
export async function getOrSyncStripeCustomer(customerId: string): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { addresses: true },
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  if (customer.stripeCustomerId) {
    return customer.stripeCustomerId
  }

  const result = await syncCustomerToStripe(customer)
  return result.stripeCustomerId
}

/**
 * Import a Stripe customer to CMS
 * Creates or links a CMS customer from a Stripe customer
 */
export async function importStripeCustomer(
  stripeCustomerId: string
): Promise<{ customerId: string; linked: boolean; created: boolean }> {
  const stripe = await getStripeClient()

  const stripeCustomer = (await stripe.customers.retrieve(
    stripeCustomerId
  )) as Stripe.Customer

  if (stripeCustomer.deleted) {
    throw new Error('Stripe customer was deleted')
  }

  if (!stripeCustomer.email) {
    throw new Error('Stripe customer has no email')
  }

  // Check if already linked
  let customer = await prisma.customer.findUnique({
    where: { stripeCustomerId },
  })

  if (customer) {
    return { customerId: customer.id, linked: true, created: false }
  }

  // Find by email
  customer = await prisma.customer.findUnique({
    where: { email: stripeCustomer.email },
  })

  if (customer) {
    // Link existing customer
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        stripeCustomerId: stripeCustomer.id,
        stripeSyncedAt: new Date(),
        stripeSyncError: null,
        firstName: customer.firstName || stripeCustomer.name?.split(' ')[0] || undefined,
        lastName: customer.lastName || stripeCustomer.name?.split(' ').slice(1).join(' ') || undefined,
        phone: customer.phone || stripeCustomer.phone || undefined,
      },
    })

    return { customerId: customer.id, linked: true, created: false }
  }

  // Parse name
  const nameParts = stripeCustomer.name?.split(' ') || []
  const firstName = nameParts[0] || undefined
  const lastName = nameParts.slice(1).join(' ') || undefined

  // Create new customer from Stripe customer
  customer = await prisma.customer.create({
    data: {
      email: stripeCustomer.email,
      firstName,
      lastName,
      phone: stripeCustomer.phone || undefined,
      stripeCustomerId: stripeCustomer.id,
      stripeSyncedAt: new Date(),
    },
  })

  // Import address if available
  if (stripeCustomer.address?.line1) {
    await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        label: 'Default',
        firstName,
        lastName,
        street1: stripeCustomer.address.line1,
        street2: stripeCustomer.address.line2 || undefined,
        city: stripeCustomer.address.city || '',
        state: stripeCustomer.address.state || undefined,
        postalCode: stripeCustomer.address.postal_code || '',
        country: stripeCustomer.address.country || 'US',
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
    })
  }

  return { customerId: customer.id, linked: false, created: true }
}

/**
 * Get sync status for a customer
 */
export async function getCustomerSyncStatus(customerId: string): Promise<{
  synced: boolean
  stripeCustomerId: string | null
  syncedAt: Date | null
  error: string | null
  stripeData?: Stripe.Customer
}> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      stripeCustomerId: true,
      stripeSyncedAt: true,
      stripeSyncError: true,
    },
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  const result: {
    synced: boolean
    stripeCustomerId: string | null
    syncedAt: Date | null
    error: string | null
    stripeData?: Stripe.Customer
  } = {
    synced: !!customer.stripeCustomerId,
    stripeCustomerId: customer.stripeCustomerId,
    syncedAt: customer.stripeSyncedAt,
    error: customer.stripeSyncError,
  }

  // Fetch live data from Stripe if synced
  if (customer.stripeCustomerId) {
    try {
      const stripe = await getStripeClient()
      const stripeCustomer = (await stripe.customers.retrieve(
        customer.stripeCustomerId
      )) as Stripe.Customer

      if (!stripeCustomer.deleted) {
        result.stripeData = stripeCustomer
      }
    } catch {
      // Stripe customer may have been deleted
      result.error = 'Customer not found in Stripe'
    }
  }

  return result
}

/**
 * Create or get customer from email (for checkout flows)
 */
export async function getOrCreateCustomerByEmail(
  email: string,
  data?: {
    firstName?: string
    lastName?: string
    phone?: string
  }
): Promise<Customer> {
  let customer = await prisma.customer.findUnique({
    where: { email },
  })

  if (customer) {
    // Update if new data provided
    if (data?.firstName || data?.lastName || data?.phone) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          firstName: data.firstName || customer.firstName,
          lastName: data.lastName || customer.lastName,
          phone: data.phone || customer.phone,
        },
      })
    }
    return customer
  }

  // Create new customer
  customer = await prisma.customer.create({
    data: {
      email,
      firstName: data?.firstName,
      lastName: data?.lastName,
      phone: data?.phone,
    },
  })

  return customer
}

/**
 * Update customer stats after order
 */
export async function updateCustomerStats(customerId: string): Promise<void> {
  const stats = await prisma.order.aggregate({
    where: {
      customerId,
      paymentStatus: 'PAID',
    },
    _count: { id: true },
    _sum: { total: true },
    _max: { createdAt: true },
  })

  const totalOrders = stats._count.id
  const totalSpent = stats._sum.total || 0
  const averageOrder = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      totalOrders,
      totalSpent,
      averageOrder,
      lastOrderAt: stats._max.createdAt,
    },
  })
}
