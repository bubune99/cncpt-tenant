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
 * 2. Send recovery emails for recently abandoned carts (real send via tenant email provider)
 * 3. Clean up old expired carts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  markAbandonedCarts,
  getAbandonedCartsForRecovery,
  markRecoveryEmailSent,
  cleanupExpiredCarts,
  getCartStats,
  type CartWithItems,
} from '@/lib/cms/cart';
import { sendEmail } from '@/lib/cms/email';
import { getEmailSettings, getGeneralSettings } from '@/lib/cms/settings';
import {
  renderCartAbandonmentEmail,
  getCartAbandonmentSubject,
  type CartAbandonmentData,
  type CartItem,
} from '@/lib/cms/email/templates/cart-abandonment';

export const dynamic = 'force-dynamic'

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Build the CartAbandonmentData payload from a recovered cart row.
 * Only items that have a defined title are included.
 */
function buildAbandonmentData(
  cart: CartWithItems & { email: string },
  storeUrl: string,
): CartAbandonmentData {
  const cartItems: CartItem[] = cart.items
    .filter((item) => item.title != null)
    .map((item) => ({
      id: item.id,
      name: item.title,
      variant: item.variantTitle ?? undefined,
      quantity: item.quantity,
      price: item.price,
      imageUrl: item.imageUrl ?? undefined,
      url: `${storeUrl}/shop/${item.productId}`,
    }));

  const recoveryUrl = `${storeUrl}/cart?recover=${cart.id}`;

  const discountCode = cart.discountCode;

  return {
    customer: {
      name: cart.email,
      email: cart.email,
    },
    cart: {
      id: cart.id,
      items: cartItems,
      subtotal: cart.subtotal,
      recoveryUrl,
    },
    discountCode: discountCode?.code,
    discountPercent:
      discountCode?.type === 'PERCENTAGE' && typeof discountCode.value === 'number'
        ? discountCode.value
        : undefined,
    discountAmount:
      discountCode?.type === 'FIXED_AMOUNT' && typeof discountCode.value === 'number'
        ? discountCode.value
        : undefined,
    emailNumber: 1,
    expiresIn: '48 hours',
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (fail closed — deny if not configured)
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
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
      const [cartsForRecovery, emailSettings, generalSettings] = await Promise.all([
        getAbandonedCartsForRecovery(60, 72),
        getEmailSettings(),
        getGeneralSettings(),
      ]);

      const storeUrl = generalSettings.siteUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const storeName = generalSettings.siteName || emailSettings.fromName || 'Our Store';
      const supportEmail = generalSettings.supportEmail || emailSettings.fromEmail || 'support@example.com';

      const storeConfig = {
        name: storeName,
        url: storeUrl,
        supportEmail,
      };

      for (const cart of cartsForRecovery) {
        try {
          const abandonmentData = buildAbandonmentData(cart, storeUrl);

          // Skip carts with no line items — nothing meaningful to recover
          if (abandonmentData.cart.items.length === 0) {
            continue;
          }

          const html = renderCartAbandonmentEmail(abandonmentData, storeConfig);
          const subject = getCartAbandonmentSubject(abandonmentData, storeConfig);

          const sendResult = await sendEmail({
            to: { email: cart.email, name: abandonmentData.customer.name },
            subject,
            html,
            tags: ['cart-abandonment'],
            metadata: { cartId: cart.id },
          });

          if (!sendResult.success) {
            // Do NOT mark sent if the send failed — allows retry on next cron run
            results.errors.push(
              `Recovery email send failed for cart ${cart.id}: ${sendResult.error ?? 'provider error'}`
            );
            continue;
          }

          // Only mark as sent after confirmed delivery to provider
          await markRecoveryEmailSent(cart.id);
          results.recoveryEmailsSent++;
        } catch (emailError) {
          results.errors.push(
            `Recovery email failed for cart ${cart.id}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
          );
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
export async function GET(_request: NextRequest) {
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
