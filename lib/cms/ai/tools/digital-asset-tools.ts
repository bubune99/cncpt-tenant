/**
 * Digital Asset Tools — Atlas Redesign G08
 *
 * Agent tools for digital assets (files, version history) and license key management.
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

export const listDigitalAssets = tool({
  description: 'List digital assets for a tenant. Optionally filter by linked product.',
  inputSchema: z.object({
    tenantId: z.number().int(),
    productId: z.string().optional(),
  }),
  execute: async ({ tenantId, productId }) => {
    try {
      const prisma = await getDb()

      const assets = await withTimeout(
        prisma.digitalAsset.findMany({
          where: { tenantId, ...(productId ? { products: { some: { id: productId } } } : {}) },
          include: { _count: { select: { licenseKeys: true, downloads: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        5000,
        'List digital assets timed out'
      )

      return { success: true, assets, count: assets.length }
    } catch (error: unknown) {
      return { success: false, assets: [], count: 0, error: error instanceof Error ? error.message : 'Failed' }
    }
  },
})

export const getDigitalAsset = tool({
  description: 'Get a digital asset with license key stats.',
  inputSchema: z.object({
    id: z.string(),
  }),
  execute: async ({ id }) => {
    try {
      const prisma = await getDb()

      const asset = await withTimeout(
        prisma.digitalAsset.findUnique({
          where: { id },
          include: {
            _count: { select: { licenseKeys: true, downloads: true } },
          },
        }),
        5000,
        'Get digital asset timed out'
      )

      if (!asset) return { success: false, error: 'Digital asset not found' }

      return { success: true, asset }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get digital asset' }
    }
  },
})

export const listLicenseKeys = tool({
  description: 'List license keys for a digital asset, optionally filtered by status.',
  inputSchema: z.object({
    assetId: z.string(),
    status: z.enum(['AVAILABLE', 'ASSIGNED', 'ACTIVATED', 'EXPIRED', 'REVOKED']).optional(),
    limit: z.number().int().optional(),
  }),
  execute: async ({ assetId, status, limit }) => {
    try {
      const prisma = await getDb()
      const take = Math.min(limit ?? 50, 200)

      const [keys, total] = await withTimeout(
        Promise.all([
          prisma.licenseKey.findMany({
            where: { digitalAssetId: assetId, ...(status ? { status } : {}) },
            take,
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true, assignedAt: true, lastActivatedAt: true, createdAt: true },
          }),
          prisma.licenseKey.count({
            where: { digitalAssetId: assetId, ...(status ? { status } : {}) },
          }),
        ]),
        5000,
        'List license keys timed out'
      )

      return { success: true, keys, total, assetId }
    } catch (error: unknown) {
      return { success: false, keys: [], total: 0, error: error instanceof Error ? error.message : 'Failed' }
    }
  },
})

export const revokeLicenseKey = tool({
  description: 'Revoke a license key, preventing further activations.',
  inputSchema: z.object({
    keyId: z.string(),
  }),
  execute: async ({ keyId }) => {
    try {
      const prisma = await getDb()

      const key = await withTimeout(
        prisma.licenseKey.update({
          where: { id: keyId },
          data: { status: 'REVOKED' },
          select: { id: true, status: true, digitalAssetId: true },
        }),
        5000,
        'Revoke license key timed out'
      )

      return { success: true, key, message: `License key ${keyId} revoked` }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to revoke license key' }
    }
  },
})

export const getLicenseKeyStats = tool({
  description: 'Get license key availability stats for a digital asset.',
  inputSchema: z.object({
    assetId: z.string(),
  }),
  execute: async ({ assetId }) => {
    try {
      const prisma = await getDb()

      const counts = await withTimeout(
        prisma.licenseKey.groupBy({
          by: ['status'],
          where: { digitalAssetId: assetId },
          _count: { id: true },
        }),
        5000,
        'License key stats timed out'
      )

      const stats = Object.fromEntries(counts.map(c => [c.status, c._count.id]))

      return {
        success: true,
        assetId,
        stats,
        total: Object.values(stats).reduce((sum, n) => sum + n, 0),
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get stats' }
    }
  },
})

export const digitalAssetTools = { listDigitalAssets, getDigitalAsset, listLicenseKeys, revokeLicenseKey, getLicenseKeyStats }
