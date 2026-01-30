/**
 * Subscription Management Utilities
 * Functions for managing user subscriptions, tier limits, and Stripe sync
 */

import { sql } from "@/lib/neon"
import { stripe, getSubscription } from "@/lib/stripe"
import type { SubscriptionTier, TierLimits } from "@/types/admin"

// ============================================
// TYPES
// ============================================

export interface UserSubscription {
  tierId: string | null
  tierName: string
  tierDisplayName: string
  priceMonthly: number
  limits: TierLimits
  features: string[]
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  subscriptionStatus: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export interface SubdomainUsage {
  used: number
  limit: number
  remaining: number
  canCreate: boolean
}

// ============================================
// USER SUBSCRIPTION FUNCTIONS
// ============================================

/**
 * Get a user's current subscription and tier info
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const rows = await sql`
      SELECT
        u.stripe_customer_id,
        u.stripe_subscription_id,
        u.subscription_status,
        u.tier_id,
        t.name as tier_name,
        t.display_name as tier_display_name,
        t.price_monthly,
        t.limits,
        t.features
      FROM users u
      LEFT JOIN subscription_tiers t ON u.tier_id = t.id
      WHERE u.id = ${userId}
    `

    if (rows.length === 0) {
      // Try to get from platform_clients table (legacy)
      const clientRows = await sql`
        SELECT
          c.stripe_customer_id,
          c.stripe_subscription_id,
          c.tier_id,
          t.name as tier_name,
          t.display_name as tier_display_name,
          t.price_monthly,
          t.limits,
          t.features
        FROM platform_clients c
        LEFT JOIN subscription_tiers t ON c.tier_id = t.id
        WHERE c.user_id = ${userId}
      `

      if (clientRows.length === 0) {
        // Return free tier defaults
        return getFreeTierSubscription()
      }

      const row = clientRows[0]
      return {
        tierId: row.tier_id as string | null,
        tierName: (row.tier_name as string) || "free",
        tierDisplayName: (row.tier_display_name as string) || "Free",
        priceMonthly: parseFloat((row.price_monthly as string) || "0"),
        limits: (row.limits as TierLimits) || getFreeTierLimits(),
        features: (row.features as string[]) || [],
        stripeCustomerId: row.stripe_customer_id as string | null,
        stripeSubscriptionId: row.stripe_subscription_id as string | null,
        subscriptionStatus: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }
    }

    const row = rows[0]
    let currentPeriodEnd: Date | null = null
    let cancelAtPeriodEnd = false

    // Get additional info from Stripe if subscription exists
    if (row.stripe_subscription_id) {
      const subscription = await getSubscription(row.stripe_subscription_id as string)
      if (subscription) {
        currentPeriodEnd = new Date(subscription.current_period_end * 1000)
        cancelAtPeriodEnd = subscription.cancel_at_period_end
      }
    }

    return {
      tierId: row.tier_id as string | null,
      tierName: (row.tier_name as string) || "free",
      tierDisplayName: (row.tier_display_name as string) || "Free",
      priceMonthly: parseFloat((row.price_monthly as string) || "0"),
      limits: (row.limits as TierLimits) || getFreeTierLimits(),
      features: (row.features as string[]) || [],
      stripeCustomerId: row.stripe_customer_id as string | null,
      stripeSubscriptionId: row.stripe_subscription_id as string | null,
      subscriptionStatus: (row.subscription_status as string) || "none",
      currentPeriodEnd,
      cancelAtPeriodEnd,
    }
  } catch (error) {
    console.error("[subscription] Error getting user subscription:", error)
    return getFreeTierSubscription()
  }
}

/**
 * Get free tier default subscription
 */
function getFreeTierSubscription(): UserSubscription {
  return {
    tierId: null,
    tierName: "free",
    tierDisplayName: "Free",
    priceMonthly: 0,
    limits: getFreeTierLimits(),
    features: ["1 subdomain", "Basic analytics", "Community support"],
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: "none",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  }
}

/**
 * Get free tier limits
 */
function getFreeTierLimits(): TierLimits {
  return {
    storage_gb: 0.1,
    pages: 5,
    posts: 10,
    custom_domains: 0,
    team_members: 0,
  }
}

// ============================================
// SUBDOMAIN LIMIT FUNCTIONS
// ============================================

/**
 * Count user's current subdomains
 */
export async function countUserSubdomains(userId: string): Promise<number> {
  try {
    const rows = await sql`
      SELECT COUNT(*) as count
      FROM subdomains
      WHERE user_id = ${userId}
    `
    return parseInt(rows[0].count as string, 10)
  } catch (error) {
    console.error("[subscription] Error counting subdomains:", error)
    return 0
  }
}

/**
 * Get subdomain usage for a user
 */
export async function getSubdomainUsage(userId: string): Promise<SubdomainUsage> {
  const subscription = await getUserSubscription(userId)
  const used = await countUserSubdomains(userId)

  // Get subdomain limit from tier
  let limit = 1 // Free tier default

  if (subscription?.limits) {
    // Check if limits has subdomains field, otherwise use a default mapping
    const tierLimits = subscription.limits as TierLimits & { subdomains?: number }
    if (typeof tierLimits.subdomains === "number") {
      limit = tierLimits.subdomains
    } else {
      // Map tier name to subdomain limits
      switch (subscription.tierName) {
        case "pro":
          limit = 5
          break
        case "enterprise":
          limit = -1 // Unlimited
          break
        default:
          limit = 1
      }
    }
  }

  const isUnlimited = limit === -1
  const remaining = isUnlimited ? 999 : Math.max(0, limit - used)
  const canCreate = isUnlimited || remaining > 0

  return {
    used,
    limit,
    remaining,
    canCreate,
  }
}

/**
 * Check if user can create a new subdomain
 */
export async function canCreateSubdomain(userId: string): Promise<{
  allowed: boolean
  reason?: string
  usage: SubdomainUsage
}> {
  const usage = await getSubdomainUsage(userId)

  if (!usage.canCreate) {
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${usage.limit} subdomain${usage.limit !== 1 ? "s" : ""}. Upgrade your plan to create more.`,
      usage,
    }
  }

  return { allowed: true, usage }
}

// ============================================
// TIER FUNCTIONS
// ============================================

/**
 * Get all available subscription tiers
 */
export async function getAvailableTiers(): Promise<SubscriptionTier[]> {
  try {
    const rows = await sql`
      SELECT * FROM subscription_tiers
      WHERE is_active = true
      ORDER BY sort_order ASC, price_monthly ASC
    `

    return rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      displayName: row.display_name as string,
      description: row.description as string | null,
      priceMonthly: parseFloat(row.price_monthly as string),
      priceYearly: row.price_yearly ? parseFloat(row.price_yearly as string) : null,
      currency: row.currency as string,
      features: (row.features as string[]) || [],
      limits: (row.limits as TierLimits) || getFreeTierLimits(),
      trialDays: (row.trial_days as number) || 0,
      sortOrder: row.sort_order as number,
      isActive: row.is_active as boolean,
      stripePriceIdMonthly: row.stripe_price_id_monthly as string | null,
      stripePriceIdYearly: row.stripe_price_id_yearly as string | null,
      stripeProductId: row.stripe_product_id as string | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }))
  } catch (error) {
    console.error("[subscription] Error getting tiers:", error)
    return []
  }
}

/**
 * Get a tier by ID
 */
export async function getTierById(tierId: string): Promise<SubscriptionTier | null> {
  try {
    const rows = await sql`
      SELECT * FROM subscription_tiers
      WHERE id = ${tierId}
    `

    if (rows.length === 0) return null

    const row = rows[0]
    return {
      id: row.id as string,
      name: row.name as string,
      displayName: row.display_name as string,
      description: row.description as string | null,
      priceMonthly: parseFloat(row.price_monthly as string),
      priceYearly: row.price_yearly ? parseFloat(row.price_yearly as string) : null,
      currency: row.currency as string,
      features: (row.features as string[]) || [],
      limits: (row.limits as TierLimits) || getFreeTierLimits(),
      trialDays: (row.trial_days as number) || 0,
      sortOrder: row.sort_order as number,
      isActive: row.is_active as boolean,
      stripePriceIdMonthly: row.stripe_price_id_monthly as string | null,
      stripePriceIdYearly: row.stripe_price_id_yearly as string | null,
      stripeProductId: row.stripe_product_id as string | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }
  } catch (error) {
    console.error("[subscription] Error getting tier:", error)
    return null
  }
}

/**
 * Get free tier
 */
export async function getFreeTier(): Promise<SubscriptionTier | null> {
  try {
    const rows = await sql`
      SELECT * FROM subscription_tiers
      WHERE name = 'free' AND is_active = true
    `

    if (rows.length === 0) return null

    const row = rows[0]
    return {
      id: row.id as string,
      name: row.name as string,
      displayName: row.display_name as string,
      description: row.description as string | null,
      priceMonthly: parseFloat(row.price_monthly as string),
      priceYearly: row.price_yearly ? parseFloat(row.price_yearly as string) : null,
      currency: row.currency as string,
      features: (row.features as string[]) || [],
      limits: (row.limits as TierLimits) || getFreeTierLimits(),
      trialDays: (row.trial_days as number) || 0,
      sortOrder: row.sort_order as number,
      isActive: row.is_active as boolean,
      stripePriceIdMonthly: row.stripe_price_id_monthly as string | null,
      stripePriceIdYearly: row.stripe_price_id_yearly as string | null,
      stripeProductId: row.stripe_product_id as string | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }
  } catch (error) {
    console.error("[subscription] Error getting free tier:", error)
    return null
  }
}

// ============================================
// STRIPE SYNC FUNCTIONS
// ============================================

/**
 * Sync Stripe subscription to database
 */
export async function syncStripeSubscription(
  userId: string,
  subscriptionId: string
): Promise<void> {
  try {
    const subscription = await getSubscription(subscriptionId)
    if (!subscription) {
      console.error("[subscription] Subscription not found:", subscriptionId)
      return
    }

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price?.id
    if (!priceId) {
      console.error("[subscription] No price found in subscription")
      return
    }

    // Find the tier with this Stripe price ID
    const tierRows = await sql`
      SELECT id FROM subscription_tiers
      WHERE stripe_price_id_monthly = ${priceId}
         OR stripe_price_id_yearly = ${priceId}
    `

    const tierId = tierRows.length > 0 ? (tierRows[0].id as string) : null

    // Map Stripe status to our status
    let status = "active"
    if (subscription.status === "trialing") status = "trial"
    else if (subscription.status === "past_due") status = "past_due"
    else if (subscription.status === "canceled") status = "cancelled"
    else if (subscription.status === "unpaid") status = "suspended"

    // Update user's subscription info - try users table first
    const updateResult = await sql`
      UPDATE users SET
        stripe_subscription_id = ${subscriptionId},
        tier_id = COALESCE(${tierId}, tier_id),
        subscription_status = ${status},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id
    `

    // If no user found, try platform_clients
    if (updateResult.length === 0) {
      await sql`
        UPDATE platform_clients SET
          stripe_subscription_id = ${subscriptionId},
          tier_id = COALESCE(${tierId}, tier_id),
          updated_at = NOW()
        WHERE user_id = ${userId}
      `
    }
  } catch (error) {
    console.error("[subscription] Error syncing subscription:", error)
  }
}

/**
 * Update user's Stripe customer ID
 */
export async function updateStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  try {
    // Try users table first
    const updateResult = await sql`
      UPDATE users SET
        stripe_customer_id = ${stripeCustomerId},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id
    `

    // If no user found, try platform_clients
    if (updateResult.length === 0) {
      await sql`
        UPDATE platform_clients SET
          stripe_customer_id = ${stripeCustomerId},
          updated_at = NOW()
        WHERE user_id = ${userId}
      `
    }
  } catch (error) {
    console.error("[subscription] Error updating Stripe customer ID:", error)
  }
}

/**
 * Update user's tier directly (for webhook handling)
 */
export async function updateUserTier(
  userId: string,
  tierId: string,
  subscriptionStatus: string
): Promise<void> {
  try {
    // Try users table first
    const updateResult = await sql`
      UPDATE users SET
        tier_id = ${tierId},
        subscription_status = ${subscriptionStatus},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id
    `

    // If no user found, try platform_clients
    if (updateResult.length === 0) {
      await sql`
        UPDATE platform_clients SET
          tier_id = ${tierId},
          updated_at = NOW()
        WHERE user_id = ${userId}
      `
    }
  } catch (error) {
    console.error("[subscription] Error updating user tier:", error)
  }
}

/**
 * Downgrade user to free tier
 */
export async function downgradeToFreeTier(userId: string): Promise<void> {
  try {
    const freeTier = await getFreeTier()
    const freeTierId = freeTier?.id || null

    // Try users table first
    const updateResult = await sql`
      UPDATE users SET
        tier_id = ${freeTierId},
        stripe_subscription_id = NULL,
        subscription_status = 'none',
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id
    `

    // If no user found, try platform_clients
    if (updateResult.length === 0) {
      await sql`
        UPDATE platform_clients SET
          tier_id = ${freeTierId},
          stripe_subscription_id = NULL,
          updated_at = NOW()
        WHERE user_id = ${userId}
      `
    }
  } catch (error) {
    console.error("[subscription] Error downgrading to free tier:", error)
  }
}
