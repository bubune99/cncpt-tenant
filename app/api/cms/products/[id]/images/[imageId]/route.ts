/**
 * Product Image — single attachment endpoint.
 *
 * DELETE /api/cms/products/[id]/images/[imageId]
 *
 * Removes the ProductImage row (the media itself stays in the library).
 * Tenant-scoped + auth-gated via withTenantAuth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const { id, imageId } = await params
      const row = await prisma.productImage.findUnique({ where: { id: imageId } })
      if (!row) {
        return NextResponse.json({ error: 'Image attachment not found' }, { status: 404 })
      }
      if (row.productId !== id) {
        return NextResponse.json(
          { error: 'Image does not belong to this product' },
          { status: 400 }
        )
      }
      await prisma.productImage.delete({ where: { id: imageId } })
      return NextResponse.json({ ok: true })
    } catch (error) {
      console.error('Delete product image error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to delete image' },
        { status: 500 }
      )
    }
  })
}
