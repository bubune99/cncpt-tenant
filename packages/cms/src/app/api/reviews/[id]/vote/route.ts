/**
 * Review Vote API Route
 *
 * POST /api/reviews/:id/vote - Vote on a review (helpful/unhelpful)
 */

import { NextRequest, NextResponse } from 'next/server';
import { voteReview, getReviewById } from '@/lib/reviews';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Vote on a review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check review exists and is approved
    const review = await getReviewById(id);
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (review.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot vote on unapproved reviews' },
        { status: 400 }
      );
    }

    // Validate vote
    if (typeof body.helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'helpful must be a boolean' },
        { status: 400 }
      );
    }

    // Need either userId or email
    if (!body.userId && !body.email) {
      return NextResponse.json(
        { error: 'User ID or email is required to vote' },
        { status: 400 }
      );
    }

    const result = await voteReview(
      id,
      body.helpful,
      body.userId,
      body.email?.toLowerCase()
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Vote review error:', error);
    return NextResponse.json(
      { error: 'Failed to vote on review' },
      { status: 500 }
    );
  }
}
