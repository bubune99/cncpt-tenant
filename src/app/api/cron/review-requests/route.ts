/**
 * Review Request Cron Job API Route
 *
 * POST /api/cron/review-requests - Send review request emails to eligible orders
 *
 * This should be called by a cron job (e.g., daily via Vercel Cron)
 * Example vercel.json config:
 * {
 *   "crons": [{
 *     "path": "/api/cron/review-requests",
 *     "schedule": "0 10 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrdersForReviewRequest,
  sendReviewRequestEmail,
} from '@/lib/reviews';

// POST - Send review request emails
export async function POST(request: NextRequest) {
  try {
    // Optional: verify cron secret for security
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get configuration from query params or use defaults
    const searchParams = request.nextUrl.searchParams;
    const daysAfterDelivery = parseInt(searchParams.get('days') || '7', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get eligible orders
    const orders = await getOrdersForReviewRequest(daysAfterDelivery, limit);

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders eligible for review requests',
        sent: 0,
        failed: 0,
      });
    }

    // Send emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ orderId: string; error: string }>,
    };

    for (const order of orders) {
      const result = await sendReviewRequestEmail(order.id);

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({
          orderId: order.id,
          error: result.error || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Review request emails processed`,
      eligible: orders.length,
      sent: results.sent,
      failed: results.failed,
      ...(results.errors.length > 0 && { errors: results.errors }),
    });
  } catch (error) {
    console.error('Review request cron error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process review requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET - Check status (useful for debugging)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysAfterDelivery = parseInt(searchParams.get('days') || '7', 10);

    const orders = await getOrdersForReviewRequest(daysAfterDelivery, 10);

    return NextResponse.json({
      status: 'ready',
      eligibleOrders: orders.length,
      nextOrders: orders.slice(0, 5).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        email: o.email,
        itemCount: o.items.length,
      })),
    });
  } catch (error) {
    console.error('Review request status error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
