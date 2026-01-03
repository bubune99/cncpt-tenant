/**
 * Review Response API Route
 *
 * POST /api/reviews/:id/respond - Add store response to review
 */

import { NextRequest, NextResponse } from 'next/server';
import { respondToReview, getReviewById } from '@/lib/reviews';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Add store response to review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check review exists
    const existing = await getReviewById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Validate response content
    if (!body.responseContent || typeof body.responseContent !== 'string') {
      return NextResponse.json(
        { error: 'Response content is required' },
        { status: 400 }
      );
    }

    if (body.responseContent.trim().length < 10) {
      return NextResponse.json(
        { error: 'Response must be at least 10 characters' },
        { status: 400 }
      );
    }

    // respondedById should come from authenticated admin session
    if (!body.respondedById) {
      return NextResponse.json(
        { error: 'Responder ID is required' },
        { status: 400 }
      );
    }

    const review = await respondToReview(
      id,
      body.responseContent.trim(),
      body.respondedById
    );

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    return NextResponse.json(
      { error: 'Failed to respond to review' },
      { status: 500 }
    );
  }
}
