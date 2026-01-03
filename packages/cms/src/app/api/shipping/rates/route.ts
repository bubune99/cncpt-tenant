/**
 * Shipping Rates API
 *
 * POST /api/shipping/rates - Get shipping rates for a shipment
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  createShipment,
  getDefaultFromAddress,
  getShippingSettings,
} from '@/lib/shippo'
import type { Parcel, ShippingAddress } from '@/lib/shippo/types'

interface RatesRequestBody {
  // Either provide an order ID to get rates for
  orderId?: string
  // Or provide address and parcels directly
  addressTo?: ShippingAddress
  parcels?: Parcel[]
  // Optional: override the from address
  addressFrom?: ShippingAddress
}

export async function POST(request: NextRequest) {
  try {
    const body: RatesRequestBody = await request.json()
    const settings = await getShippingSettings()

    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'Shipping is not enabled' },
        { status: 400 }
      )
    }

    let addressTo: ShippingAddress
    let parcels: Parcel[]

    // If orderId is provided, get address and parcels from order
    if (body.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: body.orderId },
        include: {
          shippingAddress: true,
          items: {
            include: {
              variant: true,
            },
          },
        },
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      if (!order.shippingAddress) {
        return NextResponse.json(
          { error: 'Order has no shipping address' },
          { status: 400 }
        )
      }

      // Build address from order
      addressTo = {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        company: order.shippingAddress.company || undefined,
        street1: order.shippingAddress.street1,
        street2: order.shippingAddress.street2 || undefined,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zip: order.shippingAddress.zip,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone || undefined,
        email: order.email,
      }

      // Calculate total weight and use default dimensions
      let totalWeight = 0
      for (const item of order.items) {
        const itemWeight = item.variant?.weight || settings.defaultPackageWeight || 16
        totalWeight += itemWeight * item.quantity
      }

      // Use a single parcel with combined weight
      parcels = [{
        length: 10, // Default dimensions
        width: 8,
        height: 4,
        weight: totalWeight,
        massUnit: 'oz',
        distanceUnit: 'in',
      }]
    } else if (body.addressTo && body.parcels) {
      addressTo = body.addressTo
      parcels = body.parcels
    } else {
      return NextResponse.json(
        { error: 'Must provide either orderId or addressTo and parcels' },
        { status: 400 }
      )
    }

    // Get from address
    const addressFrom = body.addressFrom || await getDefaultFromAddress()

    // Create shipment and get rates
    const shipment = await createShipment({
      addressFrom,
      addressTo,
      parcels,
    })

    // Filter rates by enabled carriers
    const enabledCarriers = settings.enabledCarriers || ['usps', 'ups', 'fedex']
    const filteredRates = shipment.rates.filter(rate =>
      enabledCarriers.includes(rate.carrier)
    )

    return NextResponse.json({
      shipmentId: shipment.shipmentId,
      rates: filteredRates,
      messages: shipment.messages,
    })
  } catch (error) {
    console.error('Get rates error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get rates' },
      { status: 500 }
    )
  }
}
