/**
 * Cart API Routes
 *
 * GET  /api/cart - Get current cart
 * POST /api/cart - Create new cart (for explicit creation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateCart, getCartStats } from '@/lib/cms/cart';
import { getCurrentUserId } from '@/lib/cms/cart/auth';

export const dynamic = 'force-dynamic'

const CART_SESSION_COOKIE = 'cart_session_id';

// Generate a session ID for guest carts
function generateSessionId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// GET - Get current cart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    // Get session ID from cookie
    const cookieStore = await cookies();
    let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

    // Get userId from Stack Auth session if logged in
    const userId = await getCurrentUserId();

    // If no session ID and not logged in, return empty cart structure
    if (!sessionId && !userId) {
      if (includeStats) {
        const stats = await getCartStats();
        return NextResponse.json({ cart: null, stats });
      }
      return NextResponse.json({ cart: null });
    }

    // Get or create cart
    const cart = await getOrCreateCart({ sessionId, userId });

    // Ensure cookie is set
    if (!sessionId && cart.sessionId) {
      const response = NextResponse.json({ cart });
      response.cookies.set(CART_SESSION_COOKIE, cart.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      return response;
    }

    if (includeStats) {
      const stats = await getCartStats();
      return NextResponse.json({ cart, stats });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart' },
      { status: 500 }
    );
  }
}

// POST - Create new cart (explicit creation with session)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    // Generate new session ID
    const sessionId = generateSessionId();

    // Get userId from Stack Auth session if logged in
    const userId = await getCurrentUserId();

    // Create cart
    const cart = await getOrCreateCart({ sessionId, userId });

    // Update email if provided
    if (email && cart.id) {
      const { prisma } = await import('@/lib/cms/db');
      await prisma.cart.update({
        where: { id: cart.id },
        data: { email },
      });
    }

    // Set session cookie
    const response = NextResponse.json({ cart }, { status: 201 });
    response.cookies.set(CART_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Create cart error:', error);
    return NextResponse.json(
      { error: 'Failed to create cart' },
      { status: 500 }
    );
  }
}
