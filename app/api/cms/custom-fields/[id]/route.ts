/**
 * Single Custom Field API
 *
 * GET /api/custom-fields/[id] - Get a custom field
 * PUT /api/custom-fields/[id] - Update a custom field
 * DELETE /api/custom-fields/[id] - Delete a custom field
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import type { CustomFieldType } from '@prisma/client'

interface UpdateCustomFieldBody {
  name?: string
  slug?: string
  description?: string
  type?: CustomFieldType
  options?: Array<{ value: string; label: string; color?: string }>
  defaultValue?: unknown
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  position?: number
  icon?: string
  enabled?: boolean
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const customField = await prisma.customField.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productFields: true,
            variantValues: true,
          },
        },
      },
    })

    if (!customField) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 })
    }

    return NextResponse.json(customField)
  } catch (error) {
    console.error('Get custom field error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get custom field' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body: UpdateCustomFieldBody = await request.json()

    const existing = await prisma.customField.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 })
    }

    // Check if built-in field (limited edits)
    if (existing.builtIn) {
      // Only allow enabling/disabling and position changes for built-in fields
      const allowedUpdates: Partial<UpdateCustomFieldBody> = {}
      if (body.enabled !== undefined) allowedUpdates.enabled = body.enabled
      if (body.position !== undefined) allowedUpdates.position = body.position

      if (
        Object.keys(body).some(
          (key) => !['enabled', 'position'].includes(key) && body[key as keyof UpdateCustomFieldBody] !== undefined
        )
      ) {
        return NextResponse.json(
          { error: 'Built-in fields can only have enabled and position updated' },
          { status: 403 }
        )
      }
    }

    // Check slug uniqueness if changing
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.customField.findFirst({
        where: { slug: body.slug, tenantId: null },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: `A custom field with slug "${body.slug}" already exists` },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.slug !== undefined) updateData.slug = body.slug.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.type !== undefined) updateData.type = body.type
    if (body.options !== undefined) updateData.options = JSON.stringify(body.options)
    if (body.defaultValue !== undefined)
      updateData.defaultValue = body.defaultValue !== null ? JSON.stringify(body.defaultValue) : null
    if (body.required !== undefined) updateData.required = body.required
    if (body.validation !== undefined)
      updateData.validation = body.validation ? JSON.stringify(body.validation) : null
    if (body.position !== undefined) updateData.position = body.position
    if (body.icon !== undefined) updateData.icon = body.icon || null
    if (body.enabled !== undefined) updateData.enabled = body.enabled

    const customField = await prisma.customField.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(customField)
  } catch (error) {
    console.error('Update custom field error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update custom field' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.customField.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productFields: true,
            variantValues: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 })
    }

    if (existing.builtIn) {
      return NextResponse.json({ error: 'Built-in fields cannot be deleted' }, { status: 403 })
    }

    // Check for usage
    const totalUsage = existing._count.productFields + existing._count.variantValues
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    if (totalUsage > 0 && !force) {
      return NextResponse.json(
        {
          error: 'This field is in use',
          usage: {
            products: existing._count.productFields,
            values: existing._count.variantValues,
          },
          hint: 'Add ?force=true to delete anyway (this will remove all associated data)',
        },
        { status: 409 }
      )
    }

    // Delete the field (cascade will handle related records)
    await prisma.customField.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, deleted: id })
  } catch (error) {
    console.error('Delete custom field error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete custom field' },
      { status: 500 }
    )
  }
}
