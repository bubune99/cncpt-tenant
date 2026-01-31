/**
 * Shippo Webhook Handler
 *
 * Handles tracking updates from Shippo
 *
 * POST /api/webhooks/shippo - Receive tracking updates
 * GET /api/webhooks/shippo - Webhook verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/cms/db'
import { getShippingSettings } from '@/lib/cms/shippo'
import { handleShippoTrackingEvent } from '@/lib/cms/order-workflows/progress'
import { sendShippingNotification, sendDeliveryConfirmation } from '@/lib/cms/notifications'
import type { ShipmentStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface ShippoTrackingEvent {
  status: string
  statusDetails?: string
  statusDate?: string
  location?: {
    city?: string
    state?: string
    zip?: string
    country?: string
  }
}

interface ShippoWebhookPayload {
  event: string
  test: boolean
  data: {
    carrier: string
    tracking_number: string
    tracking_status: ShippoTrackingEvent
    tracking_history: ShippoTrackingEvent[]
  }
}

// Map Shippo tracking status to our ShipmentStatus enum
function mapTrackingToShipmentStatus(trackingStatus: string): ShipmentStatus {
  const statusMap: Record<string, ShipmentStatus> = {
    'PRE_TRANSIT': 'LABEL_CREATED',
    'TRANSIT': 'IN_TRANSIT',
    'DELIVERED': 'DELIVERED',
    'RETURNED': 'RETURNED',
    'FAILURE': 'FAILED',
    'UNKNOWN': 'PENDING',
  }
  return statusMap[trackingStatus] || 'PENDING'
}

// Verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-shippo-signature')

    // Get webhook secret
    const settings = await getShippingSettings()
    const webhookSecret = settings.shippoWebhookSecret || process.env.SHIPPO_WEBHOOK_SECRET

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const payload: ShippoWebhookPayload = JSON.parse(rawBody)

    // Only handle tracking updates
    if (payload.event !== 'track_updated') {
      return NextResponse.json({ received: true })
    }

    const { tracking_number, tracking_status, tracking_history } = payload.data

    // Find shipment by tracking number
    const shipment = await prisma.shipment.findFirst({
      where: { trackingNumber: tracking_number },
      include: { order: true },
    })

    if (!shipment) {
      console.log(`No shipment found for tracking number: ${tracking_number}`)
      return NextResponse.json({ received: true })
    }

    // Map tracking status to our enum
    const newStatus = mapTrackingToShipmentStatus(tracking_status.status)

    // Update shipment
    const updateData: {
      status: ShipmentStatus
      deliveredAt?: Date
      shippedAt?: Date
    } = {
      status: newStatus,
    }

    // Track when shipment transitions to TRANSIT (first real movement)
    const wasNotInTransit = shipment.status === 'PENDING' || shipment.status === 'LABEL_CREATED'
    const isNowInTransit = newStatus === 'IN_TRANSIT'

    if (newStatus === 'DELIVERED' && tracking_status.statusDate) {
      updateData.deliveredAt = new Date(tracking_status.statusDate)
    }

    if (isNowInTransit && wasNotInTransit && !shipment.shippedAt) {
      updateData.shippedAt = new Date(tracking_status.statusDate || Date.now())
    }

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData,
    })

    // Send notification emails based on status change
    if (shipment.order) {
      try {
        // Send shipping notification when package enters transit
        if (isNowInTransit && wasNotInTransit) {
          const result = await sendShippingNotification(shipment.orderId, shipment.id)
          if (result.success) {
            console.log(`Shipping notification sent for order ${shipment.orderId}`)
          } else {
            console.error(`Failed to send shipping notification:`, result.error)
          }
        }

        // Send delivery confirmation when delivered
        if (newStatus === 'DELIVERED') {
          const result = await sendDeliveryConfirmation(shipment.orderId, shipment.id)
          if (result.success) {
            console.log(`Delivery confirmation sent for order ${shipment.orderId}`)
          } else {
            console.error(`Failed to send delivery confirmation:`, result.error)
          }
        }
      } catch (emailError) {
        console.error('Error sending tracking notification email:', emailError)
        // Don't fail webhook for email errors
      }
    }

    // Auto-update order progress via workflow stages (if enabled)
    if (shipment.order) {
      try {
        const progressUpdated = await handleShippoTrackingEvent(
          shipment.orderId,
          tracking_status.status
        )
        if (progressUpdated) {
          console.log(
            `Order ${shipment.orderId} workflow progress auto-updated from Shippo: ${tracking_status.status}`
          )
        }
      } catch (err) {
        console.error('Error updating order workflow progress:', err)
        // Continue processing - don't fail the webhook for progress update errors
      }
    }

    // Update order status if applicable (legacy status field)
    if (shipment.order) {
      let orderStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' | undefined

      if (newStatus === 'IN_TRANSIT' || newStatus === 'OUT_FOR_DELIVERY') {
        orderStatus = 'SHIPPED'
      } else if (newStatus === 'DELIVERED') {
        orderStatus = 'DELIVERED'
      }

      if (orderStatus) {
        await prisma.order.update({
          where: { id: shipment.orderId },
          data: { status: orderStatus },
        })
      }
    }

    console.log(`Updated shipment ${shipment.id} status to ${newStatus}`)

    return NextResponse.json({ received: true, shipmentId: shipment.id })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Shippo webhook endpoint is active',
  })
}
