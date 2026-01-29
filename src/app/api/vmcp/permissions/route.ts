/**
 * VMCP Permissions API
 *
 * Handles VMCP mode management (ask vs autonomous).
 * Note: Tool approval is handled natively by AI SDK v6's needsApproval.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getVmcpSettings,
  updateVmcpSettings,
  enableAutonomousMode,
  disableAutonomousMode,
  isAutonomousMode,
} from '../../../../lib/vmcp';

/**
 * GET /api/vmcp/permissions
 *
 * Get current VMCP settings and mode
 */
export async function GET() {
  try {
    const settings = await getVmcpSettings();
    const autonomous = await isAutonomousMode();

    return NextResponse.json({
      success: true,
      settings,
      autonomous,
    });
  } catch (error) {
    console.error('[VMCP API] Failed to get settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get VMCP settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vmcp/permissions
 *
 * Handle mode actions:
 * - enable_autonomous: Enable autonomous mode (no approval needed)
 * - disable_autonomous: Disable autonomous mode (require approvals)
 * - update_settings: Update VMCP settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, settings } = body;

    switch (action) {
      case 'enable_autonomous': {
        await enableAutonomousMode();
        return NextResponse.json({
          success: true,
          message: 'Autonomous mode enabled',
          autonomous: true,
        });
      }

      case 'disable_autonomous': {
        await disableAutonomousMode();
        return NextResponse.json({
          success: true,
          message: 'Permission mode enabled',
          autonomous: false,
        });
      }

      case 'update_settings': {
        if (!settings) {
          return NextResponse.json(
            { success: false, error: 'Missing settings' },
            { status: 400 }
          );
        }

        const updatedSettings = await updateVmcpSettings(settings);
        return NextResponse.json({
          success: true,
          message: 'Settings updated',
          settings: updatedSettings,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[VMCP API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
