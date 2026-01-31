/**
 * Announcement Bar Settings API
 *
 * GET /api/admin/site-settings/announcement - Get announcement bar configuration
 * PUT /api/admin/site-settings/announcement - Update announcement bar configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateSiteSettings,
  updateAnnouncementBarConfig,
} from '@/lib/cms/site-settings';
import { stackServerApp } from '@/lib/cms/stack';

export const dynamic = 'force-dynamic'

/**
 * GET - Fetch announcement bar configuration
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
      announcementBar: settings.announcementBar,
      showAnnouncementBar: settings.showAnnouncementBar,
    });
  } catch (error) {
    console.error('Error fetching announcement settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcement settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update announcement bar configuration
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate
    if (body.announcementBar && typeof body.announcementBar !== 'object') {
      return NextResponse.json(
        { error: 'Invalid announcement bar configuration' },
        { status: 400 }
      );
    }

    const showAnnouncementBar =
      typeof body.showAnnouncementBar === 'boolean'
        ? body.showAnnouncementBar
        : false;

    const settings = await updateAnnouncementBarConfig(
      body.announcementBar || {},
      showAnnouncementBar
    );

    return NextResponse.json({
      announcementBar: settings.announcementBar,
      showAnnouncementBar: settings.showAnnouncementBar,
    });
  } catch (error) {
    console.error('Error updating announcement settings:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement settings' },
      { status: 500 }
    );
  }
}
