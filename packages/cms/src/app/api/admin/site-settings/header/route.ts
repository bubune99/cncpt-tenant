/**
 * Header Settings API
 *
 * GET /api/admin/site-settings/header - Get header configuration
 * PUT /api/admin/site-settings/header - Update header configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateSiteSettings,
  updateHeaderConfig,
} from '@/lib/site-settings';
import { stackServerApp } from '@/lib/stack';

/**
 * GET - Fetch header configuration
 */
export async function GET() {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
}

/**
 * PUT - Update header configuration
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
}
