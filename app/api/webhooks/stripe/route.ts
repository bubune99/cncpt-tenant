/**
 * Platform Stripe Webhook Handler
 * Handles platform billing events (subscriptions, credit purchases)
 *
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from "next/server"
import { constructWebhookEvent } from "@/lib/stripe"
import { addUserPurchasedCredits, addPurchasedCredits } from "@/lib/ai-credits"
import { sql } from "@/lib/neon"
import type Stripe from "stripe"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = constructWebhookEvent(rawBody, signature)
    } catch (err) {
      console.error("[platform-webhook] Signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    // Only handle events for our platform
    const metadata = (event.data.object as any).metadata || {}
    if (metadata.platform !== "cncpt-web-hosting") {
      // Not our event, acknowledge but don't process
      return NextResponse.json({ received: true, skipped: true })
    }

    console.log(`[platform-webhook] Processing ${event.type}`)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`[platform-webhook] Checkout expired: ${session.id}`)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoiceFailed(invoice)
        break
      }

      default:
        console.log(`[platform-webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[platform-webhook] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout (credit purchases)
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}

  if (metadata.type === "credit_purchase") {
    const userId = metadata.userId
    const subdomainId = metadata.subdomainId
    const totalCredits = parseInt(metadata.totalCredits || "0", 10)
    const packName = metadata.packName

    if (!userId || totalCredits <= 0) {
      console.error("[platform-webhook] Invalid credit purchase metadata:", metadata)
      return
    }

    console.log(`[platform-webhook] Processing credit purchase: ${totalCredits} credits for user ${userId}`)

    let success: boolean

    if (subdomainId) {
      // Add to team/subdomain pool
      success = await addPurchasedCredits(
        subdomainId,
        totalCredits,
        userId,
        session.payment_intent as string
      )
    } else {
      // Add to user's personal balance
      success = await addUserPurchasedCredits(
        userId,
        totalCredits,
        session.payment_intent as string
      )
    }

    if (success) {
      console.log(`[platform-webhook] Added ${totalCredits} credits for user ${userId} (pack: ${packName})`)

      // Log the purchase for analytics
      try {
        await sql`
          INSERT INTO credit_purchases (
            user_id, subdomain_id, pack_name, credits_amount,
            price_cents, stripe_session_id, stripe_payment_intent_id
          ) VALUES (
            ${userId}, ${subdomainId || null}, ${packName}, ${totalCredits},
            ${session.amount_total || 0}, ${session.id}, ${session.payment_intent as string}
          )
        `
      } catch (e) {
        // Table might not exist, that's ok
        console.log("[platform-webhook] Could not log purchase (table may not exist)")
      }
    } else {
      console.error(`[platform-webhook] Failed to add credits for user ${userId}`)
    }
  }
}

/**
 * Handle subscription updates (plan changes)
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata || {}
  const userId = metadata.userId

  if (!userId) {
    console.log("[platform-webhook] Subscription update without userId, skipping")
    return
  }

  try {
    // Update or create subscription record
    await sql`
      INSERT INTO user_subscriptions (
        user_id, stripe_subscription_id, stripe_customer_id,
        status, price_id, current_period_start, current_period_end,
        cancel_at_period_end
      ) VALUES (
        ${userId},
        ${subscription.id},
        ${subscription.customer as string},
        ${subscription.status},
        ${subscription.items.data[0]?.price.id},
        ${new Date(subscription.current_period_start * 1000).toISOString()},
        ${new Date(subscription.current_period_end * 1000).toISOString()},
        ${subscription.cancel_at_period_end}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_subscription_id = ${subscription.id},
        status = ${subscription.status},
        price_id = ${subscription.items.data[0]?.price.id},
        current_period_start = ${new Date(subscription.current_period_start * 1000).toISOString()},
        current_period_end = ${new Date(subscription.current_period_end * 1000).toISOString()},
        cancel_at_period_end = ${subscription.cancel_at_period_end},
        updated_at = NOW()
    `

    console.log(`[platform-webhook] Updated subscription for user ${userId}: ${subscription.status}`)
  } catch (error) {
    console.error("[platform-webhook] Error updating subscription:", error)
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata || {}
  const userId = metadata.userId

  if (!userId) return

  try {
    await sql`
      UPDATE user_subscriptions
      SET status = 'canceled', canceled_at = NOW(), updated_at = NOW()
      WHERE user_id = ${userId}
    `

    console.log(`[platform-webhook] Subscription canceled for user ${userId}`)
  } catch (error) {
    console.error("[platform-webhook] Error canceling subscription:", error)
  }
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (subscriptionId) {
    try {
      await sql`
        UPDATE user_subscriptions
        SET status = 'active', updated_at = NOW()
        WHERE stripe_subscription_id = ${subscriptionId}
      `
    } catch (error) {
      console.error("[platform-webhook] Error updating subscription on invoice paid:", error)
    }
  }

  console.log(`[platform-webhook] Invoice paid: ${invoice.id}`)
}

/**
 * Handle failed invoice payment
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (subscriptionId) {
    try {
      await sql`
        UPDATE user_subscriptions
        SET status = 'past_due', updated_at = NOW()
        WHERE stripe_subscription_id = ${subscriptionId}
      `
    } catch (error) {
      console.error("[platform-webhook] Error updating subscription on invoice failed:", error)
    }
  }

  console.log(`[platform-webhook] Invoice payment failed: ${invoice.id}`)
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Platform Stripe webhook endpoint is active",
  })
}
