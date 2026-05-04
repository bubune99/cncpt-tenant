/**
 * Dashboard Configuration API
 *
 * Admin API for managing customer dashboard configuration.
 * GET  - Retrieve current configuration
 * PUT  - Update configuration
 * POST - Apply a preset
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardConfig,
  saveDashboardConfig,
  applyDashboardPreset,
  getAvailablePresets,
  type DashboardPreset,
} from '@/lib/cms/dashboard';
import { withTenantAuth } from '@/lib/cms/api/tenant';

export const dynamic = 'force-dynamic'

/**
 * GET - Retrieve dashboard configuration (admin-only)
 *
 * Tenant ownership/access is enforced by withTenantAuth — this replaces
 * the previous global users.role='ADMIN' check, which was both
 * cross-tenant and a non-canonical role source.
 */
export async function GET(request: NextRequest) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const config = await getDashboardConfig();
      const presets = getAvailablePresets();

      return NextResponse.json({
        config,
        presets,
      });
    } catch (error) {
      console.error('Error fetching dashboard config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard configuration' },
        { status: 500 }
      );
    }
  })
}

/**
 * PUT - Update dashboard configuration (admin-only)
 */
export async function PUT(request: NextRequest) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const body = await request.json();
      const config = await saveDashboardConfig(body);

      return NextResponse.json({ config });
    } catch (error) {
      console.error('Error updating dashboard config:', error);
      return NextResponse.json(
        { error: 'Failed to update dashboard configuration' },
        { status: 500 }
      );
    }
  })
}

/**
 * POST - Apply a preset (admin-only)
 */
export async function POST(request: NextRequest) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const { preset } = await request.json();

      if (!preset) {
        return NextResponse.json({ error: 'Preset is required' }, { status: 400 });
      }

      const config = await applyDashboardPreset(preset as DashboardPreset);

      return NextResponse.json({ config });
    } catch (error) {
      console.error('Error applying dashboard preset:', error);
      return NextResponse.json(
        { error: 'Failed to apply dashboard preset' },
        { status: 500 }
      );
    }
  })
}
