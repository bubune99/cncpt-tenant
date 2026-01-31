/**
 * Address Validation API
 *
 * POST /api/shipping/validate-address - Validate a shipping address
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAddress, getShippingSettings } from '../../../../lib/shippo'
import type { ShippingAddress } from '../../../../lib/shippo/types'

export async function POST(request: NextRequest) {
  try {
    const address: ShippingAddress = await request.json()
    const settings = await getShippingSettings()

    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'Shipping is not enabled' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!address.name || !address.street1 || !address.city || !address.state || !address.zip) {
      return NextResponse.json(
        { error: 'Missing required address fields: name, street1, city, state, zip' },
        { status: 400 }
      )
    }

    const validatedAddress = await validateAddress({
      ...address,
      country: address.country || 'US',
    })

    return NextResponse.json(validatedAddress)
  } catch (error) {
    console.error('Validate address error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to validate address' },
      { status: 500 }
    )
  }
}
