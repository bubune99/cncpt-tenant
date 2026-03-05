/**
 * Credits Purchase API
 *
 * GET  /api/credits/purchase - Get available credit packs
 * POST /api/credits/purchase - Create Stripe checkout session for a credit pack
 */

import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { getCreditPacks } from '@/lib/ai-credits'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stackUser = await stackServerApp.getUser()

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const creditPacks = await getCreditPacks()

    const packs = creditPacks.map((pack) => ({
      id: pack.id,
      name: pack.name,
      displayName: pack.displayName,
      description: pack.description || '',
      credits: pack.credits,
      bonusCredits: pack.bonusCredits,
      totalCredits: pack.totalCredits,
      priceCents: pack.priceCents,
      priceFormatted: `$${(pack.priceCents / 100).toFixed(2)}`,
      badge: pack.badge,
      isPopular: pack.isPopular,
    }))

    return NextResponse.json({ packs })
  } catch (error) {
    console.error('[credits/purchase] Error fetching credit packs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit packs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser()

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packId } = body

    if (!packId) {
      return NextResponse.json(
        { error: 'Missing packId' },
        { status: 400 }
      )
    }

    const creditPacks = await getCreditPacks()
    const pack = creditPacks.find((p) => p.id === packId)

    if (!pack) {
      return NextResponse.json(
        { error: 'Credit pack not found' },
        { status: 400 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: stackUser.primaryEmail || undefined,
      line_items: [
        {
          ...(pack.stripePriceId
            ? { price: pack.stripePriceId }
            : {
                price_data: {
                  currency: pack.currency || 'usd',
                  product_data: {
                    name: pack.displayName,
                    description: `${pack.totalCredits} AI Credits`,
                  },
                  unit_amount: pack.priceCents,
                },
              }),
          quantity: 1,
        },
      ],
      metadata: {
        userId: stackUser.id,
        packId: pack.id,
        credits: String(pack.totalCredits),
        type: 'ai_credit_purchase',
      },
      success_url: `${baseUrl}/dashboard?credits=success`,
      cancel_url: `${baseUrl}/dashboard?credits=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[credits/purchase] Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
