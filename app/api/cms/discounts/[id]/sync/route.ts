/**
 * Discount Stripe Sync API Route
 *
 * POST /api/discounts/:id/sync - Sync discount to Stripe
 * DELETE /api/discounts/:id/sync - Remove from Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import {
  syncDiscountToStripe,
  deleteStripeDiscount,
  toggleStripePromotionCode,
} from '@/lib/cms/discounts';

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Sync discount to Stripe
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check discount exists
    const discount = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    // Check if sync is enabled
    if (!discount.stripeSyncEnabled) {
      return NextResponse.json(
        { error: 'Stripe sync is disabled for this discount' },
        { status: 400 }
      );
    }

    // Sync to Stripe
    const result = await syncDiscountToStripe(id);

    // Get updated discount
    const updated = await prisma.discountCode.findUnique({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      couponId: result.couponId,
      promotionCodeId: result.promotionCodeId,
      syncedAt: updated?.stripeSyncedAt,
    });
  } catch (error) {
    console.error('Sync discount to Stripe error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync discount to Stripe',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove from Stripe
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check discount exists
    const discount = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    // Remove from Stripe
    await deleteStripeDiscount(id);

    return NextResponse.json({
      success: true,
      message: 'Discount removed from Stripe',
    });
  } catch (error) {
    console.error('Delete Stripe discount error:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove discount from Stripe',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH - Toggle Stripe promotion code active status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Active status must be a boolean' },
        { status: 400 }
      );
    }

    // Check discount exists
    const discount = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    if (!discount.stripePromotionCodeId) {
      return NextResponse.json(
        { error: 'Discount is not synced with Stripe' },
        { status: 400 }
      );
    }

    // Toggle in Stripe
    await toggleStripePromotionCode(id, active);

    return NextResponse.json({
      success: true,
      active,
    });
  } catch (error) {
    console.error('Toggle Stripe promotion code error:', error);
    return NextResponse.json(
      {
        error: 'Failed to toggle Stripe promotion code',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
