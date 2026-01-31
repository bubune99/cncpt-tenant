/**
 * Blog Categories API
 *
 * GET /api/blog/categories - List all categories
 * POST /api/blog/categories - Create a new category
 */

import { NextRequest, NextResponse } from 'next/server'
import { listCategories, createCategory } from '../../../../lib/blog'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const options = {
      parentId: searchParams.has('parentId')
        ? searchParams.get('parentId') || null
        : undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await listCategories(options)

    return NextResponse.json(result)
  } catch (error) {
    console.error('List categories error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const category = await createCategory(body)

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create category' },
      { status: 500 }
    )
  }
}
