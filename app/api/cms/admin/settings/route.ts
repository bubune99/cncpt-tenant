/**
 * Admin Settings API (tenant-scoped)
 *
 * Get and update platform settings with encrypted storage
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllSettings,
  updateSettings,
  type SettingGroup,
} from '@/lib/cms/settings'
import { withPermission } from '@/lib/cms/permissions/middleware'

export const dynamic = 'force-dynamic'

export const GET = withPermission('settings.view', async (_request, _context) => {
  try {
    const settings = await getAllSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
})

export const PATCH = withPermission('settings.edit', async (request, _context) => {
    try {
      const body = await request.json()
      const { group, settings } = body as { group: SettingGroup; settings: Record<string, unknown> }

      if (!group || !settings) {
        return NextResponse.json(
          { success: false, error: 'Group and settings are required' },
          { status: 400 }
        )
      }

      const validGroups: SettingGroup[] = ['branding', 'general', 'email', 'storage', 'ai', 'security', 'dashboard']
      if (!validGroups.includes(group)) {
        return NextResponse.json(
          { success: false, error: 'Invalid settings group' },
          { status: 400 }
        )
      }

      await updateSettings(group, settings)

      // Return updated settings (with masked sensitive values)
      const allSettings = await getAllSettings()

      return NextResponse.json({
        success: true,
        settings: allSettings,
      })
    } catch (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      )
    }
})
