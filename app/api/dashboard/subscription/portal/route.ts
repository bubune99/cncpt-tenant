/**
 * Stripe Customer Portal API
 * Opens the signed-in account's Stripe customer portal: change plan, update the card, see invoices.
 * Owner, 2026-11-22: "Wire them to the Stripe customer portal (I'll enable the portal in Stripe)".
 */

import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { createPortalSession } from "@/lib/stripe"
import { getUserSubscription } from "@/lib/subscription"
import { rootDomain, protocol } from "@/lib/utils"

export const dynamic = "force-dynamic"

/**
 * POST /api/dashboard/subscription/portal
 * 200 { url }                      the portal session to send the browser to
 * 401                              not signed in
 * 409 { code: "NO_BILLING_ACCOUNT" } the account has never paid, so Stripe has no customer for it yet
 * 502 { code: "PORTAL_UNAVAILABLE" } Stripe refused (most often: the portal is not switched on in Stripe yet)
 */
export async function POST() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subscription = await getUserSubscription(user.id)
  const customerId = subscription?.stripeCustomerId
  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account yet: choose a plan first", code: "NO_BILLING_ACCOUNT" },
      { status: 409 }
    )
  }

  try {
    const session = await createPortalSession(customerId, `${protocol}://${rootDomain}/dashboard?section=billing`)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[subscription-portal] Stripe refused the portal session:", error)
    return NextResponse.json(
      { error: "The billing portal could not be opened", code: "PORTAL_UNAVAILABLE" },
      { status: 502 }
    )
  }
}
