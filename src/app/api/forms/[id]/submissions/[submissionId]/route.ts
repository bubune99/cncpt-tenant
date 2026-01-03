/**
 * Individual Submission API
 *
 * GET /api/forms/[id]/submissions/[submissionId] - Get a submission
 * PATCH /api/forms/[id]/submissions/[submissionId] - Update submission (read/starred)
 * DELETE /api/forms/[id]/submissions/[submissionId] - Delete a submission
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string; submissionId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, submissionId } = await params

    // Check if form exists
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const submission = await prisma.formSubmission.findFirst({
      where: {
        id: submissionId,
        formId: form.id,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, submission })
  } catch (error) {
    console.error('Get submission error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get submission' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, submissionId } = await params
    const body = await request.json()
    const { read, starred } = body

    // Check if form exists
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Check if submission exists
    const existingSubmission = await prisma.formSubmission.findFirst({
      where: {
        id: submissionId,
        formId: form.id,
      },
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const submission = await prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        ...(read !== undefined && { read }),
        ...(starred !== undefined && { starred }),
      },
    })

    return NextResponse.json({ success: true, submission })
  } catch (error) {
    console.error('Update submission error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update submission' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, submissionId } = await params

    // Check if form exists
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Check if submission exists
    const existingSubmission = await prisma.formSubmission.findFirst({
      where: {
        id: submissionId,
        formId: form.id,
      },
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    await prisma.formSubmission.delete({
      where: { id: submissionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete submission error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete submission' },
      { status: 500 }
    )
  }
}
