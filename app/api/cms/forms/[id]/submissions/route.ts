/**
 * Form Submissions API
 *
 * GET /api/forms/[id]/submissions - List submissions for a form
 * DELETE /api/forms/[id]/submissions - Bulk delete submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const read = searchParams.get('read')
    const starred = searchParams.get('starred')

    // Check if form exists
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const where = {
      formId: form.id,
      ...(read !== null && read !== undefined && { read: read === 'true' }),
      ...(starred !== null && starred !== undefined && { starred: starred === 'true' }),
    }

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.formSubmission.count({ where }),
    ])

    // Get unread count
    const unreadCount = await prisma.formSubmission.count({
      where: { formId: form.id, read: false },
    })

    return NextResponse.json({
      success: true,
      submissions,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List submissions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list submissions' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { submissionIds } = body

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Submission IDs are required' },
        { status: 400 }
      )
    }

    // Check if form exists
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Delete submissions
    const result = await prisma.formSubmission.deleteMany({
      where: {
        id: { in: submissionIds },
        formId: form.id,
      },
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
    })
  } catch (error) {
    console.error('Delete submissions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete submissions' },
      { status: 500 }
    )
  }
}
