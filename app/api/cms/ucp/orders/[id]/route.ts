/**
 * UCP Order — Get order by ID
 *
 * GET /api/ucp/orders/:id — Retrieve order in UCP format
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import {
  ucpEnvelope,
  type UcpOrder,
  type UcpOrderLineItem,
  type UcpTotal,
  type UcpFulfillment,
  type UcpOrderLineItemStatus,
} from '@/lib/cms/ucp/types';

export const dynamic = 'force-dynamic';

const ORDER_STATUS_MAP: Record<string, UcpOrderLineItemStatus> = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'canceled',
  REFUNDED: 'refunded',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { include: { media: true }, take: 1 },
              },
            },
          },
        },
        shipments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const ucpStatus = ORDER_STATUS_MAP[order.status] ?? 'pending';

    // Map order items to UCP line items
    const lineItems: UcpOrderLineItem[] = order.items.map((item) => {
      const imageUrl = item.product?.images?.[0]?.media?.url;
      return {
        id: item.id,
        item: {
          id: item.productId,
          title: item.title,
          price: item.price,
          image_url: imageUrl || undefined,
        },
        quantity: {
          total: item.quantity,
          fulfilled: ucpStatus === 'delivered' ? item.quantity : 0,
        },
        status: ucpStatus,
        totals: [{ type: 'subtotal' as const, amount: item.total }],
      };
    });

    // Build totals
    const totals: UcpTotal[] = [
      { type: 'subtotal', amount: order.subtotal },
      { type: 'fulfillment', amount: order.shippingTotal },
      { type: 'tax', amount: order.taxTotal },
      { type: 'discount', amount: order.discountTotal },
      { type: 'total', amount: order.total },
    ];

    // Build fulfillment from shipments
    let fulfillment: UcpFulfillment | undefined;
    if (order.shipments.length > 0) {
      fulfillment = {
        events: order.shipments.flatMap((shipment) => {
          const events: UcpFulfillment['events'] = [];
          if (shipment.shippedAt) {
            events!.push({
              type: 'shipped',
              occurred_at: shipment.shippedAt.toISOString(),
              tracking_number: shipment.trackingNumber || undefined,
              carrier: shipment.carrier || undefined,
              tracking_url: shipment.trackingUrl || undefined,
            });
          }
          if (shipment.deliveredAt) {
            events!.push({
              type: 'delivered',
              occurred_at: shipment.deliveredAt.toISOString(),
              tracking_number: shipment.trackingNumber || undefined,
              carrier: shipment.carrier || undefined,
              tracking_url: shipment.trackingUrl || undefined,
            });
          }
          return events!;
        }),
      };
    }

    const ucpOrder: UcpOrder = {
      id: order.id,
      checkout_id: order.stripeSessionId || undefined,
      line_items: lineItems,
      totals,
      fulfillment,
      ucp: ucpEnvelope([
        { name: 'dev.ucp.shopping.order', version: '2026-01-11' },
      ]),
    };

    return NextResponse.json(ucpOrder, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('[UCP Orders] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to get order' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, UCP-Agent',
    },
  });
}
