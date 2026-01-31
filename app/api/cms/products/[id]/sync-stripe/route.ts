/**
 * Product Stripe Sync API
 *
 * POST /api/products/[id]/sync-stripe - Sync product to Stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { syncProductToStripe, syncVariantsToStripe } from '@/lib/cms/stripe/product-sync'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { syncVariants = true, forceUpdate = false } = body

    // Get product with variants
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        images: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Sync product to Stripe
    const result = await syncProductToStripe(product, forceUpdate)

    // Sync variants if requested
    let variantResults: Array<{ variantId: string; stripePriceId: string }> = []
    if (syncVariants && product.variants.length > 0) {
      variantResults = await syncVariantsToStripe(
        product.id,
        result.stripeProductId,
        forceUpdate
      )
    }

    return NextResponse.json({
      success: true,
      stripeProductId: result.stripeProductId,
      stripePriceId: result.stripePriceId,
      stripeSyncedAt: result.syncedAt,
      variants: variantResults,
    })
  } catch (error) {
    console.error('Stripe sync error:', error)

    // Update product with sync error
    const { id } = await params
    await prisma.product.update({
      where: { id },
      data: {
        stripeSyncError: error instanceof Error ? error.message : 'Sync failed',
      },
    }).catch(() => {})

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync with Stripe' },
      { status: 500 }
    )
  }
}
