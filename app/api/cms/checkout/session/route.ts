/**
 * Stripe Checkout Session API
 *
 * POST /api/checkout/session - Create a new checkout session
 * GET /api/checkout/session?sessionId=xxx - Get session details
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  createCheckoutSession,
  getCheckoutSession,
  getStripeSettings,
} from '@/lib/cms/stripe'
import type { CreateCheckoutSessionRequest, CheckoutItem } from '@/lib/cms/stripe/types'

export const dynamic = 'force-dynamic'

interface CreateSessionBody {
  orderId?: string
  items?: CheckoutItem[]
  customerEmail?: string
  customerId?: string
  mode?: 'payment' | 'subscription'
  allowPromotionCodes?: boolean
  shippingAddressCollection?: boolean
  metadata?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const settings = await getStripeSettings()

    if (!settings.enabled && !settings.secretKey) {
      return NextResponse.json(
        { error: 'Stripe payments are not configured' },
        { status: 400 }
      )
    }

    const body: CreateSessionBody = await request.json()
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''

    let items: CheckoutItem[] = []

    // If orderId provided, get items from order
    if (body.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: body.orderId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          customer: true,
        },
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      items = order.items.map((item: (typeof order.items)[number]) => {
        // Use Stripe price ID if available (variant takes priority)
        const stripePriceId = item.variant?.stripePriceId || item.product?.stripePriceId

        return {
          name: item.product?.title || item.title,
          description: item.product?.description?.substring(0, 500),
          price: Math.round(item.price * 100), // Convert to cents
          quantity: item.quantity,
          productId: item.productId || undefined,
          variantId: item.variantId || undefined,
          stripePriceId: stripePriceId || undefined,
        }
      })

      // Use customer email from order
      if (!body.customerEmail && order.customer?.email) {
        body.customerEmail = order.customer.email
      }
    } else if (body.items && body.items.length > 0) {
      items = body.items
    } else {
      return NextResponse.json(
        { error: 'Either orderId or items are required' },
        { status: 400 }
      )
    }

    // Create checkout session
    const sessionRequest: CreateCheckoutSessionRequest = {
      orderId: body.orderId,
      items,
      customerEmail: body.customerEmail,
      customerId: body.customerId,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/checkout/cancel`,
      mode: body.mode || 'payment',
      allowPromotionCodes: body.allowPromotionCodes ?? true,
      shippingAddressCollection: body.shippingAddressCollection,
      metadata: body.metadata,
    }

    const session = await createCheckoutSession(sessionRequest)

    // Update order with checkout session ID if applicable
    if (body.orderId) {
      await prisma.order.update({
        where: { id: body.orderId },
        data: {
          stripeSessionId: session.sessionId,
          status: 'PROCESSING',
        },
      })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Create checkout session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const session = await getCheckoutSession(sessionId)

    return NextResponse.json({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    })
  } catch (error) {
    console.error('Get checkout session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get checkout session' },
      { status: 500 }
    )
  }
}
