/**
 * Inventory Cron Job
 *
 * POST /api/cron/inventory - Run inventory maintenance tasks
 *
 * Tasks:
 * - Send low stock alerts to admin
 * - Cleanup expired stock reservations
 *
 * Recommended schedule: Every 15-30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getLowStockItems,
  sendLowStockAlert,
  cleanupExpiredReservations,
} from '@/lib/inventory';

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Allow if not configured

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  try {
    // Task 1: Low stock alerts
    const lowStockItems = await getLowStockItems();
    results.lowStockCount = lowStockItems.length;

    if (lowStockItems.length > 0) {
      const alertResult = await sendLowStockAlert(lowStockItems);
      results.lowStockAlertSent = alertResult.success;
      if (alertResult.error) {
        results.lowStockAlertError = alertResult.error;
      }
    }

    // Task 2: Cleanup expired reservations
    const releasedReservations = await cleanupExpiredReservations();
    results.releasedReservations = releasedReservations;

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Inventory cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cron job failed',
        results,
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggers / health checks
export async function GET(request: NextRequest) {
  return POST(request);
}
