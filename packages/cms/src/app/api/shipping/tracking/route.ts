/**
 * Shipping Tracking API
 *
 * GET /api/shipping/tracking?shipmentId=xxx - Get tracking info for a shipment
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { getTracking, getShippingSettings } from '../../../../lib/shippo'
import type { CarrierType } from '../../../../lib/shippo/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipmentId')
    const trackingNumber = searchParams.get('trackingNumber')
    const carrier = searchParams.get('carrier') as CarrierType | null

    const settings = await getShippingSettings()

    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'Shipping is not enabled' },
        { status: 400 }
      )
    }

    let trackingNo: string
    let carrierCode: CarrierType

    // Get tracking info either by shipment ID or directly
    if (shipmentId) {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
      })

      if (!shipment) {
        return NextResponse.json(
          { error: 'Shipment not found' },
          { status: 404 }
        )
      }

      if (!shipment.trackingNumber || !shipment.carrier) {
        return NextResponse.json(
          { error: 'No tracking information available' },
          { status: 404 }
        )
      }

      trackingNo = shipment.trackingNumber
      carrierCode = shipment.carrier.toLowerCase() as CarrierType
    } else if (trackingNumber && carrier) {
      trackingNo = trackingNumber
      carrierCode = carrier
    } else {
      return NextResponse.json(
        { error: 'Must provide either shipmentId or trackingNumber and carrier' },
        { status: 400 }
      )
    }

    // Get tracking from Shippo
    const tracking = await getTracking(carrierCode, trackingNo)

    return NextResponse.json(tracking)
  } catch (error) {
    console.error('Get tracking error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get tracking' },
      { status: 500 }
    )
  }
}
