/**
 * Digital Assets API — Atlas Redesign G08
 *
 * GET  /api/cms/digital-assets  — list digital assets for tenant
 * POST /api/cms/digital-assets  — create a new digital asset
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

const createAssetSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().min(0).optional(),
  mimeType: z.string().optional(),
  maxDownloads: z.number().int().min(1).optional(),
  expiresInDays: z.number().int().min(1).optional(),
  useLicenseKeys: z.boolean().optional(),
  licenseKeyPattern: z.string().optional(),
  maxActivations: z.number().int().min(1).optional(),
  version: z.string().optional(),
})

export async function GET(request: NextRequest) {
  return withTenant(request, async (tenant) => {
    try {
      const { searchParams } = new URL(request.url)
      const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
      const skip = (page - 1) * limit
      const search = searchParams.get('search')

      const where = {
        tenantId: tenant.tenantId,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      }

      const [assets, total] = await Promise.all([
        prisma.digitalAsset.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            version: true,
            useLicenseKeys: true,
            maxDownloads: true,
            expiresInDays: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { licenseKeys: true, downloads: true } },
          },
        }),
        prisma.digitalAsset.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: assets,
        meta: { total, page, limit },
      })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list assets' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const body: unknown = await request.json()

      const parsed = createAssetSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const asset = await prisma.digitalAsset.create({
        data: {
          tenantId: tenant.tenantId,
          ...parsed.data,
        },
      })

      return NextResponse.json({ success: true, data: asset }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create asset' },
        { status: 500 }
      )
    }
  })
}
