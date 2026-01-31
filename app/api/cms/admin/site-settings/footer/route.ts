/**
 * Footer Settings API
 *
 * GET /api/admin/site-settings/footer - Get footer configuration
 * PUT /api/admin/site-settings/footer - Update footer configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateSiteSettings,
  updateFooterConfig,
} from '@/lib/cms/site-settings';
import { stackServerApp } from '@/lib/cms/stack';

/**
 * GET - Fetch footer configuration
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
      footer: settings.footer,
    });
  } catch (error) {
    console.error('Error fetching footer settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch footer settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update footer configuration
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.footer || typeof body.footer !== 'object') {
      return NextResponse.json(
        { error: 'Invalid footer configuration' },
        { status: 400 }
      );
    }

    const settings = await updateFooterConfig(body.footer);
    return NextResponse.json({
      footer: settings.footer,
    });
  } catch (error) {
    console.error('Error updating footer settings:', error);
    return NextResponse.json(
      { error: 'Failed to update footer settings' },
      { status: 500 }
    );
  }
}
