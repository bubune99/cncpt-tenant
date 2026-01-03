/**
 * Site Settings API
 *
 * GET /api/admin/site-settings - Get current site settings
 * PUT /api/admin/site-settings - Update site settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateSiteSettings, updateSiteSettings } from '@/lib/site-settings';
import { stackServerApp } from '@/lib/stack';

/**
 * GET - Fetch site settings
 */
export async function GET() {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getOrCreateSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update site settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const allowedFields = [
      'header',
      'footer',
      'announcementBar',
      'showAnnouncementBar',
      'siteName',
      'siteTagline',
      'logoUrl',
      'logoAlt',
      'faviconUrl',
      'socialLinks',
      'defaultMetaTitle',
      'defaultMetaDescription',
      'defaultOgImage',
      'contactEmail',
      'contactPhone',
      'businessAddress',
      'googleAnalyticsId',
      'facebookPixelId',
    ];

    // Filter to only allowed fields
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const settings = await updateSiteSettings(updateData);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: 'Failed to update site settings' },
      { status: 500 }
    );
  }
}
