/**
 * License Keys API — Atlas Redesign G08
 *
 * GET  /api/cms/digital-assets/[id]/license-keys  — list license keys
 * POST /api/cms/digital-assets/[id]/license-keys  — bulk import license keys
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const bulkImportSchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(1000),
})

export async function GET(request: NextRequest, context: RouteContext) {
  return withTenant(request, async (tenant) => {
    try {
      const { id: digitalAssetId } = await context.params
      const { searchParams } = new URL(request.url)
      const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
      const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
      const skip = (page - 1) * limit
      const status = searchParams.get('status')

      const asset = await prisma.digitalAsset.findFirst({
        where: { id: digitalAssetId, tenantId: tenant.tenantId },
        select: { id: true },
      })
      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }

      const where = {
        digitalAssetId,
        ...(status ? { status: status as 'AVAILABLE' | 'ASSIGNED' | 'ACTIVATED' | 'EXPIRED' | 'REVOKED' } : {}),
      }

      const [keys, total] = await Promise.all([
        prisma.licenseKey.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            key: true,
            status: true,
            activationCount: true,
            lastActivatedAt: true,
            assignedEmail: true,
            assignedAt: true,
            orderId: true,
            orderItemId: true,
            createdAt: true,
          },
        }),
        prisma.licenseKey.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: keys,
        meta: { total, page, limit },
      })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list license keys' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: digitalAssetId } = await context.params
      const body: unknown = await request.json()

      const parsed = bulkImportSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const asset = await prisma.digitalAsset.findFirst({
        where: { id: digitalAssetId, tenantId: tenant.tenantId },
        select: { id: true },
      })
      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }

      // Deduplicate keys from input
      const uniqueKeys = [...new Set(parsed.data.keys)]

      // Filter out keys that already exist
      const existing = await prisma.licenseKey.findMany({
        where: { key: { in: uniqueKeys } },
        select: { key: true },
      })
      const existingSet = new Set(existing.map((k) => k.key))
      const newKeys = uniqueKeys.filter((k) => !existingSet.has(k))

      if (newKeys.length === 0) {
        return NextResponse.json(
          { error: 'All provided keys already exist', data: { imported: 0, skipped: uniqueKeys.length } },
          { status: 409 }
        )
      }

      await prisma.licenseKey.createMany({
        data: newKeys.map((key) => ({ digitalAssetId, key })),
        skipDuplicates: true,
      })

      return NextResponse.json({
        success: true,
        data: { imported: newKeys.length, skipped: uniqueKeys.length - newKeys.length },
      }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to import license keys' },
        { status: 500 }
      )
    }
  })
}
