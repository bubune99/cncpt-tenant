/**
 * Blog Tag Detail API
 *
 * GET /api/blog/tags/[id] - Get tag details
 * PUT /api/blog/tags/[id] - Update tag
 * DELETE /api/blog/tags/[id] - Delete tag
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTag, updateTag, deleteTag } from '../../../../../lib/blog'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const tag = await getTag(id)

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Get tag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get tag' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await getTag(id)

    if (!existing) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    const tag = await updateTag(id, body)

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Update tag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update tag' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await getTag(id)

    if (!existing) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    await deleteTag(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete tag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
