/**
 * Shipping Label API
 *
 * POST /api/shipping/label - Purchase a shipping label
 * GET /api/shipping/label?shipmentId=xxx - Get label for existing shipment
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { purchaseLabel, getShippingSettings } from '@/lib/cms/shippo'
import type { LabelFormat } from '@/lib/cms/shippo/types'

export const dynamic = 'force-dynamic'

interface PurchaseLabelBody {
  rateId: string
  orderId?: string
  shipmentId?: string // Shippo shipment ID
  labelFormat?: LabelFormat
}

export async function POST(request: NextRequest) {
  try {
    const body: PurchaseLabelBody = await request.json()
    const settings = await getShippingSettings()

    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'Shipping is not enabled' },
        { status: 400 }
      )
    }

    if (!body.rateId) {
      return NextResponse.json(
        { error: 'Rate ID is required' },
        { status: 400 }
      )
    }

    // Purchase the label
    const label = await purchaseLabel({
      rateId: body.rateId,
      labelFormat: body.labelFormat || settings.defaultLabelFormat || 'PDF',
    })

    if (label.status !== 'SUCCESS') {
      return NextResponse.json(
        {
          error: 'Failed to purchase label',
          messages: label.messages,
        },
        { status: 400 }
      )
    }

    // If orderId is provided, create/update shipment record
    if (body.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: body.orderId },
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      // Create shipment record
      await prisma.shipment.create({
        data: {
          orderId: body.orderId,
          carrier: label.rate.carrier.toUpperCase(),
          service: label.rate.servicelevel.name,
          trackingNumber: label.trackingNumber,
          trackingUrl: label.trackingUrl,
          labelUrl: label.labelUrl,
          status: 'LABEL_CREATED',
          shippoShipmentId: body.shipmentId,
          shippoTransactionId: label.transactionId,
          shippoRateId: body.rateId,
          shippingCost: Math.round(parseFloat(label.rate.amount) * 100), // Convert to cents
        },
      })

      // Update order status
      await prisma.order.update({
        where: { id: body.orderId },
        data: {
          status: 'PROCESSING',
          shippingTotal: Math.round(parseFloat(label.rate.amount) * 100),
        },
      })
    }

    return NextResponse.json({
      transactionId: label.transactionId,
      trackingNumber: label.trackingNumber,
      trackingUrl: label.trackingUrl,
      labelUrl: label.labelUrl,
      carrier: label.rate.carrier,
      service: label.rate.servicelevel.name,
      cost: label.rate.amount,
    })
  } catch (error) {
    console.error('Purchase label error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to purchase label' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipmentId')

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Find the shipment
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    })

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    if (!shipment.labelUrl) {
      return NextResponse.json(
        { error: 'No label available for this shipment' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      labelUrl: shipment.labelUrl,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      carrier: shipment.carrier,
      service: shipment.service,
    })
  } catch (error) {
    console.error('Get label error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get label' },
      { status: 500 }
    )
  }
}
