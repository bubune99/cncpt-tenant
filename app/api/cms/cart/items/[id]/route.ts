/**
 * Cart Item API Routes
 *
 * PATCH  /api/cart/items/:id - Update item quantity
 * DELETE /api/cart/items/:id - Remove item from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateCart, updateCartItem, removeFromCart } from '@/lib/cms/cart';
import { getCurrentUserId } from '@/lib/cms/cart/auth';

export const dynamic = 'force-dynamic'

const CART_SESSION_COOKIE = 'cart_session_id';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update item quantity
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: itemId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== 'number') {
      return NextResponse.json(
        { error: 'Quantity is required' },
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

    // Verify item belongs to this cart
    const itemExists = cart.items.some((item) => item.id === itemId);
    if (!itemExists) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    // Update item quantity
    const updatedCart = await updateCartItem(cart.id, itemId, quantity);

    return NextResponse.json({
      cart: updatedCart,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated',
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: itemId } = await params;

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

    // Verify item belongs to this cart
    const itemExists = cart.items.some((item) => item.id === itemId);
    if (!itemExists) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    // Remove item
    const updatedCart = await removeFromCart(cart.id, itemId);

    return NextResponse.json({
      cart: updatedCart,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}
