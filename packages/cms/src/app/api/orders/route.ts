/**
 * Orders API Routes
 *
 * GET  /api/orders - List all orders with pagination and filters
 * POST /api/orders - Create a new order (typically from checkout)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'
import { reserveStock, getAvailableStock } from '../../../lib/inventory'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
            select: {
              id: true,
              name: true,
            },
          },
          currentStage: {
            select: {
              id: true,
              displayName: true,
              color: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          _count: {
            select: {
              shipments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing orders:', error)
    return NextResponse.json({ error: 'Failed to list orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate a session ID for stock reservations
    const sessionId = body.sessionId || `order-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Verify stock availability before creating order
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        const productId = item.productId as string
        const variantId = item.variantId as string | undefined
        const quantity = item.quantity as number

        const available = await getAvailableStock(productId, variantId)
        if (available < quantity && available !== Number.MAX_SAFE_INTEGER) {
          return NextResponse.json(
            {
              error: 'Insufficient stock',
              details: {
                productId,
                variantId,
                requested: quantity,
                available,
              },
            },
            { status: 400 }
          )
        }
      }
    }

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        email: body.email,
        customerId: body.customerId,
        subtotal: body.subtotal || 0,
        taxTotal: body.tax || body.taxTotal || 0,
        shippingTotal: body.shipping || body.shippingTotal || 0,
        total: body.total || 0,
        shippingAddressId: body.shippingAddressId,
        billingAddressId: body.billingAddressId,
        customerNotes: body.notes || body.customerNotes,
        items: body.items
          ? {
              create: body.items.map((item: Record<string, unknown>) => ({
                productId: item.productId as string,
                variantId: item.variantId as string | undefined,
                quantity: item.quantity as number,
                price: item.price as number,
                total: (item.quantity as number) * (item.price as number),
              })),
            }
          : undefined,
      },
      include: {
        items: true,
      },
    })

    // Reserve stock for each item
    const reservations: string[] = []
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        const productId = item.productId as string
        const variantId = item.variantId as string | undefined
        const quantity = item.quantity as number

        const result = await reserveStock(productId, quantity, sessionId, variantId)
        if (result.success && result.reservationId) {
          reservations.push(result.reservationId)
        }
      }

      // Link reservations to the order
      if (reservations.length > 0) {
        await prisma.stockReservation.updateMany({
          where: { id: { in: reservations } },
          data: { orderId: order.id },
        })
      }
    }

    return NextResponse.json({ order, sessionId, reservations }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
