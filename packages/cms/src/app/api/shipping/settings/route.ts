/**
 * Shipping Settings API
 *
 * GET /api/shipping/settings - Get current shipping settings
 * POST /api/shipping/settings - Update shipping settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { getShippingSettings, clearShippingSettingsCache } from '../../../../lib/shippo'
import { encrypt } from '../../../../lib/encryption'
import type { ShippingSettings } from '../../../../lib/shippo/types'

// Settings keys for the shipping group
const SHIPPING_SETTINGS_KEYS = [
  'shipping.enabled',
  'shipping.shippoApiKey',
  'shipping.shippoWebhookSecret',
  'shipping.testMode',
  'shipping.useElements',
  'shipping.fromName',
  'shipping.fromCompany',
  'shipping.fromStreet1',
  'shipping.fromStreet2',
  'shipping.fromCity',
  'shipping.fromState',
  'shipping.fromZip',
  'shipping.fromCountry',
  'shipping.fromPhone',
  'shipping.fromEmail',
  'shipping.enabledCarriers',
  'shipping.defaultLabelFormat',
  'shipping.defaultPackageWeight',
  'shipping.requireSignature',
]

export async function GET() {
  try {
    const settings = await getShippingSettings()

    // Remove sensitive data for client response
    const publicSettings = {
      ...settings,
      shippoApiKey: settings.shippoApiKey ? '********' : undefined,
      shippoWebhookSecret: settings.shippoWebhookSecret ? '********' : undefined,
    }

    return NextResponse.json(publicSettings)
  } catch (error) {
    console.error('Get shipping settings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 }
    )
  }
}

// Support both POST and PUT for updating settings
export async function POST(request: NextRequest) {
  return handleUpdate(request)
}

export async function PUT(request: NextRequest) {
  return handleUpdate(request)
}

async function handleUpdate(request: NextRequest) {
  try {
    const body: Partial<ShippingSettings> = await request.json()

    // Build settings updates
    const updates: { key: string; value: string; encrypted: boolean }[] = []

    if (body.enabled !== undefined) {
      updates.push({ key: 'shipping.enabled', value: String(body.enabled), encrypted: false })
    }

    if (body.shippoApiKey && body.shippoApiKey !== '********') {
      // Encrypt the API key before storing
      updates.push({ key: 'shipping.shippoApiKey', value: encrypt(body.shippoApiKey), encrypted: true })
    }

    if (body.shippoWebhookSecret && body.shippoWebhookSecret !== '********') {
      // Encrypt the webhook secret before storing
      updates.push({ key: 'shipping.shippoWebhookSecret', value: encrypt(body.shippoWebhookSecret), encrypted: true })
    }

    if (body.testMode !== undefined) {
      updates.push({ key: 'shipping.testMode', value: String(body.testMode), encrypted: false })
    }

    if (body.useElements !== undefined) {
      updates.push({ key: 'shipping.useElements', value: String(body.useElements), encrypted: false })
    }

    if (body.fromName !== undefined) {
      updates.push({ key: 'shipping.fromName', value: body.fromName, encrypted: false })
    }

    if (body.fromCompany !== undefined) {
      updates.push({ key: 'shipping.fromCompany', value: body.fromCompany, encrypted: false })
    }

    if (body.fromStreet1 !== undefined) {
      updates.push({ key: 'shipping.fromStreet1', value: body.fromStreet1, encrypted: false })
    }

    if (body.fromStreet2 !== undefined) {
      updates.push({ key: 'shipping.fromStreet2', value: body.fromStreet2 || '', encrypted: false })
    }

    if (body.fromCity !== undefined) {
      updates.push({ key: 'shipping.fromCity', value: body.fromCity, encrypted: false })
    }

    if (body.fromState !== undefined) {
      updates.push({ key: 'shipping.fromState', value: body.fromState, encrypted: false })
    }

    if (body.fromZip !== undefined) {
      updates.push({ key: 'shipping.fromZip', value: body.fromZip, encrypted: false })
    }

    if (body.fromCountry !== undefined) {
      updates.push({ key: 'shipping.fromCountry', value: body.fromCountry, encrypted: false })
    }

    if (body.fromPhone !== undefined) {
      updates.push({ key: 'shipping.fromPhone', value: body.fromPhone || '', encrypted: false })
    }

    if (body.fromEmail !== undefined) {
      updates.push({ key: 'shipping.fromEmail', value: body.fromEmail || '', encrypted: false })
    }

    if (body.enabledCarriers !== undefined) {
      updates.push({
        key: 'shipping.enabledCarriers',
        value: JSON.stringify(body.enabledCarriers),
        encrypted: false,
      })
    }

    if (body.defaultLabelFormat !== undefined) {
      updates.push({ key: 'shipping.defaultLabelFormat', value: body.defaultLabelFormat, encrypted: false })
    }

    if (body.defaultPackageWeight !== undefined) {
      updates.push({
        key: 'shipping.defaultPackageWeight',
        value: String(body.defaultPackageWeight),
        encrypted: false,
      })
    }

    if (body.requireSignature !== undefined) {
      updates.push({ key: 'shipping.requireSignature', value: String(body.requireSignature), encrypted: false })
    }

    // Upsert each setting
    for (const update of updates) {
      const existing = await prisma.setting.findFirst({
        where: { key: update.key, tenantId: null },
      })
      if (existing) {
        await prisma.setting.update({
          where: { id: existing.id },
          data: {
            value: update.value,
            encrypted: update.encrypted,
          },
        })
      } else {
        await prisma.setting.create({
          data: {
            key: update.key,
            value: update.value,
            group: 'shipping',
            encrypted: update.encrypted,
            tenantId: null,
          },
        })
      }
    }

    // Clear cache so new settings take effect
    clearShippingSettingsCache()

    // Return updated settings
    const updatedSettings = await getShippingSettings()

    return NextResponse.json({
      ...updatedSettings,
      shippoApiKey: updatedSettings.shippoApiKey ? '********' : undefined,
      shippoWebhookSecret: updatedSettings.shippoWebhookSecret ? '********' : undefined,
    })
  } catch (error) {
    console.error('Update shipping settings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    )
  }
}
