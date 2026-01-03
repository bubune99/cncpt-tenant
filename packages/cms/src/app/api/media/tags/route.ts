/**
 * Media Tags API
 *
 * GET /api/media/tags - List all tags
 * POST /api/media/tags - Create new tag
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  listTags,
  createTag,
  searchTags,
  getPopularTags,
  getOrCreateTag,
} from '@/lib/media/tags'
import type { TagCreateInput } from '@/lib/media/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const popular = searchParams.get('popular') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (search) {
      const tags = await searchTags(search, limit)
      return NextResponse.json(tags)
    }

    if (popular) {
      const tags = await getPopularTags(limit)
      return NextResponse.json(tags)
    }

    const tags = await listTags()

    return NextResponse.json(tags)
  } catch (error) {
    console.error('List tags error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support getOrCreate pattern
    if (body.getOrCreate) {
      const tag = await getOrCreateTag(body.name, body.color)
      return NextResponse.json(tag, { status: 200 })
    }

    const input: TagCreateInput = {
      name: body.name,
      slug: body.slug,
      color: body.color,
    }

    if (!input.name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    const tag = await createTag(input)

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Create tag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create tag' },
      { status: 500 }
    )
  }
}
