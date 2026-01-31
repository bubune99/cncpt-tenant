/**
 * Single Review API Routes
 *
 * GET    /api/reviews/:id - Get review details
 * PATCH  /api/reviews/:id - Update review (moderation)
 * DELETE /api/reviews/:id - Delete review
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getReviewById,
  updateReview,
  deleteReview,
  approveReview,
  rejectReview,
  flagReview,
} from '@/lib/cms/reviews';
import type { ReviewStatus } from '@prisma/client';

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get review details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const review = await getReviewById(id);

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Get review error:', error);
    return NextResponse.json(
      { error: 'Failed to get review' },
      { status: 500 }
    );
  }
}

// PATCH - Update review (moderation)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Handle quick actions
    if (body.action) {
      switch (body.action) {
        case 'approve':
          const approved = await approveReview(id);
          return NextResponse.json(approved);
        case 'reject':
          const rejected = await rejectReview(id);
          return NextResponse.json(rejected);
        case 'flag':
          const flagged = await flagReview(id);
          return NextResponse.json(flagged);
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    }

    // Handle status update
    const updateData: {
      status?: ReviewStatus;
      responseContent?: string;
      respondedById?: string;
    } = {};

    if (body.status) {
      const validStatuses: ReviewStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.responseContent !== undefined) {
      updateData.responseContent = body.responseContent;
      updateData.respondedById = body.respondedById;
    }

    const review = await updateReview(id, updateData);

    return NextResponse.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE - Delete review
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check review exists
    const existing = await getReviewById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    await deleteReview(id);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
