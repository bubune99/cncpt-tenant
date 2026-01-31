/**
 * Bulk Review Actions API Route
 *
 * POST /api/reviews/bulk - Perform bulk actions on reviews (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  bulkApproveReviews,
  bulkRejectReviews,
  bulkDeleteReviews,
} from '@/lib/cms/reviews';

// POST - Bulk actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    if (!body.action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    if (!body.reviewIds || !Array.isArray(body.reviewIds) || body.reviewIds.length === 0) {
      return NextResponse.json(
        { error: 'Review IDs array is required' },
        { status: 400 }
      );
    }

    // Limit bulk operations
    if (body.reviewIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 reviews per bulk operation' },
        { status: 400 }
      );
    }

    let result;

    switch (body.action) {
      case 'approve':
        result = await bulkApproveReviews(body.reviewIds);
        return NextResponse.json({
          success: true,
          action: 'approve',
          count: result.count,
          message: `${result.count} reviews approved`,
        });

      case 'reject':
        result = await bulkRejectReviews(body.reviewIds);
        return NextResponse.json({
          success: true,
          action: 'reject',
          count: result.count,
          message: `${result.count} reviews rejected`,
        });

      case 'delete':
        result = await bulkDeleteReviews(body.reviewIds);
        return NextResponse.json({
          success: true,
          action: 'delete',
          count: result.count,
          message: `${result.count} reviews deleted`,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve, reject, or delete' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Bulk review action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
