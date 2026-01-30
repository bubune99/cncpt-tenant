/**
 * Stripe Checkout Session API
 * Creates Stripe Checkout sessions for subscription upgrades
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { stripe, getOrCreateStripeCustomer, createCheckoutSession } from "@/lib/stripe"
import { getTierById, updateStripeCustomerId } from "@/lib/subscription"
import { rootDomain, protocol } from "@/lib/utils"

/**
 * POST /api/dashboard/subscription/checkout
 * Create a Stripe Checkout session for upgrading to a paid plan
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tierId, billingInterval = "monthly" } = body

    if (!tierId) {
      return NextResponse.json({ error: "Tier ID is required" }, { status: 400 })
    }

    // Get tier details
    const tier = await getTierById(tierId)
    if (!tier) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    // Check if this is a free tier
    if (tier.priceMonthly === 0) {
      return NextResponse.json(
        { error: "Cannot checkout for free tier" },
        { status: 400 }
      )
    }

    // Get the appropriate Stripe price ID
    const priceId =
      billingInterval === "yearly"
        ? tier.stripePriceIdYearly
        : tier.stripePriceIdMonthly

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe price not configured for ${tier.displayName} (${billingInterval})`,
          code: "STRIPE_NOT_CONFIGURED",
        },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(
      user.primaryEmail || "",
      user.displayName || undefined,
      user.id
    )

    // Save customer ID to database
    await updateStripeCustomerId(user.id, customer.id)

    // Build URLs
    const baseUrl = `${protocol}://${rootDomain}`
    const successUrl = `${baseUrl}/dashboard/create-subdomain?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/dashboard/create-subdomain?canceled=true`

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl,
      cancelUrl,
      trialDays: tier.trialDays > 0 ? tier.trialDays : undefined,
      metadata: {
        userId: user.id,
        tierId: tier.id,
        tierName: tier.name,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error("[checkout-api] Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dashboard/subscription/checkout
 * Verify a completed checkout session
 */
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    })

    // Verify the session belongs to this user
    const userId = session.metadata?.userId
    if (userId !== user.id) {
      return NextResponse.json(
        { error: "Session does not belong to this user" },
        { status: 403 }
      )
    }

    // Check session status
    if (session.status !== "complete") {
      return NextResponse.json(
        {
          error: "Checkout session not completed",
          status: session.status,
        },
        { status: 400 }
      )
    }

    // Get subscription details
    const subscription = session.subscription as Stripe.Subscription | null
    const tierId = session.metadata?.tierId
    const tierName = session.metadata?.tierName

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          }
        : null,
      tier: {
        id: tierId,
        name: tierName,
      },
    })
  } catch (error) {
    console.error("[checkout-api] Error verifying session:", error)
    return NextResponse.json(
      { error: "Failed to verify checkout session" },
      { status: 500 }
    )
  }
}

// Import Stripe types for type safety
import type Stripe from "stripe"
