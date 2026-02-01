/**
 * Credit Pack Purchase API
 * Creates Stripe checkout session for credit pack purchase
 *
 * POST /api/credits/purchase
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe"
import { getCreditPack } from "@/lib/ai-credits"
import { sql } from "@/lib/neon"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { packId, subdomainId } = body

    if (!packId) {
      return NextResponse.json({ error: "Pack ID required" }, { status: 400 })
    }

    // Get credit pack details
    const pack = await getCreditPack(packId)
    if (!pack) {
      return NextResponse.json({ error: "Credit pack not found" }, { status: 404 })
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(
      user.email,
      user.name || undefined,
      user.id
    )

    // Ensure we have a Stripe price for this pack
    let priceId = pack.stripePriceId

    if (!priceId) {
      // Create product and price in Stripe on the fly
      const product = await stripe.products.create({
        name: pack.displayName,
        description: pack.description || `${pack.totalCredits} AI Credits`,
        metadata: {
          platform: "cncpt-web-hosting",
          packId: pack.id,
          packName: pack.name,
          credits: pack.credits.toString(),
          bonusCredits: pack.bonusCredits.toString(),
          totalCredits: pack.totalCredits.toString(),
        },
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceCents,
        currency: pack.currency.toLowerCase(),
        metadata: {
          platform: "cncpt-web-hosting",
          packId: pack.id,
          packName: pack.name,
        },
      })

      priceId = price.id

      // Update pack with Stripe IDs
      await sql`
        UPDATE ai_credit_packs
        SET stripe_product_id = ${product.id}, stripe_price_id = ${price.id}, updated_at = NOW()
        WHERE id = ${pack.id}::uuid
      `
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?credits=success&pack=${pack.name}`,
      cancel_url: `${baseUrl}/dashboard?credits=cancelled`,
      metadata: {
        platform: "cncpt-web-hosting",
        type: "credit_purchase",
        userId: user.id,
        userEmail: user.email,
        packId: pack.id,
        packName: pack.name,
        credits: pack.credits.toString(),
        bonusCredits: pack.bonusCredits.toString(),
        totalCredits: pack.totalCredits.toString(),
        subdomainId: subdomainId || "",
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error("[credits-purchase] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/credits/purchase
 * Get available credit packs for purchase
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get all active credit packs
    const packs = await sql`
      SELECT
        id, name, display_name, description,
        credits, bonus_credits, (credits + bonus_credits) as total_credits,
        price_cents, currency, badge, is_popular, sort_order
      FROM ai_credit_packs
      WHERE is_active = true
      ORDER BY sort_order ASC
    `

    return NextResponse.json({
      packs: packs.map(pack => ({
        id: pack.id,
        name: pack.name,
        displayName: pack.display_name,
        description: pack.description,
        credits: pack.credits,
        bonusCredits: pack.bonus_credits,
        totalCredits: pack.total_credits,
        priceCents: pack.price_cents,
        priceFormatted: `$${(pack.price_cents / 100).toFixed(2)}`,
        currency: pack.currency,
        badge: pack.badge,
        isPopular: pack.is_popular,
      })),
    })
  } catch (error) {
    console.error("[credits-purchase] GET Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch credit packs" },
      { status: 500 }
    )
  }
}
