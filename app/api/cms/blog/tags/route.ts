/**
 * Blog Tags API
 *
 * GET /api/blog/tags - List all tags
 * POST /api/blog/tags - Create a new tag
 */

import { NextRequest, NextResponse } from 'next/server'
import { listTags, createTag } from '@/lib/cms/blog'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const options = {
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await listTags(options)

    return NextResponse.json(result)
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

    if (!body.name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      )
    }

    const tag = await createTag(body)

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Create tag error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create tag' },
      { status: 500 }
    )
  }
}
