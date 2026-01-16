/**
 * Blog Category Detail API
 *
 * GET /api/blog/categories/[id] - Get category details
 * PUT /api/blog/categories/[id] - Update category
 * DELETE /api/blog/categories/[id] - Delete category
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCategory, updateCategory, deleteCategory } from '../../../../../lib/blog'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const category = await getCategory(id)

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get category' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await getCategory(id)

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const category = await updateCategory(id, body)

    return NextResponse.json(category)
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await getCategory(id)

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    await deleteCategory(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete category' },
      { status: 500 }
    )
  }
}
