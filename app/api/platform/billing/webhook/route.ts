/**
 * PLATFORM billing webhook (tenant-of-platform subscriptions).
 *
 * Handles the PLATFORM Stripe account's subscription lifecycle and maps it to
 * each tenant's plan:
 *   customer.subscription.created / updated → set tenant tier (by price id) +
 *     status, which applies that tier's limits (quotas + rate-limit feed).
 *   customer.subscription.deleted          → clear tier (revert to default).
 *
 * Keys come from env (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET) via
 * lib/stripe.ts. Until the platform Stripe account is confirmed and those env
 * vars are set, this endpoint returns 503 and does nothing — it cannot affect
 * any tenant. It performs NO Stripe writes (no product/price creation).
 *
 * Tenant resolution: subscription/customer metadata.subdomain (set when the
 * checkout session is created — see docs/platform-stripe-setup.md).
 */

import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { constructWebhookEvent } from "@/lib/stripe"
import { logPlatformActivity } from "@/lib/super-admin"
import {
  applyTenantTier,
  findTierByPriceId,
  resolveSubdomainFromMetadata,
} from "@/lib/cms/billing/apply-tier"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  // Guard: if platform Stripe isn't configured yet, no-op safely.
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Platform billing not configured", configured: false },
      { status: 503 },
    )
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(payload, signature)
  } catch (error) {
    console.error("[platform/billing/webhook] signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        // Customer metadata may carry the subdomain when the sub metadata
        // doesn't. Guard against an expanded DeletedCustomer (no metadata).
        const customerMeta =
          typeof sub.customer === "object" && sub.customer && !("deleted" in sub.customer)
            ? (sub.customer.metadata as Record<string, string> | undefined)
            : undefined
        const subdomain =
          resolveSubdomainFromMetadata(sub.metadata as Record<string, string>) ||
          resolveSubdomainFromMetadata(customerMeta)

        const priceId = sub.items?.data?.[0]?.price?.id || ""
        const tier = priceId ? await findTierByPriceId(priceId) : null

        if (subdomain && tier) {
          const applied = await applyTenantTier({
            subdomain,
            tierId: tier.id,
            status: sub.status,
          })
          await logPlatformActivity(
            "platform_billing.subscription.apply",
            { subdomain, tier: tier.name, priceId, status: sub.status, applied },
            { targetType: "subdomain", targetId: subdomain },
          )
        } else {
          await logPlatformActivity(
            "platform_billing.subscription.unmatched",
            { subdomain, priceId, hasTier: Boolean(tier) },
            { targetType: "subscription", targetId: sub.id },
          )
        }
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const subdomain = resolveSubdomainFromMetadata(sub.metadata as Record<string, string>)
        if (subdomain) {
          await applyTenantTier({ subdomain, tierId: null, status: "canceled" })
          await logPlatformActivity(
            "platform_billing.subscription.cancel",
            { subdomain, subscriptionId: sub.id },
            { targetType: "subdomain", targetId: subdomain },
          )
        }
        break
      }

      default:
        // Ignore unrelated events.
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[platform/billing/webhook] handler error:", error)
    // Return 200 so Stripe doesn't infinitely retry on a non-signature error,
    // but log it for the owner to inspect via activity log.
    return NextResponse.json({ received: true, handlerError: true })
  }
}
