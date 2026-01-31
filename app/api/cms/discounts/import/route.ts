/**
 * Stripe Import API Routes
 *
 * GET  /api/discounts/import - List unimported Stripe coupons
 * POST /api/discounts/import - Import a Stripe promotion code
 */

import { NextRequest, NextResponse } from 'next/server';
import { listUnimportedStripeCoupons, importFromStripe } from '../../../../lib/discounts';

// GET - List unimported Stripe coupons
export async function GET() {
  try {
    const coupons = await listUnimportedStripeCoupons();

    return NextResponse.json({
      coupons,
      total: coupons.length,
    });
  } catch (error) {
    console.error('List unimported coupons error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list Stripe coupons',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Import a Stripe promotion code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promotionCodeId } = body;

    if (!promotionCodeId) {
      return NextResponse.json(
        { error: 'Promotion code ID is required' },
        { status: 400 }
      );
    }

    const discountId = await importFromStripe(promotionCodeId);

    return NextResponse.json({
      success: true,
      discountId,
      message: 'Promotion code imported successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Import from Stripe error:', error);
    return NextResponse.json(
      {
        error: 'Failed to import from Stripe',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
