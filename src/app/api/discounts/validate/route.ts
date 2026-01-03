/**
 * Discount Validation API Route
 *
 * POST /api/discounts/validate - Validate a discount code against cart
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateDiscountCode,
  isFirstOrderForUser,
  calculateDiscount,
  getDiscountSummary,
} from '@/lib/discounts';

interface ValidateRequest {
  code: string;
  subtotal: number; // In cents
  shippingTotal?: number; // In cents
  userId?: string;
  email?: string;
  items?: Array<{
    productId: string;
    categoryIds: string[];
    quantity: number;
    price: number; // In cents
    isOnSale?: boolean;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequest = await request.json();

    if (!body.code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    if (body.subtotal === undefined || body.subtotal < 0) {
      return NextResponse.json(
        { error: 'Valid subtotal is required' },
        { status: 400 }
      );
    }

    // Check if first order for user
    const isFirstOrder = await isFirstOrderForUser(body.userId, body.email);

    // Validate the discount code
    const validation = await validateDiscountCode({
      code: body.code,
      subtotal: body.subtotal,
      userId: body.userId,
      email: body.email,
      isFirstOrder,
      items: body.items,
    });

    if (!validation.valid || !validation.discount) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.error,
          errorCode: validation.errorCode,
        },
        { status: 400 }
      );
    }

    // Calculate the discount amount
    const calculation = calculateDiscount(
      validation.discount,
      body.items || [],
      {
        subtotal: body.subtotal,
        shippingTotal: body.shippingTotal || 0,
      }
    );

    // Get summary for display
    const summary = getDiscountSummary(validation.discount);

    return NextResponse.json({
      valid: true,
      discount: {
        id: validation.discount.id,
        code: validation.discount.code,
        type: validation.discount.type,
        value: validation.discount.value,
        description: validation.discount.description,
      },
      calculation: {
        discountAmount: calculation.discountAmount,
        discountedSubtotal: calculation.discountedSubtotal,
        discountedShipping: calculation.discountedShipping,
        appliedTo: calculation.appliedTo,
        description: calculation.description,
      },
      summary,
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}
