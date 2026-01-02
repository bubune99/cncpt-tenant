/**
 * Subscription Tier Management Functions
 * CRUD operations for managing platform subscription tiers
 */

import { sql } from "@/lib/neon"
import type {
  SubscriptionTier,
  CreateTierInput,
  UpdateTierInput,
  TierLimits,
} from "@/types/admin"

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapRowToTier(row: Record<string, unknown>): SubscriptionTier {
  return {
    id: row.id as string,
    name: row.name as string,
    displayName: row.display_name as string,
    description: row.description as string | null,
    priceMonthly: parseFloat(row.price_monthly as string),
    priceYearly: row.price_yearly ? parseFloat(row.price_yearly as string) : null,
    currency: row.currency as string,
    features: (row.features as string[]) || [],
    limits: (row.limits as TierLimits) || {
      storage_gb: 0,
      pages: 0,
      posts: 0,
      custom_domains: 0,
      team_members: 0,
    },
    trialDays: row.trial_days as number,
    sortOrder: row.sort_order as number,
    isActive: row.is_active as boolean,
    stripePriceIdMonthly: row.stripe_price_id_monthly as string | null,
    stripePriceIdYearly: row.stripe_price_id_yearly as string | null,
    stripeProductId: row.stripe_product_id as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all subscription tiers
 * @param includeInactive - Whether to include inactive tiers (default: false)
 */
export async function getAllTiers(includeInactive = false): Promise<SubscriptionTier[]> {
  try {
    let rows
    if (includeInactive) {
      rows = await sql`
        SELECT * FROM subscription_tiers
        ORDER BY sort_order ASC, created_at ASC
      `
    } else {
      rows = await sql`
        SELECT * FROM subscription_tiers
        WHERE is_active = true
        ORDER BY sort_order ASC, created_at ASC
      `
    }
    return rows.map(mapRowToTier)
  } catch (error) {
    console.error("[tiers] Error fetching all tiers:", error)
    throw new Error("Failed to fetch subscription tiers")
  }
}

/**
 * Get a single tier by ID
 */
export async function getTierById(tierId: string): Promise<SubscriptionTier | null> {
  try {
    const rows = await sql`
      SELECT * FROM subscription_tiers
      WHERE id = ${tierId}
    `
    if (rows.length === 0) return null
    return mapRowToTier(rows[0])
  } catch (error) {
    console.error("[tiers] Error fetching tier by ID:", error)
    throw new Error("Failed to fetch subscription tier")
  }
}

/**
 * Get a tier by its unique name
 */
export async function getTierByName(name: string): Promise<SubscriptionTier | null> {
  try {
    const rows = await sql`
      SELECT * FROM subscription_tiers
      WHERE name = ${name}
    `
    if (rows.length === 0) return null
    return mapRowToTier(rows[0])
  } catch (error) {
    console.error("[tiers] Error fetching tier by name:", error)
    throw new Error("Failed to fetch subscription tier")
  }
}

/**
 * Get count of clients using a specific tier
 */
export async function getTierClientCount(tierId: string): Promise<number> {
  try {
    const rows = await sql`
      SELECT COUNT(*) as count FROM platform_clients
      WHERE tier_id = ${tierId}
    `
    return parseInt(rows[0].count as string, 10)
  } catch (error) {
    console.error("[tiers] Error counting tier clients:", error)
    return 0
  }
}

/**
 * Get all tiers with their client counts
 */
export async function getTiersWithCounts(): Promise<(SubscriptionTier & { clientCount: number })[]> {
  try {
    const rows = await sql`
      SELECT
        t.*,
        COALESCE(COUNT(c.id), 0) as client_count
      FROM subscription_tiers t
      LEFT JOIN platform_clients c ON c.tier_id = t.id
      GROUP BY t.id
      ORDER BY t.sort_order ASC, t.created_at ASC
    `
    return rows.map((row) => ({
      ...mapRowToTier(row),
      clientCount: parseInt(row.client_count as string, 10),
    }))
  } catch (error) {
    console.error("[tiers] Error fetching tiers with counts:", error)
    throw new Error("Failed to fetch subscription tiers")
  }
}

// ============================================
// WRITE OPERATIONS
// ============================================

/**
 * Create a new subscription tier
 */
export async function createTier(data: CreateTierInput): Promise<SubscriptionTier> {
  try {
    // Check if name already exists
    const existing = await getTierByName(data.name)
    if (existing) {
      throw new Error(`A tier with the name "${data.name}" already exists`)
    }

    const rows = await sql`
      INSERT INTO subscription_tiers (
        name,
        display_name,
        description,
        price_monthly,
        price_yearly,
        currency,
        features,
        limits,
        trial_days,
        sort_order,
        is_active
      ) VALUES (
        ${data.name},
        ${data.displayName},
        ${data.description || null},
        ${data.priceMonthly},
        ${data.priceYearly || null},
        ${data.currency || 'USD'},
        ${JSON.stringify(data.features)},
        ${JSON.stringify(data.limits)},
        ${data.trialDays ?? 14},
        ${data.sortOrder ?? 0},
        ${data.isActive ?? true}
      )
      RETURNING *
    `
    return mapRowToTier(rows[0])
  } catch (error) {
    console.error("[tiers] Error creating tier:", error)
    if (error instanceof Error) throw error
    throw new Error("Failed to create subscription tier")
  }
}

/**
 * Update an existing subscription tier
 */
export async function updateTier(
  tierId: string,
  data: UpdateTierInput
): Promise<SubscriptionTier> {
  try {
    // Fetch current tier to merge limits
    const current = await getTierById(tierId)
    if (!current) {
      throw new Error("Subscription tier not found")
    }

    // Merge limits if partial update
    const mergedLimits = data.limits
      ? { ...current.limits, ...data.limits }
      : current.limits

    const rows = await sql`
      UPDATE subscription_tiers SET
        display_name = COALESCE(${data.displayName ?? null}, display_name),
        description = COALESCE(${data.description ?? null}, description),
        price_monthly = COALESCE(${data.priceMonthly ?? null}, price_monthly),
        price_yearly = COALESCE(${data.priceYearly ?? null}, price_yearly),
        currency = COALESCE(${data.currency ?? null}, currency),
        features = COALESCE(${data.features ? JSON.stringify(data.features) : null}, features),
        limits = ${JSON.stringify(mergedLimits)},
        trial_days = COALESCE(${data.trialDays ?? null}, trial_days),
        sort_order = COALESCE(${data.sortOrder ?? null}, sort_order),
        is_active = COALESCE(${data.isActive ?? null}, is_active),
        stripe_price_id_monthly = COALESCE(${data.stripePriceIdMonthly ?? null}, stripe_price_id_monthly),
        stripe_price_id_yearly = COALESCE(${data.stripePriceIdYearly ?? null}, stripe_price_id_yearly),
        stripe_product_id = COALESCE(${data.stripeProductId ?? null}, stripe_product_id),
        updated_at = NOW()
      WHERE id = ${tierId}
      RETURNING *
    `

    if (rows.length === 0) {
      throw new Error("Subscription tier not found")
    }

    return mapRowToTier(rows[0])
  } catch (error) {
    console.error("[tiers] Error updating tier:", error)
    if (error instanceof Error) throw error
    throw new Error("Failed to update subscription tier")
  }
}

/**
 * Delete a subscription tier (soft delete by deactivating)
 * Hard delete only if no clients are using it
 */
export async function deleteTier(tierId: string): Promise<void> {
  try {
    // Check if any clients are using this tier
    const clientCount = await getTierClientCount(tierId)

    if (clientCount > 0) {
      // Soft delete - just deactivate
      await sql`
        UPDATE subscription_tiers
        SET is_active = false, updated_at = NOW()
        WHERE id = ${tierId}
      `
    } else {
      // Hard delete - no clients using it
      await sql`
        DELETE FROM subscription_tiers
        WHERE id = ${tierId}
      `
    }
  } catch (error) {
    console.error("[tiers] Error deleting tier:", error)
    throw new Error("Failed to delete subscription tier")
  }
}

/**
 * Toggle tier active status
 */
export async function toggleTierActive(tierId: string): Promise<SubscriptionTier> {
  try {
    const rows = await sql`
      UPDATE subscription_tiers
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = ${tierId}
      RETURNING *
    `
    if (rows.length === 0) {
      throw new Error("Subscription tier not found")
    }
    return mapRowToTier(rows[0])
  } catch (error) {
    console.error("[tiers] Error toggling tier active status:", error)
    throw new Error("Failed to toggle subscription tier status")
  }
}

/**
 * Reorder tiers by updating sort_order
 */
export async function reorderTiers(tierIds: string[]): Promise<void> {
  try {
    // Update each tier's sort_order based on position in array
    for (let i = 0; i < tierIds.length; i++) {
      await sql`
        UPDATE subscription_tiers
        SET sort_order = ${i}, updated_at = NOW()
        WHERE id = ${tierIds[i]}
      `
    }
  } catch (error) {
    console.error("[tiers] Error reordering tiers:", error)
    throw new Error("Failed to reorder subscription tiers")
  }
}
