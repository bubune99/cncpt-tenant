/**
 * Dashboard Configuration API
 *
 * Admin API for managing customer dashboard configuration.
 * GET - Retrieve current configuration
 * PUT - Update configuration
 * POST - Apply a preset
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '../../../../lib/stack';
import { prisma } from '../../../../lib/db';
import {
  getDashboardConfig,
  saveDashboardConfig,
  applyDashboardPreset,
  getAvailablePresets,
  type DashboardPreset,
} from '../../../../lib/dashboard';

// Check if user is admin
async function isAdmin(): Promise<boolean> {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return false;

    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      select: { role: true },
    });

    return user?.role === 'ADMIN';
  } catch {
    return false;
  }
}

/**
 * GET - Retrieve dashboard configuration
 */
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
}

/**
 * PUT - Update dashboard configuration
 */
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
}

/**
 * POST - Apply a preset
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
}
