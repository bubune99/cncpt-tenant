/**
 * Cart Abandonment Cron Job
 *
 * POST /api/cron/cart-abandonment - Run abandonment detection and cleanup
 *
 * This endpoint should be called periodically (e.g., every 15 minutes) by:
 * - Vercel Cron (vercel.json)
 * - External scheduler (e.g., cron-job.org)
 * - Internal job system
 *
 * Actions:
 * 1. Mark inactive carts as abandoned
 * 2. Send recovery emails for recently abandoned carts
 * 3. Clean up old expired carts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  markAbandonedCarts,
  getAbandonedCartsForRecovery,
  markRecoveryEmailSent,
  cleanupExpiredCarts,
  getCartStats,
} from '@/lib/cms/cart';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      markedAbandoned: 0,
      recoveryEmailsSent: 0,
      cartsCleanedUp: 0,
      errors: [] as string[],
    };

    // 1. Mark carts as abandoned after 1 hour of inactivity
    try {
      results.markedAbandoned = await markAbandonedCarts(60); // 60 minutes
    } catch (error) {
      results.errors.push(`Mark abandoned failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 2. Get abandoned carts for recovery emails (1-72 hours old, no email sent yet)
    try {
      const cartsForRecovery = await getAbandonedCartsForRecovery(60, 72);

      for (const cart of cartsForRecovery) {
        try {
          // TODO: Send recovery email via email service (HP-001)
          // await sendAbandonmentRecoveryEmail(cart);

          // For now, just log and mark as sent
          console.log(`Would send recovery email to ${cart.email} for cart ${cart.id}`);

          // Mark recovery email as sent
          await markRecoveryEmailSent(cart.id);
          results.recoveryEmailsSent++;
        } catch (emailError) {
          results.errors.push(`Recovery email failed for cart ${cart.id}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Get recovery carts failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 3. Clean up expired/old abandoned carts (> 30 days)
    try {
      results.cartsCleanedUp = await cleanupExpiredCarts(30);
    } catch (error) {
      results.errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Get stats for reporting
    const stats = await getCartStats();

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cart abandonment cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cart abandonment job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing/monitoring
export async function GET(request: NextRequest) {
  // Just return stats without running the job
  try {
    const stats = await getCartStats();
    return NextResponse.json({
      message: 'Use POST to run the abandonment job',
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get cart stats' },
      { status: 500 }
    );
  }
}
