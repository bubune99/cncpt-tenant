/**
 * Product Variants API
 *
 * GET /api/products/[id]/variants - List all variants for a product
 * POST /api/products/[id]/variants - Create or bulk update variants
 * DELETE /api/products/[id]/variants - Delete variants by IDs
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { checkAndNotifyBackInStock } from '@/lib/cms/inventory'

interface VariantCustomFieldInput {
  customFieldId: string
  value: unknown
}

interface VariantInput {
  id?: string // For updates
  sku?: string
  barcode?: string
  price: number
  compareAtPrice?: number
  enabled?: boolean
  costPrice?: number
  stock?: number
  lowStockThreshold?: number
  allowBackorder?: boolean
  weight?: number
  length?: number
  width?: number
  height?: number
  imageId?: string
  optionValues?: string[] // Array of ProductOptionValue IDs
  customFields?: VariantCustomFieldInput[]
}

interface BulkUpdateBody {
  variants: VariantInput[]
  deleteIds?: string[] // IDs to delete
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get variants with all related data
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      include: {
        optionValues: {
          include: {
            optionValue: {
              include: {
                option: true,
              },
            },
          },
        },
        customFieldValues: {
          include: {
            customField: true,
          },
        },
        image: {
          select: {
            id: true,
            url: true,
            alt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Get product's custom fields configuration
    const productCustomFields = await prisma.productCustomField.findMany({
      where: { productId, enabled: true },
      include: {
        customField: true,
      },
      orderBy: { position: 'asc' },
    })

    // Get product options for context
    const options = await prisma.productOption.findMany({
      where: { productId },
      include: {
        values: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    })

    // Transform variants for frontend
    const transformedVariants = variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      barcode: variant.barcode,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      enabled: variant.enabled,
      costPrice: variant.costPrice,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold,
      allowBackorder: variant.allowBackorder,
      weight: variant.weight,
      length: variant.length,
      width: variant.width,
      height: variant.height,
      imageId: variant.imageId,
      image: variant.image,
      stripePriceId: variant.stripePriceId,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
      // Option values as key-value pairs
      optionValues: variant.optionValues.reduce(
        (acc, ov) => {
          acc[ov.optionValue.option.name] = {
            optionId: ov.optionValue.option.id,
            valueId: ov.optionValue.id,
            value: ov.optionValue.value,
          }
          return acc
        },
        {} as Record<string, { optionId: string; valueId: string; value: string }>
      ),
      // Custom field values as key-value pairs
      customFields: variant.customFieldValues.reduce(
        (acc, cfv) => {
          acc[cfv.customField.slug] = {
            fieldId: cfv.customField.id,
            type: cfv.customField.type,
            value: cfv.value,
          }
          return acc
        },
        {} as Record<string, { fieldId: string; type: string; value: unknown }>
      ),
    }))

    return NextResponse.json({
      productId,
      productTitle: product.title,
      variants: transformedVariants,
      options,
      customFields: productCustomFields.map((pcf) => pcf.customField),
      total: variants.length,
    })
  } catch (error) {
    console.error('List variants error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list variants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params
    const body: BulkUpdateBody = await request.json()

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const results: { created: string[]; updated: string[]; deleted: string[]; errors: string[] } = {
      created: [],
      updated: [],
      deleted: [],
      errors: [],
    }

    // Process deletions first
    if (body.deleteIds && body.deleteIds.length > 0) {
      await prisma.productVariant.deleteMany({
        where: {
          id: { in: body.deleteIds },
          productId, // Ensure they belong to this product
        },
      })
      results.deleted = body.deleteIds
    }

    // Process variants
    for (const variantInput of body.variants) {
      try {
        if (variantInput.id) {
          // Update existing variant
          const existing = await prisma.productVariant.findUnique({
            where: { id: variantInput.id },
          })

          if (!existing || existing.productId !== productId) {
            results.errors.push(`Variant ${variantInput.id} not found or doesn't belong to this product`)
            continue
          }

          // Update variant
          const updatedVariant = await prisma.productVariant.update({
            where: { id: variantInput.id },
            data: {
              sku: variantInput.sku,
              barcode: variantInput.barcode,
              price: variantInput.price,
              compareAtPrice: variantInput.compareAtPrice,
              enabled: variantInput.enabled ?? true,
              costPrice: variantInput.costPrice,
              stock: variantInput.stock ?? 0,
              lowStockThreshold: variantInput.lowStockThreshold ?? 5,
              allowBackorder: variantInput.allowBackorder ?? false,
              weight: variantInput.weight,
              length: variantInput.length,
              width: variantInput.width,
              height: variantInput.height,
              imageId: variantInput.imageId,
            },
          })

          // Check if stock was increased from 0 and send back-in-stock notifications
          if (
            variantInput.stock !== undefined &&
            existing.stock <= 0 &&
            updatedVariant.stock > 0
          ) {
            checkAndNotifyBackInStock(productId, variantInput.id, updatedVariant.stock).catch(
              (err) => {
                console.error('Error sending back-in-stock notifications for variant:', err)
              }
            )
          }

          // Update option values if provided
          if (variantInput.optionValues) {
            await prisma.productVariantOptionValue.deleteMany({
              where: { variantId: variantInput.id },
            })
            if (variantInput.optionValues.length > 0) {
              await prisma.productVariantOptionValue.createMany({
                data: variantInput.optionValues.map((optionValueId) => ({
                  variantId: variantInput.id!,
                  optionValueId,
                })),
              })
            }
          }

          // Update custom field values if provided
          if (variantInput.customFields) {
            for (const cf of variantInput.customFields) {
              await prisma.variantCustomFieldValue.upsert({
                where: {
                  variantId_customFieldId: {
                    variantId: variantInput.id,
                    customFieldId: cf.customFieldId,
                  },
                },
                create: {
                  variantId: variantInput.id,
                  customFieldId: cf.customFieldId,
                  value: cf.value as object,
                },
                update: {
                  value: cf.value as object,
                },
              })
            }
          }

          results.updated.push(variantInput.id)
        } else {
          // Create new variant
          const newVariant = await prisma.productVariant.create({
            data: {
              productId,
              sku: variantInput.sku,
              barcode: variantInput.barcode,
              price: variantInput.price,
              compareAtPrice: variantInput.compareAtPrice,
              enabled: variantInput.enabled ?? true,
              costPrice: variantInput.costPrice,
              stock: variantInput.stock ?? 0,
              lowStockThreshold: variantInput.lowStockThreshold ?? 5,
              allowBackorder: variantInput.allowBackorder ?? false,
              weight: variantInput.weight,
              length: variantInput.length,
              width: variantInput.width,
              height: variantInput.height,
              imageId: variantInput.imageId,
            },
          })

          // Create option value relationships
          if (variantInput.optionValues && variantInput.optionValues.length > 0) {
            await prisma.productVariantOptionValue.createMany({
              data: variantInput.optionValues.map((optionValueId) => ({
                variantId: newVariant.id,
                optionValueId,
              })),
            })
          }

          // Create custom field values
          if (variantInput.customFields && variantInput.customFields.length > 0) {
            await prisma.variantCustomFieldValue.createMany({
              data: variantInput.customFields.map((cf) => ({
                variantId: newVariant.id,
                customFieldId: cf.customFieldId,
                value: cf.value as object,
              })),
            })
          }

          results.created.push(newVariant.id)
        }
      } catch (variantError) {
        console.error('Variant processing error:', variantError)
        results.errors.push(
          `Error processing variant ${variantInput.id || 'new'}: ${variantError instanceof Error ? variantError.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Bulk update variants error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update variants' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No variant IDs provided' }, { status: 400 })
    }

    const result = await prisma.productVariant.deleteMany({
      where: {
        id: { in: ids },
        productId, // Ensure they belong to this product
      },
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
    })
  } catch (error) {
    console.error('Delete variants error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete variants' },
      { status: 500 }
    )
  }
}
