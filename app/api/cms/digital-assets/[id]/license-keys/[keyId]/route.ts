/**
 * License Key [keyId] API — Atlas Redesign G08
 *
 * PATCH /api/cms/digital-assets/[id]/license-keys/[keyId]  — revoke or update key status
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string; keyId: string }>
}

const updateKeySchema = z.object({
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'ACTIVATED', 'EXPIRED', 'REVOKED']).optional(),
  assignedEmail: z.string().email().nullable().optional(),
})

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: digitalAssetId, keyId } = await context.params
      const body: unknown = await request.json()

      const parsed = updateKeySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      // Verify the asset belongs to tenant
      const asset = await prisma.digitalAsset.findFirst({
        where: { id: digitalAssetId, tenantId: tenant.tenantId },
        select: { id: true },
      })
      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }

      // Verify key belongs to this asset
      const existing = await prisma.licenseKey.findFirst({
        where: { id: keyId, digitalAssetId },
        select: { id: true },
      })
      if (!existing) {
        return NextResponse.json({ error: 'License key not found' }, { status: 404 })
      }

      const updateData: Record<string, unknown> = {}
      if (parsed.data.status !== undefined) {
        updateData.status = parsed.data.status
      }
      if (parsed.data.assignedEmail !== undefined) {
        updateData.assignedEmail = parsed.data.assignedEmail
        if (parsed.data.assignedEmail !== null) {
          updateData.assignedAt = new Date()
        }
      }

      const key = await prisma.licenseKey.update({
        where: { id: keyId },
        data: updateData,
      })

      return NextResponse.json({ success: true, data: key })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update license key' },
        { status: 500 }
      )
    }
  })
}
