/**
 * Cart Email API Route
 *
 * POST /api/cart/email - Update cart email (for abandonment recovery)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateCart, updateCartEmail } from '../../../../lib/cart';
import { getCurrentUserId } from '../../../../lib/cart/auth';

const CART_SESSION_COOKIE = 'cart_session_id';

// POST - Update cart email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

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

    // Update email
    const updatedCart = await updateCartEmail(cart.id, email.trim().toLowerCase());

    return NextResponse.json({
      cart: updatedCart,
      message: 'Email updated',
    });
  } catch (error) {
    console.error('Update cart email error:', error);
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    );
  }
}
