/**
 * Pricing Tools — Atlas Redesign G06
 *
 * Agent tools for managing product pricing tiers and sale schedules.
 */

import { tool } from 'ai'
import { z } from 'zod'

async function getDb() {
  const { prisma } = await import('../../db')
  return prisma
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 5000,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error: unknown) {
    clearTimeout(timeoutId!)
    throw error
  }
}

export const getProductPricing = tool({
  description: 'Get all pricing layers for a product: base price, quantity/member tiers, and active sale schedules.',
  inputSchema: z.object({
    productId: z.string(),
  }),
  execute: async ({ productId }) => {
    try {
      const prisma = await getDb()

      const product = await withTimeout(
        prisma.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            title: true,
            basePrice: true,
            compareAtPrice: true,
            pricingTiers: { where: { enabled: true }, orderBy: { minQty: 'asc' } },
            saleSchedules: { where: { enabled: true }, orderBy: { startsAt: 'asc' } },
          },
        }),
        5000,
        'Get product pricing timed out'
      )

      if (!product) return { success: false, error: 'Product not found' }

      return { success: true, product }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get product pricing' }
    }
  },
})

export const createPricingTier = tool({
  description: 'Create a quantity-break (B2B) or member-tier price for a product.',
  inputSchema: z.object({
    productId: z.string(),
    label: z.string().describe('Display label e.g. "B2B Wholesale" or "Studio Members"'),
    minQty: z.number().int().min(1).describe('Minimum quantity to qualify for this tier'),
    maxQty: z.number().int().optional().describe('Maximum quantity (optional)'),
    price: z.number().int().describe('Price in cents at this tier'),
    type: z.enum(['QTY', 'MEMBER']).describe('QTY = B2B quantity break; MEMBER = loyalty tier'),
  }),
  execute: async ({ productId, label, minQty, maxQty, price, type }) => {
    try {
      const prisma = await getDb()

      const tier = await withTimeout(
        prisma.productPricingTier.create({
          data: { productId, label, minQty, ...(maxQty !== undefined ? { maxQty } : {}), price, type },
        }),
        5000,
        'Create pricing tier timed out'
      )

      return { success: true, tier, message: `Pricing tier "${label}" created` }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create pricing tier' }
    }
  },
})

export const updatePricingTier = tool({
  description: 'Update an existing pricing tier.',
  inputSchema: z.object({
    tierId: z.string(),
    label: z.string().optional(),
    minQty: z.number().int().optional(),
    maxQty: z.number().int().optional(),
    price: z.number().int().optional(),
    enabled: z.boolean().optional(),
  }),
  execute: async ({ tierId, label, minQty, maxQty, price, enabled }) => {
    try {
      const prisma = await getDb()

      const tier = await withTimeout(
        prisma.productPricingTier.update({
          where: { id: tierId },
          data: {
            ...(label !== undefined ? { label } : {}),
            ...(minQty !== undefined ? { minQty } : {}),
            ...(maxQty !== undefined ? { maxQty } : {}),
            ...(price !== undefined ? { price } : {}),
            ...(enabled !== undefined ? { enabled } : {}),
          },
        }),
        5000,
        'Update pricing tier timed out'
      )

      return { success: true, tier }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update pricing tier' }
    }
  },
})

export const createSaleSchedule = tool({
  description: 'Schedule a timed sale price window for a product (or specific variant).',
  inputSchema: z.object({
    productId: z.string(),
    salePrice: z.number().int().describe('Sale price in cents'),
    startsAt: z.string().describe('ISO datetime when sale starts'),
    endsAt: z.string().describe('ISO datetime when sale ends'),
    variantId: z.string().optional().describe('If set, applies only to this variant'),
  }),
  execute: async ({ productId, salePrice, startsAt, endsAt, variantId }) => {
    try {
      const prisma = await getDb()

      const schedule = await withTimeout(
        prisma.productSaleSchedule.create({
          data: {
            productId,
            salePrice,
            startsAt: new Date(startsAt),
            endsAt: new Date(endsAt),
            ...(variantId ? { variantId } : {}),
          },
        }),
        5000,
        'Create sale schedule timed out'
      )

      return {
        success: true,
        schedule,
        message: `Sale scheduled: $${(salePrice / 100).toFixed(2)} from ${startsAt} to ${endsAt}`,
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create sale schedule' }
    }
  },
})

export const pricingTools = { getProductPricing, createPricingTier, updatePricingTier, createSaleSchedule }
