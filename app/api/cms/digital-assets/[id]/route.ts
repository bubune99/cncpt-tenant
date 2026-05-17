/**
 * Digital Asset [id] API — Atlas Redesign G08
 *
 * GET    /api/cms/digital-assets/[id]  — get single asset
 * PUT    /api/cms/digital-assets/[id]  — update asset metadata
 * DELETE /api/cms/digital-assets/[id]  — delete asset
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const updateAssetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().min(0).optional(),
  mimeType: z.string().optional(),
  maxDownloads: z.number().int().min(1).nullable().optional(),
  expiresInDays: z.number().int().min(1).nullable().optional(),
  useLicenseKeys: z.boolean().optional(),
  licenseKeyPattern: z.string().optional(),
  maxActivations: z.number().int().min(1).nullable().optional(),
  version: z.string().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  return withTenant(request, async (tenant) => {
    try {
      const { id } = await context.params

      const asset = await prisma.digitalAsset.findFirst({
        where: { id, tenantId: tenant.tenantId },
        include: {
          _count: { select: { licenseKeys: true, downloads: true } },
        },
      })

      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: asset })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch asset' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id } = await context.params
      const body: unknown = await request.json()

      const parsed = updateAssetSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const existing = await prisma.digitalAsset.findFirst({ where: { id, tenantId: tenant.tenantId }, select: { id: true } })
      if (!existing) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }

      const asset = await prisma.digitalAsset.update({
        where: { id },
        data: parsed.data,
      })

      return NextResponse.json({ success: true, data: asset })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update asset' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id } = await context.params

      const existing = await prisma.digitalAsset.findFirst({ where: { id, tenantId: tenant.tenantId }, select: { id: true } })
      if (!existing) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }

      await prisma.digitalAsset.delete({ where: { id } })

      return NextResponse.json({ success: true, data: { deleted: true, id } })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to delete asset' },
        { status: 500 }
      )
    }
  })
}
