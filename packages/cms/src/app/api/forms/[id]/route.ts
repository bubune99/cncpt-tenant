/**
 * Individual Form API
 *
 * GET /api/forms/[id] - Get form by ID or slug
 * PATCH /api/forms/[id] - Update form
 * DELETE /api/forms/[id] - Delete form
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Try to find by ID first, then by slug
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, form })
  } catch (error) {
    console.error('Get form error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get form' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      name,
      slug,
      description,
      fields,
      submitButtonText,
      successMessage,
      redirectUrl,
      notifyEmails,
      status,
    } = body

    // Check if form exists
    const existingForm = await prisma.form.findUnique({ where: { id } })
    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // If slug is being changed, ensure it's unique
    if (slug && slug !== existingForm.slug) {
      const slugExists = await prisma.form.findUnique({ where: { slug } })
      if (slugExists) {
        return NextResponse.json(
          { error: 'A form with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const form = await prisma.form.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(fields !== undefined && { fields }),
        ...(submitButtonText !== undefined && { submitButtonText }),
        ...(successMessage !== undefined && { successMessage }),
        ...(redirectUrl !== undefined && { redirectUrl }),
        ...(notifyEmails !== undefined && { notifyEmails }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ success: true, form })
  } catch (error) {
    console.error('Update form error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update form' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if form exists
    const existingForm = await prisma.form.findUnique({ where: { id } })
    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Delete form (cascades to submissions)
    await prisma.form.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete form error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete form' },
      { status: 500 }
    )
  }
}
