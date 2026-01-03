/**
 * Single Email Template API
 *
 * Get, update, delete individual templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        slug: template.slug,
        description: template.description,
        category: template.category,
        subject: template.subject,
        preheader: template.preheader,
        html: template.html,
        content: template.content,
        usageCount: template._count.campaigns,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.preheader !== undefined) updateData.preheader = body.preheader
    if (body.html !== undefined) updateData.html = body.html
    if (body.content !== undefined) {
      updateData.content = JSON.parse(JSON.stringify(body.content))
    }

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      template: {
        id: updated.id,
        name: updated.name,
        category: updated.category,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
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

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if template is in use
    if (template._count.campaigns > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Template is used by ${template._count.campaigns} campaign(s). Remove the template from campaigns first.`,
        },
        { status: 400 }
      )
    }

    await prisma.emailTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
