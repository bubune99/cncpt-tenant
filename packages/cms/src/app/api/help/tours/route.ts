/**
 * Help Tours API
 *
 * GET /api/help/tours - List all available tours
 * POST /api/help/tours - Create a new tour
 * PUT /api/help/tours - Update a tour
 * DELETE /api/help/tours - Delete a tour
 */

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const storeId = searchParams.get('storeId')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    // Get specific tour by slug
    if (slug) {
      const tour = await db.helpTour.findUnique({
        where: { slug },
        include: {
          helpContent: {
            select: {
              id: true,
              elementKey: true,
              title: true,
            },
          },
        },
      })

      if (!tour) {
        return NextResponse.json(
          { error: 'Tour not found' },
          { status: 404 }
        )
      }

      // Increment times started when tour is fetched
      await db.helpTour.update({
        where: { id: tour.id },
        data: { timesStarted: { increment: 1 } },
      })

      return NextResponse.json(tour)
    }

    // List tours
    const tours = await db.helpTour.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(storeId
          ? {
            OR: [{ storeId }, { storeId: null }],
          }
          : {}),
      },
      orderBy: [{ priority: 'desc' }, { title: 'asc' }],
      include: {
        _count: {
          select: { helpContent: true },
        },
      },
    })

    return NextResponse.json(tours)
  } catch (error) {
    console.error('Get help tours error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get help tours' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      slug,
      title,
      description,
      steps,
      options,
      route,
      roles,
      storeId,
      priority,
    } = body

    if (!slug || !title || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'slug, title, and steps (array) are required' },
        { status: 400 }
      )
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const existing = await db.helpTour.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'A tour with this slug already exists' },
        { status: 409 }
      )
    }

    const tour = await db.helpTour.create({
      data: {
        slug,
        title,
        description,
        steps,
        options: options || {},
        route,
        roles: roles || [],
        storeId: (storeId || null) as string | null,
        priority: priority ?? 0,
        isActive: true,
      },
    })

    return NextResponse.json(tour, { status: 201 })
  } catch (error) {
    console.error('Create help tour error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create help tour' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      slug,
      title,
      description,
      steps,
      options,
      route,
      roles,
      storeId,
      priority,
      isActive,
      markCompleted,
    } = body

    // Find tour by ID or slug
    let existing
    if (id) {
      existing = await db.helpTour.findUnique({ where: { id } })
    } else if (slug) {
      existing = await db.helpTour.findUnique({ where: { slug } })
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      )
    }

    // Just mark as completed (for analytics)
    if (markCompleted) {
      const updated = await db.helpTour.update({
        where: { id: existing.id },
        data: { timesCompleted: { increment: 1 } },
      })
      return NextResponse.json(updated)
    }

    const tour = await db.helpTour.update({
      where: { id: existing.id },
      data: {
        title: title ?? existing.title,
        description: description !== undefined ? description : existing.description,
        steps: steps ?? existing.steps,
        options: options !== undefined ? options : existing.options,
        route: route !== undefined ? route : existing.route,
        roles: roles ?? existing.roles,
        storeId: storeId !== undefined ? storeId : existing.storeId,
        priority: priority ?? existing.priority,
        isActive: isActive ?? existing.isActive,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(tour)
  } catch (error) {
    console.error('Update help tour error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update help tour' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')

    if (!id && !slug) {
      return NextResponse.json(
        { error: 'id or slug is required' },
        { status: 400 }
      )
    }

    let deleted
    if (id) {
      deleted = await db.helpTour.delete({ where: { id } })
    } else if (slug) {
      deleted = await db.helpTour.delete({ where: { slug } })
    }

    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    console.error('Delete help tour error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete help tour' },
      { status: 500 }
    )
  }
}
