/**
 * Shipping Refund API
 *
 * POST /api/shipping/refund - Request a refund for a shipping label
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { refundLabel, getShippingSettings } from '@/lib/cms/shippo'

export const dynamic = 'force-dynamic'

interface RefundRequestBody {
  shipmentId: string // Our internal shipment ID
}

export async function POST(request: NextRequest) {
  try {
    const body: RefundRequestBody = await request.json()
    const settings = await getShippingSettings()

    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'Shipping is not enabled' },
        { status: 400 }
      )
    }

    if (!body.shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Find the shipment
    const shipment = await prisma.shipment.findUnique({
      where: { id: body.shipmentId },
    })

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    if (!shipment.shippoTransactionId) {
      return NextResponse.json(
        { error: 'No transaction ID found for this shipment' },
        { status: 400 }
      )
    }

    // Can only refund labels that haven't been used
    if (shipment.status !== 'LABEL_CREATED' && shipment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot refund a label that has already been shipped' },
        { status: 400 }
      )
    }

    // Request refund from Shippo
    const refund = await refundLabel(shipment.shippoTransactionId)

    // Update shipment status
    await prisma.shipment.update({
      where: { id: body.shipmentId },
      data: {
        status: refund.status === 'SUCCESS' ? 'RETURNED' : 'PENDING',
      },
    })

    return NextResponse.json({
      status: refund.status,
      message: refund.status === 'SUCCESS'
        ? 'Refund processed successfully'
        : 'Refund request is pending',
    })
  } catch (error) {
    console.error('Refund label error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refund label' },
      { status: 500 }
    )
  }
}
