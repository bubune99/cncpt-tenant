/**
 * Storage Settings API (tenant-scoped)
 *
 * GET:  Retrieve storage settings (secrets masked)
 * PUT:  Update storage settings (secrets encrypted)
 * POST: Test storage connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/lib/cms/stack'
import {
  getStorageSettings,
  updateSettings,
  clearSettingsCache,
} from '@/lib/cms/settings'
import { invalidateStorageClient, testStorageConnection } from '@/lib/cms/r2'
import { withTenant } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cms/settings/storage
 *
 * Returns current storage settings with secrets partially masked.
 */
export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
    try {
      const user = await stackServerApp.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const settings = await getStorageSettings()

      // Mask sensitive values -- show last 4 chars for identification
      const masked = {
        ...settings,
        accessKeyId: settings.accessKeyId
          ? `****${settings.accessKeyId.slice(-4)}`
          : undefined,
        secretAccessKey: settings.secretAccessKey ? '********' : undefined,
      }

      return NextResponse.json({ settings: masked })
    } catch (error) {
      console.error('[Storage Settings] GET error:', error)
      return NextResponse.json(
        { error: 'Failed to load storage settings' },
        { status: 500 }
      )
    }
  })
}

/**
 * PUT /api/cms/settings/storage
 *
 * Update storage settings. Secrets are encrypted before storage.
 * Masked values ('********' or '****XXXX') are skipped to preserve existing secrets.
 */
export async function PUT(request: NextRequest) {
  return withTenant(request, async () => {
    try {
      const user = await stackServerApp.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()

      // Validate provider
      const validProviders = ['s3', 'r2', 'local']
      if (body.provider && !validProviders.includes(body.provider)) {
        return NextResponse.json(
          { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
          { status: 400 }
        )
      }

      // Build settings object, filtering out masked secrets
      const settingsToUpdate: Record<string, unknown> = {}

      const fields = [
        'provider', 'bucket', 'region', 'endpoint', 'publicUrl',
        'forcePathStyle', 'maxFileSize', 'maxImageSize', 'maxVideoSize',
        'maxAudioSize', 'allowedFileTypes', 'tenantIsolation',
      ]

      for (const field of fields) {
        if (body[field] !== undefined) {
          settingsToUpdate[field] = body[field]
        }
      }

      // Handle sensitive fields -- only update if not masked
      if (body.accessKeyId !== undefined && !body.accessKeyId.startsWith('****')) {
        settingsToUpdate.accessKeyId = body.accessKeyId
      }
      if (body.secretAccessKey !== undefined && body.secretAccessKey !== '********') {
        settingsToUpdate.secretAccessKey = body.secretAccessKey
      }

      // Persist to DB (encryption handled by updateSettings for sensitive keys)
      await updateSettings('storage', settingsToUpdate)

      // Clear settings cache and invalidate the cached S3 client
      clearSettingsCache('storage')
      invalidateStorageClient()

      // Return updated settings (masked)
      const updated = await getStorageSettings()
      const masked = {
        ...updated,
        accessKeyId: updated.accessKeyId
          ? `****${updated.accessKeyId.slice(-4)}`
          : undefined,
        secretAccessKey: updated.secretAccessKey ? '********' : undefined,
      }

      return NextResponse.json({ success: true, settings: masked })
    } catch (error) {
      console.error('[Storage Settings] PUT error:', error)
      return NextResponse.json(
        { error: 'Failed to save storage settings' },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/cms/settings/storage
 *
 * Actions:
 * - { action: "test" } -- Test the storage connection using current settings
 */
export async function POST(request: NextRequest) {
  return withTenant(request, async () => {
    try {
      const user = await stackServerApp.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()

      if (body.action === 'test') {
        // Clear cache to ensure we test with the latest settings
        clearSettingsCache('storage')
        invalidateStorageClient()

        const result = await testStorageConnection()
        return NextResponse.json(result)
      }

      return NextResponse.json(
        { error: 'Unknown action. Supported: "test"' },
        { status: 400 }
      )
    } catch (error) {
      console.error('[Storage Settings] POST error:', error)
      return NextResponse.json(
        { error: 'Failed to execute action' },
        { status: 500 }
      )
    }
  })
}
