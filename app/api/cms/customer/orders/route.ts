/**
 * Customer Orders API
 *
 * GET /api/customer/orders - Get orders for the authenticated customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/cms/stack';
import { prisma } from '@/lib/cms/db';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find the customer linked to this user
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      select: { customer: { select: { id: true } } },
    });

    if (!user?.customer) {
      // User exists but is not a customer - return empty orders
      return NextResponse.json({ orders: [], total: 0, limit: 10, offset: 0 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const statusParam = searchParams.get('status');

    // Build where clause
    const customerId = user.customer.id;
    const statusFilter = statusParam && statusParam !== 'all'
      ? (statusParam.toUpperCase() as OrderStatus)
      : undefined;

    // Fetch orders with items and shipments
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId,
          ...(statusFilter && { status: statusFilter }),
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: { title: true, slug: true },
                  },
                  image: { select: { url: true, alt: true } },
                },
              },
            },
          },
          shipments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({
        where: {
          customerId,
          ...(statusFilter && { status: statusFilter }),
        },
      }),
    ]);

    // Transform orders for response
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status.toLowerCase(),
      paymentStatus: order.paymentStatus.toLowerCase(),
      subtotal: order.subtotal,
      shippingTotal: order.shippingTotal,
      taxTotal: order.taxTotal,
      discountTotal: order.discountTotal,
      total: order.total,
      itemCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.price, // 'price' field in schema
        totalPrice: item.total, // 'total' field in schema
        productTitle: item.title || item.variant?.product?.title || 'Unknown Product',
        productSlug: item.variant?.product?.slug,
        variantSku: item.sku || item.variant?.sku,
        image: item.variant?.image?.url,
      })),
      shipment: order.shipments[0]
        ? {
            id: order.shipments[0].id,
            carrier: order.shipments[0].carrier,
            trackingNumber: order.shipments[0].trackingNumber,
            trackingUrl: order.shipments[0].trackingUrl,
            status: order.shipments[0].status,
            shippedAt: order.shipments[0].shippedAt?.toISOString(),
            deliveredAt: order.shipments[0].deliveredAt?.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({
      orders: transformedOrders,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
