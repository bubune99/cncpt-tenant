/**
 * AI Credit Pack Purchase API
 * POST: Create Stripe checkout session for credit pack purchase
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe"
import { getCreditPack, getCreditPacks } from "@/lib/ai-credits"
import { updateStripeCustomerId } from "@/lib/subscription"
import { rootDomain, protocol } from "@/lib/utils"

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/credits/purchase
 * List available credit packs
 */
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const onboardingOnly = searchParams.get("onboarding") === "true"

    const packs = await getCreditPacks({ onboardingOnly })

    return NextResponse.json({ packs })
  } catch (error) {
    console.error("[credits-purchase] Error getting packs:", error)
    return NextResponse.json(
      { error: "Failed to get credit packs" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboard/credits/purchase
 * Create Stripe checkout session for credit pack
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { packId, subdomainId, returnUrl } = body

    if (!packId) {
      return NextResponse.json(
        { error: "Pack ID is required" },
        { status: 400 }
      )
    }

    // Get pack details
    const pack = await getCreditPack(packId)
    if (!pack) {
      return NextResponse.json(
        { error: "Invalid credit pack" },
        { status: 400 }
      )
    }

    // Check if pack has Stripe price configured
    if (!pack.stripePriceId) {
      // Create checkout with price_data for packs without pre-configured Stripe prices
      const customer = await getOrCreateStripeCustomer(
        user.primaryEmail || "",
        user.displayName || undefined,
        user.id
      )

      await updateStripeCustomerId(user.id, customer.id)

      const baseUrl = `${protocol}://${rootDomain}`
      const successUrl = returnUrl
        ? `${baseUrl}${returnUrl}?credit_purchase=success&pack=${pack.name}`
        : `${baseUrl}/dashboard?credit_purchase=success&pack=${pack.name}`
      const cancelUrl = returnUrl
        ? `${baseUrl}${returnUrl}?credit_purchase=canceled`
        : `${baseUrl}/dashboard?credit_purchase=canceled`

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customer.id,
        line_items: [
          {
            price_data: {
              currency: pack.currency.toLowerCase(),
              product_data: {
                name: `${pack.displayName} - ${pack.totalCredits} AI Credits`,
                description: pack.description || `${pack.credits} credits + ${pack.bonusCredits} bonus`,
              },
              unit_amount: pack.priceCents,
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          type: "credit_pack",
          packId: pack.id,
          packName: pack.name,
          credits: pack.totalCredits.toString(),
          userId: user.id,
          subdomainId: subdomainId || "",
        },
      })

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      })
    }

    // Use pre-configured Stripe price
    const customer = await getOrCreateStripeCustomer(
      user.primaryEmail || "",
      user.displayName || undefined,
      user.id
    )

    await updateStripeCustomerId(user.id, customer.id)

    const baseUrl = `${protocol}://${rootDomain}`
    const successUrl = returnUrl
      ? `${baseUrl}${returnUrl}?credit_purchase=success&pack=${pack.name}`
      : `${baseUrl}/dashboard?credit_purchase=success&pack=${pack.name}`
    const cancelUrl = returnUrl
      ? `${baseUrl}${returnUrl}?credit_purchase=canceled`
      : `${baseUrl}/dashboard?credit_purchase=canceled`

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customer.id,
      line_items: [
        {
          price: pack.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "credit_pack",
        packId: pack.id,
        packName: pack.name,
        credits: pack.totalCredits.toString(),
        userId: user.id,
        subdomainId: subdomainId || "",
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error("[credits-purchase] Error creating checkout:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
