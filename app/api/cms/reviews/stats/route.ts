/**
 * Review Stats API Route
 *
 * GET /api/reviews/stats - Get review dashboard statistics (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReviewDashboardStats } from '@/lib/cms/reviews';
import { withTenantAuth } from '@/lib/cms/api/tenant';

export const dynamic = 'force-dynamic'

// GET — admin-only review dashboard stats
export async function GET(request: NextRequest) {
  return withTenantAuth(request, 'view', async () => {
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
  })
}
