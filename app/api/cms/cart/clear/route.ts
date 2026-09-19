/**
 * Cart Clear API Route
 *
 * POST /api/cart/clear - Clear all items from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateCart, clearCart } from '@/lib/cms/cart';
import { getCurrentUserId } from '@/lib/cms/cart/auth';
import { withTenant } from '@/lib/cms/api/tenant';
import { rateLimitCheck, RATE_LIMIT_PRESETS } from '@/lib/cms/rate-limit';

export const dynamic = 'force-dynamic'

const CART_SESSION_COOKIE = 'cart_session_id';

// POST - Clear cart
export async function POST(request: NextRequest) {
  const limited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.cart, { name: 'cart' });
  if (limited) return limited;
  return withTenant(request, async () => {
    try {
    // Get session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Get userId from Stack Auth session if logged in
    const userId = await getCurrentUserId();

    // Get cart
    const cart = await getOrCreateCart({ sessionId, userId });

    // Clear cart
    const updatedCart = await clearCart(cart.id);

    return NextResponse.json({
      cart: updatedCart,
      message: 'Cart cleared',
    });
    } catch (error) {
      console.error('Clear cart error:', error);
      return NextResponse.json(
        { error: 'Failed to clear cart' },
        { status: 500 }
      );
    }
  })
}
