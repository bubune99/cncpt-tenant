/**
 * Cart Recovery API Route
 *
 * GET /api/cart/recover/:token - Recover abandoned cart via email link
 *
 * The token is the cart ID (could be encrypted for security)
 * This endpoint restores the cart session and redirects to checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { markCartRecovered } from '@/lib/cms/cart';
import { prisma } from '@/lib/cms/db';
import { CartStatus } from '@prisma/client';

const CART_SESSION_COOKIE = 'cart_session_id';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET - Recover cart and redirect
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token: cartId } = await params;

    // Find the cart
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (!cart) {
      // Redirect to home with error
      return NextResponse.redirect(
        new URL('/?error=cart_not_found', request.url)
      );
    }

    // Check if cart is recoverable
    if (cart.status === CartStatus.CONVERTED) {
      return NextResponse.redirect(
        new URL('/?message=order_already_placed', request.url)
      );
    }

    if (cart.status === CartStatus.EXPIRED) {
      return NextResponse.redirect(
        new URL('/?error=cart_expired', request.url)
      );
    }

    if (cart.items.length === 0) {
      return NextResponse.redirect(
        new URL('/?error=cart_empty', request.url)
      );
    }

    // Mark cart as recovered
    await markCartRecovered(cartId);

    // Create response that redirects to cart/checkout
    const checkoutUrl = new URL('/checkout', request.url);
    checkoutUrl.searchParams.set('recovered', 'true');

    const response = NextResponse.redirect(checkoutUrl);

    // Set session cookie to this cart
    if (cart.sessionId) {
      response.cookies.set(CART_SESSION_COOKIE, cart.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Cart recovery error:', error);
    return NextResponse.redirect(
      new URL('/?error=recovery_failed', request.url)
    );
  }
}
