/**
 * Forms API
 *
 * GET /api/forms - List forms with filters
 * POST /api/forms - Create new form
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'
import type { FormStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const status = searchParams.get('status') as FormStatus | null
    const search = searchParams.get('search')

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          status: true,
          submissionCount: true,
          submitButtonText: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { submissions: true },
          },
        },
      }),
      prisma.form.count({ where }),
    ])

    return NextResponse.json({
      forms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List forms error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list forms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, fields, submitButtonText, successMessage, redirectUrl, notifyEmails, status } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check for existing slug and make unique if necessary
    let slug = baseSlug
    let counter = 1
    while (await prisma.form.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const form = await prisma.form.create({
      data: {
        name,
        slug,
        description: description || null,
        fields: fields || [],
        submitButtonText: submitButtonText || 'Submit',
        successMessage: successMessage || 'Thank you for your submission!',
        redirectUrl: redirectUrl || null,
        notifyEmails: notifyEmails || [],
        status: status || 'DRAFT',
      },
    })

    return NextResponse.json({ success: true, form }, { status: 201 })
  } catch (error) {
    console.error('Create form error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create form' },
      { status: 500 }
    )
  }
}
