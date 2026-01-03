/**
 * Single Tag API
 *
 * GET /api/media/tags/[id] - Get single tag
 * PUT /api/media/tags/[id] - Update tag
 * DELETE /api/media/tags/[id] - Delete tag
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTag, updateTag, deleteTag } from '../../../../../lib/media/tags'
import type { TagUpdateInput } from '../../../../../lib/media/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tag = await getTag(id)

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const input: TagUpdateInput = {}

    if (body.name !== undefined) input.name = body.name
    if (body.slug !== undefined) input.slug = body.slug
    if (body.color !== undefined) input.color = body.color

    const tag = await updateTag(id, input)

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Update tag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update tag' },
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
