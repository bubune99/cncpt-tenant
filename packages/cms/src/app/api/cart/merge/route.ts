/**
 * Cart Merge API Route
 *
 * POST /api/cart/merge - Merge guest cart into user cart on login
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { mergeCartsOnLogin } from '../../../../lib/cart';
import { getCurrentUserId } from '../../../../lib/cart/auth';

const CART_SESSION_COOKIE = 'cart_session_id';

// POST - Merge guest cart on login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { userId } = body;

    // If no userId provided, get from auth session
    if (!userId) {
      userId = await getCurrentUserId();
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required or must be logged in' },
        { status: 400 }
      );
    }

    // Get session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

    if (!sessionId) {
      // No guest cart to merge
      return NextResponse.json({
        cart: null,
        message: 'No guest cart to merge',
      });
    }

    // Merge carts
    const cart = await mergeCartsOnLogin(sessionId, userId);

    // Clear the guest session cookie since cart is now linked to user
    const response = NextResponse.json({
      cart,
      message: cart ? 'Carts merged successfully' : 'No carts to merge',
    });

    // Clear guest session cookie
    response.cookies.delete(CART_SESSION_COOKIE);

    return response;
  } catch (error) {
    console.error('Merge carts error:', error);
    return NextResponse.json(
      { error: 'Failed to merge carts' },
      { status: 500 }
    );
  }
}
