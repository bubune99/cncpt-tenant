/**
 * Custom Fields API
 *
 * GET /api/custom-fields - List all global custom fields
 * POST /api/custom-fields - Create a new custom field
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import type { CustomFieldType } from '@prisma/client'

interface CreateCustomFieldBody {
  name: string
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
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enabled = searchParams.get('enabled')
    const type = searchParams.get('type') as CustomFieldType | null

    const where: Record<string, unknown> = {}

    if (enabled !== null) {
      where.enabled = enabled === 'true'
    }
    if (type) {
      where.type = type
    }

    const customFields = await prisma.customField.findMany({
      where,
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            productFields: true,
            variantValues: true,
          },
        },
      },
    })

    return NextResponse.json({
      fields: customFields,
      total: customFields.length,
    })
  } catch (error) {
    console.error('List custom fields error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list custom fields' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCustomFieldBody = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Field name is required' }, { status: 400 })
    }

    // Generate slug if not provided
    const slug = body.slug?.trim() || generateSlug(body.name)

    // Check for duplicate slug
    const existing = await prisma.customField.findFirst({
      where: { slug, tenantId: null },
    })

    if (existing) {
      return NextResponse.json(
        { error: `A custom field with slug "${slug}" already exists` },
        { status: 409 }
      )
    }

    // Get highest position for default positioning
    const maxPosition = await prisma.customField.aggregate({
      _max: { position: true },
    })

    const customField = await prisma.customField.create({
      data: {
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || null,
        type: body.type || 'TEXT',
        options: body.options ? body.options : undefined,
        defaultValue: body.defaultValue != null ? body.defaultValue : undefined,
        required: body.required ?? false,
        validation: body.validation ? body.validation : undefined,
        position: body.position ?? (maxPosition._max.position ?? -1) + 1,
        icon: body.icon || null,
        enabled: true,
        builtIn: false,
      },
    })

    return NextResponse.json(customField, { status: 201 })
  } catch (error) {
    console.error('Create custom field error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create custom field' },
      { status: 500 }
    )
  }
}
