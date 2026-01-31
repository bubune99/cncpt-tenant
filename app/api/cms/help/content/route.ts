/**
 * Help Content API
 *
 * GET /api/help/content - Get help content for an element
 * POST /api/help/content - Create new help content
 * PUT /api/help/content - Update help content
 * DELETE /api/help/content - Delete help content
 */

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const elementKey = searchParams.get('elementKey')
    const storeId = searchParams.get('storeId')
    const all = searchParams.get('all')

    // List all help content
    if (all === 'true') {
      const content = await db.helpContent.findMany({
        where: storeId ? { storeId } : {},
        orderBy: { elementKey: 'asc' },
        include: {
          tour: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
      })

      return NextResponse.json(content)
    }

    // Get specific content
    if (!elementKey) {
      return NextResponse.json(
        { error: 'elementKey is required' },
        { status: 400 }
      )
    }

    // First try store-specific content
    let content = storeId
      ? await db.helpContent.findUnique({
        where: {
          elementKey_storeId: {
            elementKey,
            storeId,
          },
        },
        include: {
          tour: true,
        },
      })
      : null

    // Fall back to global content
    if (!content) {
      content = await db.helpContent.findFirst({
        where: {
          elementKey,
          storeId: null,
        },
        include: {
          tour: true,
        },
      })
    }

    if (!content) {
      return NextResponse.json(null)
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('Get help content error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get help content' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      elementKey,
      title,
      summary,
      details,
      mediaUrl,
      mediaType,
      relatedKeys,
      tourId,
      storeId,
      authorId,
    } = body

    if (!elementKey || !title || !summary) {
      return NextResponse.json(
        { error: 'elementKey, title, and summary are required' },
        { status: 400 }
      )
    }

    // Check if content already exists for this element/store combo
    const existing = await db.helpContent.findFirst({
      where: {
        elementKey,
        storeId: storeId || null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Help content already exists for this element. Use PUT to update.' },
        { status: 409 }
      )
    }

    const content = await db.helpContent.create({
      data: {
        elementKey,
        title,
        summary,
        details,
        mediaUrl,
        mediaType,
        relatedKeys: relatedKeys || [],
        tourId,
        storeId: storeId || null,
        createdBy: 'MANUAL',
        authorId,
      },
      include: {
        tour: true,
      },
    })

    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error('Create help content error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create help content' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      elementKey,
      storeId,
      title,
      summary,
      details,
      mediaUrl,
      mediaType,
      relatedKeys,
      tourId,
    } = body

    // Find existing content by ID or by element key
    let existing
    if (id) {
      existing = await db.helpContent.findUnique({ where: { id } })
    } else if (elementKey) {
      existing = await db.helpContent.findFirst({
        where: {
          elementKey,
          storeId: storeId || null,
        },
      })
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Help content not found' },
        { status: 404 }
      )
    }

    const content = await db.helpContent.update({
      where: { id: existing.id },
      data: {
        title: title ?? existing.title,
        summary: summary ?? existing.summary,
        details: details !== undefined ? details : existing.details,
        mediaUrl: mediaUrl !== undefined ? mediaUrl : existing.mediaUrl,
        mediaType: mediaType !== undefined ? mediaType : existing.mediaType,
        relatedKeys: relatedKeys ?? existing.relatedKeys,
        tourId: tourId !== undefined ? tourId : existing.tourId,
        updatedAt: new Date(),
      },
      include: {
        tour: true,
      },
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Update help content error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update help content' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const elementKey = searchParams.get('elementKey')
    const storeId = searchParams.get('storeId')

    if (!id && !elementKey) {
      return NextResponse.json(
        { error: 'id or elementKey is required' },
        { status: 400 }
      )
    }

    let deleted
    if (id) {
      deleted = await db.helpContent.delete({ where: { id } })
    } else if (elementKey) {
      const toDelete = await db.helpContent.findFirst({
        where: {
          elementKey,
          storeId: storeId || null,
        },
      })
      if (toDelete) {
        deleted = await db.helpContent.delete({ where: { id: toDelete.id } })
      }
    }

    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    console.error('Delete help content error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete help content' },
      { status: 500 }
    )
  }
}
