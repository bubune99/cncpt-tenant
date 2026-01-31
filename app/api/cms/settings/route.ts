/**
 * Settings API
 *
 * GET /api/settings - Get all settings (with sensitive data masked)
 * PUT /api/settings - Update settings by group
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllSettings,
  updateSettings,
  clearSettingsCache,
  getEnvVarStatus,
} from '@/lib/cms/settings'
import type { SettingGroup } from '@/lib/cms/settings/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const group = searchParams.get('group')

    if (group === 'env') {
      // Return environment variable status
      const envVars = getEnvVarStatus()
      return NextResponse.json({ envVars })
    }

    const settings = await getAllSettings()

    if (group && group in settings) {
      return NextResponse.json({ [group]: (settings as any)[group] })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { group, settings } = body

    if (!group) {
      return NextResponse.json(
        { error: 'Settings group is required' },
        { status: 400 }
      )
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    // Validate group
    const validGroups: SettingGroup[] = [
      'general', 'branding', 'store', 'payments', 'shipping', 'analytics',
      'seo', 'email', 'storage', 'ai', 'security'
    ]

    if (!validGroups.includes(group)) {
      return NextResponse.json(
        { error: `Invalid settings group. Valid groups: ${validGroups.join(', ')}` },
        { status: 400 }
      )
    }

    // Filter out masked values (don't update if value is ********)
    const filteredSettings: Record<string, any> = {}
    for (const [key, value] of Object.entries(settings)) {
      if (value !== '********') {
        filteredSettings[key] = value
      }
    }

    // Update settings (sensitive keys are handled automatically)
    await updateSettings(group as SettingGroup, filteredSettings)

    // Clear all caches since settings may affect multiple systems
    clearSettingsCache()

    // Return updated settings
    const updatedSettings = await getAllSettings()

    return NextResponse.json({
      success: true,
      settings: (updatedSettings as any)[group],
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    )
  }
}
