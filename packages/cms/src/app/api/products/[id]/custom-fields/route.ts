/**
 * Product Custom Fields Configuration API
 *
 * GET /api/products/[id]/custom-fields - Get product's selected custom fields
 * POST /api/products/[id]/custom-fields - Add custom field(s) to product
 * DELETE /api/products/[id]/custom-fields - Remove custom field(s) from product
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

interface AddCustomFieldsBody {
  fieldIds: string[]
  positions?: Record<string, number> // fieldId -> position
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

    // Get product's custom fields
    const productCustomFields = await prisma.productCustomField.findMany({
      where: { productId },
      include: {
        customField: {
          include: {
            _count: {
              select: {
                variantValues: {
                  where: {
                    variant: { productId },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { position: 'asc' },
    })

    // Get all available custom fields for "add field" dropdown
    const allFields = await prisma.customField.findMany({
      where: { enabled: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    })

    const assignedFieldIds = new Set(productCustomFields.map((pcf) => pcf.customFieldId))
    const availableFields = allFields.filter((f) => !assignedFieldIds.has(f.id))

    return NextResponse.json({
      productId,
      productTitle: product.title,
      assignedFields: productCustomFields.map((pcf) => ({
        ...pcf.customField,
        position: pcf.position,
        enabled: pcf.enabled,
        variantValuesCount: pcf.customField._count.variantValues,
      })),
      availableFields,
    })
  } catch (error) {
    console.error('Get product custom fields error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get product custom fields' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params
    const body: AddCustomFieldsBody = await request.json()

    if (!body.fieldIds || body.fieldIds.length === 0) {
      return NextResponse.json({ error: 'At least one field ID is required' }, { status: 400 })
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify all field IDs exist
    const fields = await prisma.customField.findMany({
      where: { id: { in: body.fieldIds } },
    })

    if (fields.length !== body.fieldIds.length) {
      return NextResponse.json(
        { error: 'One or more custom fields not found' },
        { status: 400 }
      )
    }

    // Get current max position
    const maxPosition = await prisma.productCustomField.aggregate({
      where: { productId },
      _max: { position: true },
    })

    let nextPosition = (maxPosition._max.position ?? -1) + 1

    // Add fields to product
    const created: string[] = []
    for (const fieldId of body.fieldIds) {
      try {
        await prisma.productCustomField.create({
          data: {
            productId,
            customFieldId: fieldId,
            position: body.positions?.[fieldId] ?? nextPosition++,
            enabled: true,
          },
        })
        created.push(fieldId)
      } catch (e) {
        // Skip if already exists (unique constraint)
        console.warn(`Field ${fieldId} already assigned to product ${productId}`)
      }
    }

    return NextResponse.json({
      success: true,
      added: created,
    })
  } catch (error) {
    console.error('Add product custom fields error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add custom fields to product' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params
    const body: { fieldId: string; position?: number; enabled?: boolean } = await request.json()

    if (!body.fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 })
    }

    const existing = await prisma.productCustomField.findUnique({
      where: {
        productId_customFieldId: {
          productId,
          customFieldId: body.fieldId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Field not assigned to this product' }, { status: 404 })
    }

    const updateData: { position?: number; enabled?: boolean } = {}
    if (body.position !== undefined) updateData.position = body.position
    if (body.enabled !== undefined) updateData.enabled = body.enabled

    await prisma.productCustomField.update({
      where: {
        productId_customFieldId: {
          productId,
          customFieldId: body.fieldId,
        },
      },
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update product custom field error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product custom field' },
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
    const fieldIds = searchParams.get('fieldIds')?.split(',').filter(Boolean) || []
    const removeValues = searchParams.get('removeValues') === 'true'

    if (fieldIds.length === 0) {
      return NextResponse.json({ error: 'No field IDs provided' }, { status: 400 })
    }

    // If removeValues is true, also delete the variant values for these fields
    if (removeValues) {
      // Get all variants for this product
      const variants = await prisma.productVariant.findMany({
        where: { productId },
        select: { id: true },
      })

      if (variants.length > 0) {
        await prisma.variantCustomFieldValue.deleteMany({
          where: {
            variantId: { in: variants.map((v) => v.id) },
            customFieldId: { in: fieldIds },
          },
        })
      }
    }

    // Remove field assignments
    const result = await prisma.productCustomField.deleteMany({
      where: {
        productId,
        customFieldId: { in: fieldIds },
      },
    })

    return NextResponse.json({
      success: true,
      removed: result.count,
    })
  } catch (error) {
    console.error('Remove product custom fields error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove custom fields from product' },
      { status: 500 }
    )
  }
}
