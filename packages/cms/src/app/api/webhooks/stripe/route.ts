/**
 * Stripe Webhook Handler
 *
 * Handles payment events from Stripe
 *
 * POST /api/webhooks/stripe - Receive Stripe events
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { constructWebhookEvent } from '@/lib/stripe'
import { sendOrderConfirmation, sendRefundNotification } from '@/lib/notifications'
import { deductStockForOrder, releaseSessionReservations } from '@/lib/inventory'
import type Stripe from 'stripe'

// Map Stripe payment status to our order status
function mapPaymentToOrderStatus(
  paymentStatus: string
): 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' {
  switch (paymentStatus) {
    case 'succeeded':
      return 'PROCESSING'
    case 'canceled':
      return 'CANCELLED'
    default:
      return 'PENDING'
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = await constructWebhookEvent(rawBody, signature)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutExpired(session)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSucceeded(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        await handleDisputeCreated(dispute)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId

  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        stripePaymentIntentId: session.payment_intent as string,
        paidAt: new Date(),
      },
    })

    console.log(`Order ${orderId} marked as paid`)

    // Deduct stock from reservations
    try {
      const stockResult = await deductStockForOrder(orderId)
      if (stockResult.success) {
        console.log(`Stock deducted for order ${orderId}`)
      } else {
        console.error(`Failed to deduct stock for ${orderId}:`, stockResult.error)
      }
    } catch (stockError) {
      console.error(`Error deducting stock for ${orderId}:`, stockError)
      // Don't fail the webhook for stock errors
    }

    // Send order confirmation email
    try {
      const result = await sendOrderConfirmation(orderId)
      if (result.success) {
        console.log(`Order confirmation email sent for ${orderId}`)
      } else {
        console.error(`Failed to send order confirmation for ${orderId}:`, result.error)
      }
    } catch (emailError) {
      console.error(`Error sending order confirmation for ${orderId}:`, emailError)
      // Don't fail the webhook for email errors
    }
  }

  // Store payment record
  if (session.payment_intent) {
    await prisma.payment.create({
      data: {
        orderId: orderId || undefined,
        stripePaymentIntentId: session.payment_intent as string,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'usd',
        status: 'SUCCEEDED',
        customerEmail: session.customer_email || undefined,
      },
    })
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId

  if (orderId) {
    // Only update if still pending
    await prisma.order.updateMany({
      where: {
        id: orderId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    })

    // Release stock reservations for this order
    try {
      const releasedCount = await prisma.stockReservation.updateMany({
        where: {
          orderId,
          released: false,
        },
        data: {
          released: true,
        },
      })
      console.log(`Released ${releasedCount.count} stock reservations for expired order ${orderId}`)
    } catch (stockError) {
      console.error(`Error releasing stock reservations for ${orderId}:`, stockError)
    }

    console.log(`Order ${orderId} checkout expired`)
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId

  // Update order if linked
  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        stripePaymentIntentId: paymentIntent.id,
        paidAt: new Date(),
      },
    })
  }

  // Update payment record
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: 'SUCCEEDED' },
  })

  console.log(`Payment ${paymentIntent.id} succeeded`)
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId

  // Update payment record
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      status: 'FAILED',
      errorMessage: paymentIntent.last_payment_error?.message,
    },
  })

  console.log(`Payment ${paymentIntent.id} failed: ${paymentIntent.last_payment_error?.message}`)
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string

  if (paymentIntentId) {
    // Update payment record
    const isFullRefund = charge.amount_refunded === charge.amount

    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundedAmount: charge.amount_refunded / 100,
      },
    })

    // Update order if linked
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    })

    if (payment?.orderId) {
      if (isFullRefund) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'REFUNDED' },
        })
      }

      // Send refund notification email
      try {
        const refundAmount = charge.amount_refunded / 100
        const result = await sendRefundNotification(
          payment.orderId,
          refundAmount,
          charge.refunds?.data?.[0]?.reason || undefined,
          isFullRefund
        )
        if (result.success) {
          console.log(`Refund notification email sent for order ${payment.orderId}`)
        } else {
          console.error(`Failed to send refund notification for ${payment.orderId}:`, result.error)
        }
      } catch (emailError) {
        console.error(`Error sending refund notification for ${payment.orderId}:`, emailError)
        // Don't fail the webhook for email errors
      }
    }

    console.log(`Charge ${charge.id} refunded`)
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const charge = dispute.charge as string

  console.log(`Dispute created for charge ${charge}: ${dispute.reason}`)

  // You might want to notify admin, pause order fulfillment, etc.
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  // Store/update subscription in database
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  console.log(`Subscription ${subscription.id} updated: ${subscription.status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  })

  console.log(`Subscription ${subscription.id} deleted`)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (subscriptionId) {
    // Extend subscription period
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'active',
      },
    })
  }

  console.log(`Invoice ${invoice.id} paid`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (subscriptionId) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'past_due',
      },
    })
  }

  console.log(`Invoice ${invoice.id} payment failed`)
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Stripe webhook endpoint is active',
  })
}
