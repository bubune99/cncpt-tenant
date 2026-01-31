/**
 * Cart Items API Routes
 *
 * POST /api/cart/items - Add item to cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateCart, addToCart } from '@/lib/cms/cart';
import { getCurrentUserId } from '@/lib/cms/cart/auth';

export const dynamic = 'force-dynamic'

const CART_SESSION_COOKIE = 'cart_session_id';

function generateSessionId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    // Get or create session
    const cookieStore = await cookies();
    let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
    const isNewSession = !sessionId;

    if (!sessionId) {
      sessionId = generateSessionId();
    }

    // Get userId from Stack Auth session if logged in
    const userId = await getCurrentUserId();

    // Get or create cart
    const cart = await getOrCreateCart({ sessionId, userId });

    // Add item to cart
    const updatedCart = await addToCart(cart.id, {
      productId,
      variantId: variantId || null,
      quantity,
    });

    // Set session cookie if new
    const response = NextResponse.json({
      cart: updatedCart,
      message: 'Item added to cart',
    });

    if (isNewSession) {
      response.cookies.set(CART_SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Add to cart error:', error);

    if (error instanceof Error && error.message === 'Product not found') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}
