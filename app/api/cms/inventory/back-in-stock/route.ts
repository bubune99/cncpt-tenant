/**
 * Back-in-Stock Subscription API
 *
 * POST /api/inventory/back-in-stock - Subscribe to notifications
 * DELETE /api/inventory/back-in-stock - Unsubscribe from notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { subscribeToBackInStock, unsubscribeFromBackInStock } from '@/lib/cms/inventory';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, productId, variantId } = body;

    if (!email || !productId) {
      return NextResponse.json(
        { error: 'Email and productId are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const result = await subscribeToBackInStock(email, productId, variantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to subscribe' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'You will be notified when this product is back in stock',
    });
  } catch (error) {
    console.error('Back-in-stock subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');

    if (!email || !productId) {
      return NextResponse.json(
        { error: 'Email and productId are required' },
        { status: 400 }
      );
    }

    await unsubscribeFromBackInStock(email, productId, variantId || undefined);

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed from notifications',
    });
  } catch (error) {
    console.error('Back-in-stock unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
