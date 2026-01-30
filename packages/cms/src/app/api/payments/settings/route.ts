/**
 * Stripe Payment Settings API
 *
 * GET /api/payments/settings - Get current payment settings
 * PUT /api/payments/settings - Update payment settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { getStripeSettings, clearStripeSettingsCache } from '../../../../lib/stripe'
import { encrypt } from '../../../../lib/encryption'
import type { StripeSettings } from '../../../../lib/stripe/types'

export async function GET() {
  try {
    const settings = await getStripeSettings()

    // Mask sensitive data
    const publicSettings = {
      ...settings,
      secretKey: settings.secretKey ? '********' : undefined,
      webhookSecret: settings.webhookSecret ? '********' : undefined,
    }

    return NextResponse.json(publicSettings)
  } catch (error) {
    console.error('Get payment settings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: Partial<StripeSettings> = await request.json()

    const updates: { key: string; value: string; encrypted: boolean }[] = []

    if (body.enabled !== undefined) {
      updates.push({ key: 'stripe.enabled', value: String(body.enabled), encrypted: false })
    }

    if (body.testMode !== undefined) {
      updates.push({ key: 'stripe.testMode', value: String(body.testMode), encrypted: false })
    }

    if (body.secretKey && body.secretKey !== '********') {
      updates.push({ key: 'stripe.secretKey', value: encrypt(body.secretKey), encrypted: true })
    }

    if (body.publishableKey && body.publishableKey !== '********') {
      updates.push({ key: 'stripe.publishableKey', value: encrypt(body.publishableKey), encrypted: true })
    }

    if (body.webhookSecret && body.webhookSecret !== '********') {
      updates.push({ key: 'stripe.webhookSecret', value: encrypt(body.webhookSecret), encrypted: true })
    }

    if (body.currency !== undefined) {
      updates.push({ key: 'stripe.currency', value: body.currency, encrypted: false })
    }

    if (body.statementDescriptor !== undefined) {
      updates.push({ key: 'stripe.statementDescriptor', value: body.statementDescriptor, encrypted: false })
    }

    if (body.supportedPaymentMethods !== undefined) {
      updates.push({
        key: 'stripe.supportedPaymentMethods',
        value: JSON.stringify(body.supportedPaymentMethods),
        encrypted: false,
      })
    }

    if (body.automaticTax !== undefined) {
      updates.push({ key: 'stripe.automaticTax', value: String(body.automaticTax), encrypted: false })
    }

    if (body.billingAddressCollection !== undefined) {
      updates.push({ key: 'stripe.billingAddressCollection', value: body.billingAddressCollection, encrypted: false })
    }

    // Upsert each setting
    for (const update of updates) {
      await prisma.setting.upsert({
        where: { key: update.key },
        create: {
          key: update.key,
          value: update.value,
          group: 'payments',
          encrypted: update.encrypted,
        },
        update: {
          value: update.value,
          encrypted: update.encrypted,
        },
      })
    }

    // Clear cache
    clearStripeSettingsCache()

    // Return updated settings
    const updatedSettings = await getStripeSettings()

    return NextResponse.json({
      ...updatedSettings,
      secretKey: updatedSettings.secretKey ? '********' : undefined,
      webhookSecret: updatedSettings.webhookSecret ? '********' : undefined,
    })
  } catch (error) {
    console.error('Update payment settings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    )
  }
}
