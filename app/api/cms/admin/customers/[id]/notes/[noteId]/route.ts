/**
 * Customer Note [noteId] API — Atlas Redesign G10
 *
 * PUT    /api/cms/admin/customers/[id]/notes/[noteId] — update note
 * DELETE /api/cms/admin/customers/[id]/notes/[noteId] — delete note
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string; noteId: string }>
}

const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  pinned: z.boolean().optional(),
})

export async function PUT(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: customerId, noteId } = await context.params
      const body: unknown = await request.json()

      const parsed = updateNoteSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      // Verify customer belongs to tenant
      const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      const note = await prisma.customerNote.update({
        where: { id: noteId },
        data: {
          ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
          ...(parsed.data.pinned !== undefined ? { pinned: parsed.data.pinned } : {}),
        },
      })

      return NextResponse.json({ success: true, data: note })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update note' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: customerId, noteId } = await context.params

      // Verify customer belongs to tenant
      const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      await prisma.customerNote.delete({ where: { id: noteId } })

      return NextResponse.json({ success: true, data: { deleted: true, noteId } })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to delete note' },
        { status: 500 }
      )
    }
  })
}
