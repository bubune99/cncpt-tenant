/**
 * Reviews API Routes
 *
 * GET  /api/reviews - List reviews (admin, with filters)
 * POST /api/reviews - Submit a new review (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getReviews,
  submitReview,
  type ReviewFilters,
  type ReviewSort,
} from '@/lib/cms/reviews';
import type { ReviewStatus } from '@prisma/client';

export const dynamic = 'force-dynamic'

// GET - List reviews (admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build filters
    const filters: ReviewFilters = {};

    const productId = searchParams.get('productId');
    if (productId) filters.productId = productId;

    const status = searchParams.get('status') as ReviewStatus | null;
    if (status) filters.status = status;

    const rating = searchParams.get('rating');
    if (rating) filters.rating = parseInt(rating, 10);

    const minRating = searchParams.get('minRating');
    if (minRating) filters.minRating = parseInt(minRating, 10);

    const maxRating = searchParams.get('maxRating');
    if (maxRating) filters.maxRating = parseInt(maxRating, 10);

    const verified = searchParams.get('verified');
    if (verified !== null) filters.isVerifiedPurchase = verified === 'true';

    const search = searchParams.get('search');
    if (search) filters.search = search;

    // Build sort
    const sortField = searchParams.get('sortBy') as ReviewSort['field'] | null;
    const sortDir = searchParams.get('sortDir') as ReviewSort['direction'] | null;
    const sort: ReviewSort = {
      field: sortField || 'createdAt',
      direction: sortDir || 'desc',
    };

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const result = await getReviews(filters, sort, page, Math.min(pageSize, 100));

    return NextResponse.json(result);
  } catch (error) {
    console.error('List reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to list reviews' },
      { status: 500 }
    );
  }
}

// POST - Submit a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!body.reviewerName || !body.reviewerEmail) {
      return NextResponse.json(
        { error: 'Reviewer name and email are required' },
        { status: 400 }
      );
    }

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!body.content || body.content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review content must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const review = await submitReview({
      productId: body.productId,
      customerId: body.customerId,
      orderId: body.orderId,
      reviewerName: body.reviewerName.trim(),
      reviewerEmail: body.reviewerEmail.trim().toLowerCase(),
      rating: parseInt(body.rating, 10),
      title: body.title?.trim(),
      content: body.content.trim(),
      pros: body.pros?.trim(),
      cons: body.cons?.trim(),
      images: body.images,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        review,
        message: 'Review submitted successfully. It will be visible after moderation.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit review error:', error);

    if (error instanceof Error) {
      if (error.message.includes('already reviewed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
