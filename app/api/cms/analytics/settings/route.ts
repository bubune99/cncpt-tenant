/**
 * Analytics Settings API
 *
 * GET /api/analytics/settings - Get analytics settings
 * PUT /api/analytics/settings - Update analytics settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { getAnalyticsSettings, clearAnalyticsSettingsCache } from '../../../../lib/analytics'
import type { AnalyticsSettings } from '../../../../lib/analytics/types'

export async function GET() {
  try {
    const settings = await getAnalyticsSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get analytics settings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: Partial<AnalyticsSettings> = await request.json()

    const updates: { key: string; value: string }[] = []

    if (body.enabled !== undefined) {
      updates.push({ key: 'analytics.enabled', value: String(body.enabled) })
    }

    if (body.googleEnabled !== undefined) {
      updates.push({ key: 'analytics.googleEnabled', value: String(body.googleEnabled) })
    }

    if (body.googleMeasurementId !== undefined) {
      updates.push({ key: 'analytics.googleMeasurementId', value: body.googleMeasurementId })
    }

    if (body.googleDebugMode !== undefined) {
      updates.push({ key: 'analytics.googleDebugMode', value: String(body.googleDebugMode) })
    }

    if (body.matomoEnabled !== undefined) {
      updates.push({ key: 'analytics.matomoEnabled', value: String(body.matomoEnabled) })
    }

    if (body.matomoUrl !== undefined) {
      updates.push({ key: 'analytics.matomoUrl', value: body.matomoUrl })
    }

    if (body.matomoSiteId !== undefined) {
      updates.push({ key: 'analytics.matomoSiteId', value: body.matomoSiteId })
    }

    if (body.plausibleEnabled !== undefined) {
      updates.push({ key: 'analytics.plausibleEnabled', value: String(body.plausibleEnabled) })
    }

    if (body.plausibleDomain !== undefined) {
      updates.push({ key: 'analytics.plausibleDomain', value: body.plausibleDomain })
    }

    if (body.respectDoNotTrack !== undefined) {
      updates.push({ key: 'analytics.respectDoNotTrack', value: String(body.respectDoNotTrack) })
    }

    if (body.anonymizeIp !== undefined) {
      updates.push({ key: 'analytics.anonymizeIp', value: String(body.anonymizeIp) })
    }

    if (body.cookieConsent !== undefined) {
      updates.push({ key: 'analytics.cookieConsent', value: String(body.cookieConsent) })
    }

    // Upsert each setting
    for (const update of updates) {
      const existing = await prisma.setting.findFirst({
        where: { key: update.key, tenantId: null },
      })
      if (existing) {
        await prisma.setting.update({
          where: { id: existing.id },
          data: { value: update.value },
        })
      } else {
        await prisma.setting.create({
          data: {
            key: update.key,
            value: update.value,
            group: 'analytics',
            encrypted: false,
            tenantId: null,
          },
        })
      }
    }

    // Clear cache
    clearAnalyticsSettingsCache()

    // Return updated settings
    const updatedSettings = await getAnalyticsSettings()
    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Update analytics settings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    )
  }
}
