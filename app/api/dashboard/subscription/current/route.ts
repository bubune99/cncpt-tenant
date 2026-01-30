/**
 * Current Subscription API
 * Returns the authenticated user's current subscription and tier info
 */

import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { getUserSubscription, getSubdomainUsage } from "@/lib/subscription"

/**
 * GET /api/dashboard/subscription/current
 * Get the current user's subscription details
 */
export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await getUserSubscription(user.id)
    const usage = await getSubdomainUsage(user.id)

    return NextResponse.json({
      tierId: subscription?.tierId || null,
      tierName: subscription?.tierName || "free",
      tierDisplayName: subscription?.tierDisplayName || "Free",
      priceMonthly: subscription?.priceMonthly || 0,
      limits: subscription?.limits || {
        storage_gb: 0.1,
        pages: 5,
        posts: 10,
        custom_domains: 0,
        team_members: 0,
      },
      features: subscription?.features || [],
      stripeCustomerId: subscription?.stripeCustomerId || null,
      stripeSubscriptionId: subscription?.stripeSubscriptionId || null,
      subscriptionStatus: subscription?.subscriptionStatus || "none",
      currentPeriodEnd: subscription?.currentPeriodEnd || null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      usage: {
        subdomains: {
          used: usage.used,
          limit: usage.limit,
          remaining: usage.remaining,
          canCreate: usage.canCreate,
        },
      },
    })
  } catch (error) {
    console.error("[subscription-current] Error:", error)
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    )
  }
}
