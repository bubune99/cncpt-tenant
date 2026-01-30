/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events from Stripe
 */

import { NextRequest, NextResponse } from "next/server"
import { constructWebhookEvent, stripe } from "@/lib/stripe"
import { sql } from "@/lib/neon"
import {
  syncStripeSubscription,
  updateUserTier,
  downgradeToFreeTier,
  updateStripeCustomerId,
} from "@/lib/subscription"
import type Stripe from "stripe"

/**
 * Check if event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const rows = await sql`
      SELECT 1 FROM webhook_events WHERE event_id = ${eventId}
    `
    return rows.length > 0
  } catch {
    // Table might not exist yet, continue processing
    return false
  }
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId: string, eventType: string, error?: string): Promise<void> {
  try {
    await sql`
      INSERT INTO webhook_events (event_id, event_type, status, error_message)
      VALUES (${eventId}, ${eventType}, ${error ? 'failed' : 'processed'}, ${error || null})
      ON CONFLICT (event_id) DO NOTHING
    `
  } catch (err) {
    // Log but don't fail - idempotency is best-effort
    console.warn("[webhook] Failed to mark event as processed:", err)
  }
}

/**
 * POST /api/dashboard/subscription/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      console.error("[webhook] Missing stripe-signature header")
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = constructWebhookEvent(body, signature)
    } catch (error) {
      console.error("[webhook] Signature verification failed:", error)
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      )
    }

    console.log(`[webhook] Received event: ${event.type} (${event.id})`)

    // Idempotency check - skip if already processed
    if (await isEventProcessed(event.id)) {
      console.log(`[webhook] Event ${event.id} already processed, skipping`)
      return NextResponse.json({ received: true, skipped: true })
    }

    // Handle the event
    let processingError: string | undefined
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case "customer.subscription.created":
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case "invoice.payment_failed":
          await handlePaymentFailed(event.data.object as Stripe.Invoice)
          break

        case "invoice.payment_succeeded":
          await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case "invoice.paid":
          await handleInvoicePaid(event.data.object as Stripe.Invoice)
          break

        case "customer.created":
          await handleCustomerCreated(event.data.object as Stripe.Customer)
          break

        default:
          console.log(`[webhook] Unhandled event type: ${event.type}`)
      }
    } catch (err) {
      processingError = err instanceof Error ? err.message : "Unknown error"
      console.error(`[webhook] Error processing ${event.type}:`, err)
    }

    // Mark event as processed (even if it failed, to prevent retries of broken events)
    await markEventProcessed(event.id, event.type, processingError)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

/**
 * Handle checkout.session.completed
 * Links the subscription to the user and assigns the tier
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("[webhook] Processing checkout.session.completed:", session.id)

  const userId = session.metadata?.userId
  const tierId = session.metadata?.tierId

  if (!userId) {
    console.error("[webhook] No userId in session metadata")
    return
  }

  // Get the subscription ID from the session
  const subscriptionId = session.subscription as string | null

  if (subscriptionId) {
    // Sync the subscription to the database
    await syncStripeSubscription(userId, subscriptionId)
  }

  // Update customer ID if present
  const customerId = session.customer as string | null
  if (customerId) {
    await updateStripeCustomerId(userId, customerId)
  }

  // Update user's tier directly if we have the tier ID
  if (tierId) {
    await updateUserTier(userId, tierId, "active")
  }

  // Log the successful upgrade
  try {
    await sql`
      INSERT INTO subscription_events (
        user_id,
        event_type,
        stripe_event_id,
        tier_id,
        metadata
      ) VALUES (
        ${userId},
        'checkout_completed',
        ${session.id},
        ${tierId || null},
        ${JSON.stringify({ subscriptionId, customerId })}
      )
    `
  } catch (logError) {
    // Don't fail if logging fails - table might not exist
    console.warn("[webhook] Failed to log subscription event:", logError)
  }

  console.log(`[webhook] Checkout completed for user ${userId}, tier ${tierId}`)
}

/**
 * Handle customer.subscription.updated
 * Updates the user's tier based on the subscription changes
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("[webhook] Processing subscription updated:", subscription.id)

  const userId = subscription.metadata?.userId

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string
    const userRows = await sql`
      SELECT id FROM users WHERE stripe_customer_id = ${customerId}
      UNION
      SELECT user_id as id FROM platform_clients WHERE stripe_customer_id = ${customerId}
      LIMIT 1
    `

    if (userRows.length === 0) {
      console.error("[webhook] Cannot find user for subscription:", subscription.id)
      return
    }

    await syncStripeSubscription(userRows[0].id as string, subscription.id)
    return
  }

  await syncStripeSubscription(userId, subscription.id)

  console.log(`[webhook] Subscription updated for user ${userId}`)
}

/**
 * Handle customer.subscription.deleted
 * Downgrades the user to the free tier
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[webhook] Processing subscription deleted:", subscription.id)

  let userId = subscription.metadata?.userId

  if (!userId) {
    // Try to find user by subscription ID
    const userRows = await sql`
      SELECT id FROM users WHERE stripe_subscription_id = ${subscription.id}
      UNION
      SELECT user_id as id FROM platform_clients WHERE stripe_subscription_id = ${subscription.id}
      LIMIT 1
    `

    if (userRows.length === 0) {
      console.error("[webhook] Cannot find user for deleted subscription:", subscription.id)
      return
    }

    userId = userRows[0].id as string
  }

  // Downgrade to free tier
  await downgradeToFreeTier(userId)

  // Log the downgrade
  try {
    await sql`
      INSERT INTO subscription_events (
        user_id,
        event_type,
        stripe_event_id,
        metadata
      ) VALUES (
        ${userId},
        'subscription_deleted',
        ${subscription.id},
        ${JSON.stringify({ reason: subscription.cancellation_details?.reason })}
      )
    `
  } catch (logError) {
    console.warn("[webhook] Failed to log subscription event:", logError)
  }

  console.log(`[webhook] Subscription deleted, user ${userId} downgraded to free`)
}

/**
 * Handle invoice.payment_failed
 * Marks the subscription as past_due
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("[webhook] Processing payment failed:", invoice.id)

  const subscriptionId = invoice.subscription as string | null
  if (!subscriptionId) return

  // Find user by subscription ID
  const userRows = await sql`
    SELECT id FROM users WHERE stripe_subscription_id = ${subscriptionId}
    UNION
    SELECT user_id as id FROM platform_clients WHERE stripe_subscription_id = ${subscriptionId}
    LIMIT 1
  `

  if (userRows.length === 0) {
    console.error("[webhook] Cannot find user for failed payment")
    return
  }

  const userId = userRows[0].id as string

  // Update subscription status to past_due
  await sql`
    UPDATE users SET
      subscription_status = 'past_due',
      updated_at = NOW()
    WHERE id = ${userId}
  `

  // Log the event
  try {
    await sql`
      INSERT INTO subscription_events (
        user_id,
        event_type,
        stripe_event_id,
        metadata
      ) VALUES (
        ${userId},
        'payment_failed',
        ${invoice.id},
        ${JSON.stringify({
          amountDue: invoice.amount_due,
          attemptCount: invoice.attempt_count,
        })}
      )
    `
  } catch (logError) {
    console.warn("[webhook] Failed to log subscription event:", logError)
  }

  console.log(`[webhook] Payment failed for user ${userId}`)
}

/**
 * Handle invoice.payment_succeeded
 * Updates subscription status back to active
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("[webhook] Processing payment succeeded:", invoice.id)

  const subscriptionId = invoice.subscription as string | null
  if (!subscriptionId) return

  // Find user by subscription ID
  const userRows = await sql`
    SELECT id FROM users WHERE stripe_subscription_id = ${subscriptionId}
    UNION
    SELECT user_id as id FROM platform_clients WHERE stripe_subscription_id = ${subscriptionId}
    LIMIT 1
  `

  if (userRows.length === 0) return

  const userId = userRows[0].id as string

  // Update subscription status to active
  await sql`
    UPDATE users SET
      subscription_status = 'active',
      updated_at = NOW()
    WHERE id = ${userId}
  `

  console.log(`[webhook] Payment succeeded for user ${userId}`)
}

/**
 * Handle invoice.paid
 * More reliable than payment_succeeded for subscription renewals
 * Updates subscription status and syncs billing period
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("[webhook] Processing invoice paid:", invoice.id)

  const subscriptionId = invoice.subscription as string | null
  if (!subscriptionId) return

  // Find user by subscription ID
  const userRows = await sql`
    SELECT id FROM users WHERE stripe_subscription_id = ${subscriptionId}
    UNION
    SELECT user_id as id FROM platform_clients WHERE stripe_subscription_id = ${subscriptionId}
    LIMIT 1
  `

  if (userRows.length === 0) {
    console.log("[webhook] No user found for invoice, checking by customer ID")

    // Try to find by customer ID
    const customerId = invoice.customer as string
    const customerRows = await sql`
      SELECT id FROM users WHERE stripe_customer_id = ${customerId}
      UNION
      SELECT user_id as id FROM platform_clients WHERE stripe_customer_id = ${customerId}
      LIMIT 1
    `

    if (customerRows.length === 0) return

    const userId = customerRows[0].id as string

    // Update user with subscription ID and active status
    await sql`
      UPDATE users SET
        stripe_subscription_id = ${subscriptionId},
        subscription_status = 'active',
        updated_at = NOW()
      WHERE id = ${userId}
    `

    console.log(`[webhook] Invoice paid - linked subscription ${subscriptionId} to user ${userId}`)
    return
  }

  const userId = userRows[0].id as string

  // Update subscription status to active (handles renewals after past_due)
  await sql`
    UPDATE users SET
      subscription_status = 'active',
      updated_at = NOW()
    WHERE id = ${userId}
  `

  // Log successful renewal
  try {
    await sql`
      INSERT INTO subscription_events (
        user_id,
        event_type,
        stripe_event_id,
        metadata
      ) VALUES (
        ${userId},
        'invoice_paid',
        ${invoice.id},
        ${JSON.stringify({
          amountPaid: invoice.amount_paid,
          billingReason: invoice.billing_reason,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
        })}
      )
    `
  } catch (logError) {
    console.warn("[webhook] Failed to log invoice paid event:", logError)
  }

  console.log(`[webhook] Invoice paid for user ${userId}, billing reason: ${invoice.billing_reason}`)
}

/**
 * Handle customer.created
 * Links new Stripe customer to user if metadata is present
 */
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log("[webhook] Processing customer created:", customer.id)

  const userId = customer.metadata?.userId
  if (!userId) return

  await updateStripeCustomerId(userId, customer.id)

  console.log(`[webhook] Customer ${customer.id} linked to user ${userId}`)
}
