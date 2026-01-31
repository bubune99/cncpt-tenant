/**
 * Single Order API Routes
 *
 * GET    /api/orders/:id - Get order details
 * PUT    /api/orders/:id - Update order
 * DELETE /api/orders/:id - Delete order
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        workflow: {
          include: {
            stages: {
              orderBy: { position: 'asc' },
            },
          },
        },
        currentStage: true,
        progress: {
          include: {
            stage: true,
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { enteredAt: 'desc' },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                price: true,
              },
            },
          },
        },
        shipments: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error getting order:', error)
    return NextResponse.json({ error: 'Failed to get order' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: body.status,
        internalNotes: body.notes || body.internalNotes,
        customerNotes: body.customerNotes,
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Soft delete would be better in production
    await prisma.order.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
