/**
 * Navigation API
 *
 * GET /api/navigation/[areaId]
 * Returns navigation for an authenticated area, including Puck pages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAreaNavigation, getAreaConfig } from '@/lib/authenticated-routes';
import { getAuthContext } from '@/lib/permissions/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ areaId: string }> }
) {
  try {
    const { areaId } = await params;

    // Validate area exists
    const area = getAreaConfig(areaId);
    if (!area) {
      return NextResponse.json(
        { error: 'Area not found' },
        { status: 404 }
      );
    }

    // Get auth context for permission filtering
    const authContext = await getAuthContext();

    // Build user context for permission filtering
    const userContext = authContext
      ? {
          userId: authContext.user.id,
          permissions: authContext.permissions.permissions,
          roles: authContext.permissions.roles.map(r => r.name),
        }
      : undefined;

    // Get navigation with Puck pages
    const { groups, puckPages } = await getAreaNavigation(areaId, userContext);

    return NextResponse.json({
      areaId,
      areaName: area.name,
      basePath: area.basePath,
      groups,
      puckPages,
      layout: area.layout,
    });
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch navigation' },
      { status: 500 }
    );
  }
}
