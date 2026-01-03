/**
 * Blog Posts API
 *
 * GET /api/blog/posts - List all posts
 * POST /api/blog/posts - Create a new post
 */

import { NextRequest, NextResponse } from 'next/server'
import { listPosts, createPost } from '@/lib/blog'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const options = {
      status: searchParams.get('status') || undefined,
      visibility: searchParams.get('visibility') || undefined,
      authorId: searchParams.get('authorId') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      tagId: searchParams.get('tagId') || undefined,
      featured: searchParams.has('featured')
        ? searchParams.get('featured') === 'true'
        : undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      orderBy: (searchParams.get('orderBy') as any) || 'createdAt',
      orderDir: (searchParams.get('orderDir') as any) || 'desc',
    }

    const result = await listPosts(options)

    return NextResponse.json(result)
  } catch (error) {
    console.error('List posts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Post title is required' },
        { status: 400 }
      )
    }

    const post = await createPost(body)

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    )
  }
}
