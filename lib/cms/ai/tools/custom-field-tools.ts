/**
 * Custom Field Tools — Atlas Redesign G07
 *
 * Agent tools for reading and updating the 10-type custom field system.
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

const CUSTOM_FIELD_TYPES = ['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'COLOR', 'IMAGE', 'DATE', 'URL', 'TEXTAREA'] as const

export const listCustomFields = tool({
  description: 'List the custom field library for the current tenant.',
  inputSchema: z.object({
    tenantId: z.number().int().describe('Tenant ID'),
    type: z.enum(CUSTOM_FIELD_TYPES).optional().describe('Filter by field type'),
    enabled: z.boolean().optional().describe('Filter by enabled state'),
  }),
  execute: async ({ tenantId, type, enabled }) => {
    try {
      const prisma = await getDb()

      const fields = await withTimeout(
        prisma.customField.findMany({
          where: {
            tenantId,
            ...(type ? { type } : {}),
            ...(enabled !== undefined ? { enabled } : {}),
          },
          orderBy: { position: 'asc' },
        }),
        5000,
        'List custom fields timed out'
      )

      return { success: true, fields, count: fields.length }
    } catch (error: unknown) {
      return { success: false, fields: [], count: 0, error: error instanceof Error ? error.message : 'Failed' }
    }
  },
})

export const getProductCustomFields = tool({
  description: 'Get custom fields attached to a product with current values per variant.',
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
            customFields: {
              include: { customField: true },
              orderBy: { position: 'asc' },
            },
            variants: {
              select: {
                id: true,
                title: true,
                customFieldValues: {
                  include: { customField: { select: { id: true, name: true, type: true } } },
                },
              },
            },
          },
        }),
        5000,
        'Get product custom fields timed out'
      )

      if (!product) return { success: false, error: 'Product not found' }

      return { success: true, product }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get custom fields' }
    }
  },
})

export const setVariantFieldValue = tool({
  description: 'Set a custom field value for a specific product variant.',
  inputSchema: z.object({
    variantId: z.string(),
    customFieldId: z.string(),
    value: z.unknown().describe('The field value — type must match CustomField.type'),
  }),
  execute: async ({ variantId, customFieldId, value }) => {
    try {
      const prisma = await getDb()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record = await withTimeout(
        prisma.variantCustomFieldValue.upsert({
          where: { variantId_customFieldId: { variantId, customFieldId } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: { variantId, customFieldId, value: value as any },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          update: { value: value as any },
          include: { customField: { select: { name: true, type: true } } },
        }),
        5000,
        'Set variant field value timed out'
      )

      return {
        success: true,
        record: { variantId, customFieldId, fieldName: record.customField.name, type: record.customField.type },
        message: `Field "${record.customField.name}" set for variant`,
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to set field value' }
    }
  },
})

export const attachCustomFieldToProduct = tool({
  description: 'Attach a custom field from the library to a product.',
  inputSchema: z.object({
    productId: z.string(),
    customFieldId: z.string(),
    position: z.number().int().optional().describe('Display position (default: append)'),
  }),
  execute: async ({ productId, customFieldId, position }) => {
    try {
      const prisma = await getDb()

      let pos = position
      if (pos === undefined) {
        const last = await prisma.productCustomField.findFirst({
          where: { productId },
          orderBy: { position: 'desc' },
          select: { position: true },
        })
        pos = (last?.position ?? -1) + 1
      }

      const record = await withTimeout(
        prisma.productCustomField.upsert({
          where: { productId_customFieldId: { productId, customFieldId } },
          create: { productId, customFieldId, position: pos },
          update: { position: pos },
          include: { customField: { select: { name: true } } },
        }),
        5000,
        'Attach custom field timed out'
      )

      return { success: true, record, message: `Custom field "${record.customField.name}" attached` }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to attach custom field' }
    }
  },
})

export const customFieldTools = { listCustomFields, getProductCustomFields, setVariantFieldValue, attachCustomFieldToProduct }
