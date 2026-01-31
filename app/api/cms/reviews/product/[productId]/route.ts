/**
 * Product Reviews API Route
 *
 * GET /api/reviews/product/:productId - Get reviews and stats for a product (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getProductReviews,
  getProductReviewStats,
  canCustomerReviewProduct,
  type ReviewSort,
} from '../../../../../lib/reviews';

interface RouteParams {
  params: Promise<{ productId: string }>;
}

// GET - Get reviews for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    // Sort
    const sortField = searchParams.get('sortBy') as ReviewSort['field'] | null;
    const sortDir = searchParams.get('sortDir') as ReviewSort['direction'] | null;
    const sort: ReviewSort = {
      field: sortField || 'helpfulCount',
      direction: sortDir || 'desc',
    };

    // Optional: check if user can review
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    let eligibility = null;

    if (userId || email) {
      eligibility = await canCustomerReviewProduct(
        productId,
        userId || undefined,
        email || undefined
      );
    }

    // Fetch reviews and stats in parallel
    const [reviewsResult, stats] = await Promise.all([
      getProductReviews(productId, page, Math.min(pageSize, 50), sort),
      getProductReviewStats(productId),
    ]);

    return NextResponse.json({
      ...reviewsResult,
      stats,
      eligibility,
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to get product reviews' },
      { status: 500 }
    );
  }
}
