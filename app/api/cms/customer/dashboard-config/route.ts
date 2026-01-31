/**
 * Customer Dashboard Configuration API
 *
 * Returns the dashboard configuration for authenticated customers.
 * Used by the frontend to dynamically render the appropriate dashboard layout.
 */

import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/cms/stack';
import { getDashboardConfig } from '@/lib/cms/dashboard';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check authentication (optional - allow anonymous for caching)
    const stackUser = await stackServerApp.getUser();

    // Get the dashboard configuration
    const config = await getDashboardConfig();

    // Filter to only enabled tabs and widgets
    const enabledTabs = config.tabs
      .filter((tab) => tab.enabled)
      .sort((a, b) => a.order - b.order)
      .map((tab) => ({
        ...tab,
        widgets: tab.widgets
          .filter((widget) => widget.enabled)
          .sort((a, b) => a.order - b.order),
      }));

    return NextResponse.json({
      preset: config.preset,
      title: config.title,
      showOverview: config.showOverview,
      tabs: enabledTabs,
      theme: config.theme,
      isAuthenticated: !!stackUser,
    });
  } catch (error) {
    console.error('Error fetching customer dashboard config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard configuration' },
      { status: 500 }
    );
  }
}
