/**
 * Customer Notes API — Atlas Redesign G10
 *
 * GET  /api/cms/admin/customers/[id]/notes — list notes
 * POST /api/cms/admin/customers/[id]/notes — add note
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const createNoteSchema = z.object({
  content: z.string().min(1),
  pinned: z.boolean().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  return withTenant(request, async (tenant) => {
    try {
      const { id: customerId } = await context.params

      const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      const notes = await prisma.customerNote.findMany({
        where: { customerId },
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      })

      return NextResponse.json({ success: true, data: notes })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list notes' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant, user) => {
    try {
      const { id: customerId } = await context.params
      const body: unknown = await request.json()

      const parsed = createNoteSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId: tenant.tenantId }, select: { id: true } })
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      const note = await prisma.customerNote.create({
        data: {
          customerId,
          authorId: user.id,
          content: parsed.data.content,
          pinned: parsed.data.pinned ?? false,
        },
      })

      return NextResponse.json({ success: true, data: note }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create note' },
        { status: 500 }
      )
    }
  })
}
