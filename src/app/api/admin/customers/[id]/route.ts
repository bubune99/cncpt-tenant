/**
 * Admin Customer API Routes
 *
 * GET    /api/admin/customers/:id - Get customer details with orders and addresses
 * PATCH  /api/admin/customers/:id - Update customer
 * DELETE /api/admin/customers/:id - Delete customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                id: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        addresses: {
          select: {
            id: true,
            label: true,
            firstName: true,
            lastName: true,
            company: true,
            street1: true,
            street2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true,
            isDefaultShipping: true,
            isDefaultBilling: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Transform the response to match the frontend interface
    const response = {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      company: customer.company,
      taxId: customer.taxId,
      notes: customer.notes,
      tags: customer.tags,
      stripeCustomerId: customer.stripeCustomerId,
      stripeSyncedAt: customer.stripeSyncedAt?.toISOString(),
      acceptsMarketing: customer.acceptsMarketing,
      marketingOptInAt: customer.marketingOptInAt?.toISOString(),
      marketingOptOutAt: customer.marketingOptOutAt?.toISOString(),
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      averageOrder: customer.averageOrder,
      lastOrderAt: customer.lastOrderAt?.toISOString(),
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      orders: customer.orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        itemCount: order.items.length,
        createdAt: order.createdAt.toISOString(),
      })),
      addresses: customer.addresses.map((addr) => ({
        id: addr.id,
        label: addr.label,
        firstName: addr.firstName || '',
        lastName: addr.lastName || '',
        company: addr.company,
        street1: addr.street1,
        street2: addr.street2,
        city: addr.city,
        state: addr.state || '',
        postalCode: addr.postalCode,
        country: addr.country,
        phone: addr.phone,
        isDefault: addr.isDefaultShipping || addr.isDefaultBilling,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting customer:', error)
    return NextResponse.json({ error: 'Failed to get customer' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (body.firstName !== undefined) updateData.firstName = body.firstName || null
    if (body.lastName !== undefined) updateData.lastName = body.lastName || null
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.company !== undefined) updateData.company = body.company || null
    if (body.taxId !== undefined) updateData.taxId = body.taxId || null
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.tags !== undefined) updateData.tags = body.tags

    // Handle marketing preferences
    if (body.acceptsMarketing !== undefined) {
      const customer = await prisma.customer.findUnique({
        where: { id },
        select: { acceptsMarketing: true },
      })

      if (customer && body.acceptsMarketing !== customer.acceptsMarketing) {
        updateData.acceptsMarketing = body.acceptsMarketing
        if (body.acceptsMarketing) {
          updateData.marketingOptInAt = new Date()
          updateData.marketingOptOutAt = null
        } else {
          updateData.marketingOptOutAt = new Date()
        }
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Disassociate orders from customer before deletion
    await prisma.order.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    })

    // Delete customer addresses
    await prisma.customerAddress.deleteMany({
      where: { customerId: id },
    })

    // Delete customer
    await prisma.customer.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
