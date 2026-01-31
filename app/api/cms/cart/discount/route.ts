/**
 * Cart Discount API Routes
 *
 * POST   /api/cart/discount - Apply discount code
 * DELETE /api/cart/discount - Remove discount code
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateCart, applyDiscount, removeDiscount } from '../../../../lib/cart';
import { getCurrentUserId } from '../../../../lib/cart/auth';

const CART_SESSION_COOKIE = 'cart_session_id';

// POST - Apply discount code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Discount code is required' },
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

    // Apply discount
    const result = await applyDiscount(cart.id, code.trim());

    if (result.error) {
      return NextResponse.json(
        { error: result.error, cart: result.cart },
        { status: 400 }
      );
    }

    return NextResponse.json({
      cart: result.cart,
      message: 'Discount applied successfully',
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    return NextResponse.json(
      { error: 'Failed to apply discount' },
      { status: 500 }
    );
  }
}

// DELETE - Remove discount code
export async function DELETE(request: NextRequest) {
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

    // Remove discount
    const updatedCart = await removeDiscount(cart.id);

    return NextResponse.json({
      cart: updatedCart,
      message: 'Discount removed',
    });
  } catch (error) {
    console.error('Remove discount error:', error);
    return NextResponse.json(
      { error: 'Failed to remove discount' },
      { status: 500 }
    );
  }
}
