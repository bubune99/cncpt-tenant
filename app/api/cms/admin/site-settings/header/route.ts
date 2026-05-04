/**
 * Header Settings API (tenant-scoped)
 *
 * GET /api/admin/site-settings/header - Get header configuration
 * PUT /api/admin/site-settings/header - Update header configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateSiteSettings,
  updateHeaderConfig,
} from '@/lib/cms/site-settings';
import { withTenantAuth } from '@/lib/cms/api/tenant';

export const dynamic = 'force-dynamic'

/**
 * GET - Fetch header configuration (admin-only — admin editor consumes this)
 */
export async function GET(request: NextRequest) {
  return withTenantAuth(request, 'view', async () => {
    try {
      const settings = await getOrCreateSiteSettings();
      return NextResponse.json({
        header: settings.header,
      });
    } catch (error) {
      console.error('Error fetching header settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch header settings' },
        { status: 500 }
      );
    }
  })
}

/**
 * PUT - Update header configuration (admin-only — site-wide setting)
 */
export async function PUT(request: NextRequest) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const body = await request.json();

      if (!body.header || typeof body.header !== 'object') {
        return NextResponse.json(
          { error: 'Invalid header configuration' },
          { status: 400 }
        );
      }

      const settings = await updateHeaderConfig(body.header);
      return NextResponse.json({
        header: settings.header,
      });
    } catch (error) {
      console.error('Error updating header settings:', error);
      return NextResponse.json(
        { error: 'Failed to update header settings' },
        { status: 500 }
      );
    }
  })
}
