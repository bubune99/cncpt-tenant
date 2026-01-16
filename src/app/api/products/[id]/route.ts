/**
 * Single Product API
 *
 * GET /api/products/[id] - Get product by ID
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete/archive product
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { checkAndNotifyBackInStock } from '../../../../lib/inventory'
import type { ProductStatus, ProductType } from '@prisma/client'

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const includeVariants = searchParams.get('includeVariants') !== 'false'
    const includeImages = searchParams.get('includeImages') !== 'false'
    const includeCategories = searchParams.get('includeCategories') !== 'false'
    const includeOptions = searchParams.get('includeOptions') !== 'false'
    const includeDigitalAsset = searchParams.get('includeDigitalAsset') === 'true'

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: includeVariants
          ? {
              include: {
                optionValues: {
                  include: { optionValue: true },
                },
                image: true,
              },
              orderBy: { createdAt: 'asc' },
            }
          : false,
        images: includeImages
          ? {
              include: { media: true },
              orderBy: { position: 'asc' },
            }
          : false,
        categories: includeCategories
          ? { include: { category: true } }
          : false,
        options: includeOptions
          ? {
              include: { values: { orderBy: { position: 'asc' } } },
              orderBy: { position: 'asc' },
            }
          : false,
        digitalAsset: includeDigitalAsset,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get product' },
      { status: 500 }
    )
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        options: { include: { values: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Extract category IDs for update
    const { categoryIds, options, ...productData } = body

    // If slug is being changed, check for conflicts
    if (productData.slug && productData.slug !== existing.slug) {
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: productData.slug,
          NOT: { id },
        },
      })

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A product with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'slug', 'description', 'descriptionHtml', 'basePrice',
      'compareAtPrice', 'status', 'featured', 'type', 'sku', 'barcode',
      'costPrice', 'taxable', 'taxCode', 'requiresShipping', 'weight',
      'length', 'width', 'height', 'trackInventory', 'stock',
      'lowStockThreshold', 'allowBackorder', 'stripeProductId', 'stripePriceId',
      'stripeSyncedAt', 'stripeSyncError', 'subscriptionInterval',
      'subscriptionIntervalCount', 'trialDays', 'bundleItems', 'bundlePriceMode',
      'digitalAssetId', 'serviceDuration', 'serviceCapacity', 'metaTitle',
      'metaDescription',
    ]

    for (const field of allowedFields) {
      if (field in productData) {
        updateData[field] = productData[field]
      }
    }

    // Update categories if provided
    if (categoryIds !== undefined) {
      // Remove existing categories
      await prisma.productCategory.deleteMany({
        where: { productId: id },
      })

      // Add new categories
      if (categoryIds.length > 0) {
        await prisma.productCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            productId: id,
            categoryId,
          })),
        })
      }
    }

    // Update options if provided
    if (options !== undefined) {
      // Delete existing options and values
      await prisma.productOption.deleteMany({
        where: { productId: id },
      })

      // Create new options
      if (options.length > 0) {
        for (let i = 0; i < options.length; i++) {
          const option = options[i]
          await prisma.productOption.create({
            data: {
              productId: id,
              name: option.name,
              position: i,
              values: {
                create: option.values.map((value: string, vIndex: number) => ({
                  value,
                  position: vIndex,
                })),
              },
            },
          })
        }
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        categories: { include: { category: true } },
        options: { include: { values: { orderBy: { position: 'asc' } } } },
        variants: {
          include: {
            optionValues: { include: { optionValue: true } },
            image: true,
          },
        },
        images: { include: { media: true } },
        digitalAsset: true,
      },
    })

    // Check if stock was increased and send back-in-stock notifications
    if (
      'stock' in updateData &&
      existing.stock <= 0 &&
      product.stock > 0 &&
      product.type === 'SIMPLE'
    ) {
      // Non-blocking - send notifications in the background
      checkAndNotifyBackInStock(id, undefined, product.stock).catch((err) => {
        console.error('Error sending back-in-stock notifications:', err)
      })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE - Delete or archive product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    // Check product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { orderItems: { take: 1 } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // If product has orders, archive instead of delete
    if (existing.orderItems.length > 0 && hardDelete) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing orders. Use archive instead.' },
        { status: 400 }
      )
    }

    if (hardDelete && existing.orderItems.length === 0) {
      // Hard delete
      await prisma.product.delete({
        where: { id },
      })

      return NextResponse.json({ success: true, deleted: true })
    } else {
      // Soft delete / archive
      const product = await prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      })

      return NextResponse.json({ success: true, archived: true, product })
    }
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    )
  }
}
