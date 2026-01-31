/**
 * Review Stats API Route
 *
 * GET /api/reviews/stats - Get review dashboard statistics (admin)
 */

import { NextResponse } from 'next/server';
import { getReviewDashboardStats } from '@/lib/cms/reviews';

// GET - Get dashboard stats
export async function GET() {
  try {
    const stats = await getReviewDashboardStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get review stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get review statistics' },
      { status: 500 }
    );
  }
}
