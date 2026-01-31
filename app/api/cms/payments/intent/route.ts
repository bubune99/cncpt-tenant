/**
 * Payment Intent API
 *
 * POST /api/payments/intent - Create a payment intent
 * GET /api/payments/intent?paymentIntentId=xxx - Get payment intent status
 *
 * Supports two modes:
 * 1. Amount-based: Provide amount directly
 * 2. Order-based: Provide orderId and amount is calculated from order
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  createPaymentIntent,
  getPaymentIntent,
  capturePaymentIntent,
  cancelPaymentIntent,
  getStripeSettings,
  getOrCreateCustomer,
} from '@/lib/cms/stripe'
import { createOrderPaymentIntent } from '@/lib/cms/stripe/product-sync'
import type { CreatePaymentIntentRequest } from '@/lib/cms/stripe/types'

export const dynamic = 'force-dynamic'

interface CreateIntentBody {
  // Mode 1: Direct amount
  amount?: number // in cents

  // Mode 2: Order-based
  orderId?: string

  // Optional customer info
  customerEmail?: string
  customerId?: string // Stripe customer ID

  // Options
  captureMethod?: 'automatic' | 'manual'
  useExistingStripePrices?: boolean // Use product stripePriceId if available
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

    const body: CreateIntentBody = await request.json()

    // Mode 2: Order-based payment intent
    if (body.orderId && !body.amount) {
      // Use the specialized function for order-based payment intents
      const result = await createOrderPaymentIntent(body.orderId)

      return NextResponse.json({
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        status: 'requires_payment_method',
      })
    }

    // Mode 1: Direct amount
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required (or provide orderId)' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer if email provided
    let stripeCustomerId = body.customerId
    if (!stripeCustomerId && body.customerEmail) {
      stripeCustomerId = await getOrCreateCustomer(body.customerEmail)
    }

    const intentRequest: CreatePaymentIntentRequest = {
      amount: body.amount,
      orderId: body.orderId,
      customerEmail: body.customerEmail,
      customerId: stripeCustomerId,
      captureMethod: body.captureMethod,
      metadata: body.metadata,
    }

    const result = await createPaymentIntent(intentRequest)

    // Store payment record
    await prisma.payment.create({
      data: {
        orderId: body.orderId,
        stripePaymentIntentId: result.paymentIntentId,
        amount: body.amount / 100,
        currency: settings.currency,
        status: 'PENDING',
        customerEmail: body.customerEmail,
        stripeCustomerId: stripeCustomerId,
      },
    })

    // Update order with payment intent if orderId provided
    if (body.orderId) {
      await prisma.order.update({
        where: { id: body.orderId },
        data: {
          stripePaymentIntentId: result.paymentIntentId,
        },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Create payment intent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('paymentIntentId')

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    const paymentIntent = await getPaymentIntent(paymentIntentId)

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    })
  } catch (error) {
    console.error('Get payment intent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get payment intent' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, action, amount } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    if (action === 'capture') {
      const result = await capturePaymentIntent(paymentIntentId, amount)
      return NextResponse.json(result)
    } else if (action === 'cancel') {
      await cancelPaymentIntent(paymentIntentId)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "capture" or "cancel"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Update payment intent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update payment intent' },
      { status: 500 }
    )
  }
}
