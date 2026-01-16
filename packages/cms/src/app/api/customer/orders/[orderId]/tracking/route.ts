/**
 * Customer Order Tracking API
 *
 * GET /api/customer/orders/[orderId]/tracking - Get tracking info for an order
 *
 * Returns real-time tracking status from Shippo for authenticated customers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '../../../../../../lib/stack';
import { prisma } from '../../../../../../lib/db';
import { getTracking, type CarrierType } from '../../../../../../lib/shippo';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

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
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fetch the order with shipments - verify ownership
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: user.customer.id,
      },
      include: {
        shipments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get the latest shipment with tracking info
    const shipment = order.shipments.find(s => s.trackingNumber && s.carrier);

    if (!shipment || !shipment.trackingNumber || !shipment.carrier) {
      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        hasTracking: false,
        message: 'No tracking information available for this order yet',
      });
    }

    try {
      // Get real-time tracking from Shippo
      const tracking = await getTracking(
        shipment.carrier.toLowerCase() as CarrierType,
        shipment.trackingNumber
      );

      // Update shipment status in database if it's changed
      const newStatus = mapTrackingStatusToShipmentStatus(tracking.trackingStatus.status);
      if (newStatus !== shipment.status) {
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            status: newStatus,
            ...(newStatus === 'DELIVERED' && !shipment.deliveredAt
              ? { deliveredAt: new Date() }
              : {}),
          },
        });
      }

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        hasTracking: true,
        shipment: {
          id: shipment.id,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          trackingUrl: shipment.trackingUrl,
          labelUrl: shipment.labelUrl,
          status: shipment.status,
          shippedAt: shipment.shippedAt?.toISOString(),
          deliveredAt: shipment.deliveredAt?.toISOString(),
        },
        tracking: {
          carrier: tracking.carrier,
          trackingNumber: tracking.trackingNumber,
          eta: tracking.eta,
          servicelevel: tracking.servicelevel,
          currentStatus: {
            status: tracking.trackingStatus.status,
            statusDetails: tracking.trackingStatus.statusDetails,
            statusDate: tracking.trackingStatus.statusDate,
            location: tracking.trackingStatus.location,
          },
          history: tracking.trackingHistory.map(event => ({
            status: event.status,
            statusDetails: event.statusDetails,
            statusDate: event.statusDate,
            location: event.location,
          })),
          addressFrom: tracking.addressFrom,
          addressTo: tracking.addressTo,
        },
      });
    } catch (trackingError) {
      // Tracking fetch failed - return shipment info without live tracking
      console.error('Failed to fetch tracking from Shippo:', trackingError);

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        hasTracking: true,
        shipment: {
          id: shipment.id,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          trackingUrl: shipment.trackingUrl,
          status: shipment.status,
          shippedAt: shipment.shippedAt?.toISOString(),
          deliveredAt: shipment.deliveredAt?.toISOString(),
        },
        tracking: null,
        trackingError: 'Unable to fetch real-time tracking. Please check the carrier website directly.',
      });
    }
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking information' },
      { status: 500 }
    );
  }
}

// Map Shippo tracking status to our ShipmentStatus enum
function mapTrackingStatusToShipmentStatus(status: string): 'PENDING' | 'LABEL_CREATED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'FAILED' {
  const statusMap: Record<string, 'PENDING' | 'LABEL_CREATED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'FAILED'> = {
    'UNKNOWN': 'PENDING',
    'PRE_TRANSIT': 'LABEL_CREATED',
    'TRANSIT': 'IN_TRANSIT',
    'DELIVERED': 'DELIVERED',
    'RETURNED': 'RETURNED',
    'FAILURE': 'FAILED',
  };
  return statusMap[status] || 'IN_TRANSIT';
}
