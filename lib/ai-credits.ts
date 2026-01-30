/**
 * AI Credits Management System
 * Handles credit balances, usage, purchases, and monthly allocations
 *
 * Credit Types:
 * - Monthly: From tier allocation, has rollover cap
 * - Purchased: From credit packs, NEVER expires
 *
 * Usage Priority: Monthly first (FIFO), then purchased
 */

import { sql } from "@/lib/neon"
import { hasUnlimitedAiCredits, getMonthlyCreditAllocation, getPendingCreditGrants, markCreditGrantApplied, markCreditGrantFailed } from "@/lib/user-overrides"

// ============================================
// TYPES
// ============================================

export interface CreditBalance {
  userId: string | null
  subdomainId: string | null
  monthlyBalance: number
  purchasedBalance: number
  totalBalance: number
  lifetimeAllocated: number
  lifetimePurchased: number
  lifetimeUsed: number
  lastAllocationDate: string | null
  monthlyAllocationAmount: number
  rolloverCap: number
}

export interface CreditPack {
  id: string
  name: string
  displayName: string
  description: string | null
  credits: number
  bonusCredits: number
  totalCredits: number
  priceCents: number
  currency: string
  stripeProductId: string | null
  stripePriceId: string | null
  badge: string | null
  isPopular: boolean
  sortOrder: number
  minTier: string
  showInOnboarding: boolean
}

export interface FeatureCost {
  feature: string
  displayName: string
  description: string | null
  category: string
  baseCost: number
  unitType: string
  minTier: string
}

export interface ModelTier {
  id: string
  name: string
  displayName: string
  description: string | null
  creditMultiplier: number
  models: string[]
  minTier: string
  isDefault: boolean
}

export interface UseCreditsParams {
  userId: string
  subdomainId?: string
  feature: string
  modelTier?: string
  amount?: number // Override calculated amount
  referenceId?: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface UseCreditsResult {
  success: boolean
  creditsUsed: number
  monthlyUsed: number
  purchasedUsed: number
  remainingMonthly: number
  remainingPurchased: number
  remainingTotal: number
  error?: string
}

export interface CheckCreditsResult {
  canUse: boolean
  creditCost: number
  monthlyBalance: number
  purchasedBalance: number
  totalBalance: number
  teamPoolBalance: number
  deficit: number
  error?: string
}

// ============================================
// BALANCE FUNCTIONS
// ============================================

/**
 * Get or create credit balance for a user
 */
export async function getUserCreditBalance(userId: string): Promise<CreditBalance> {
  try {
    // Try to get existing balance
    let rows = await sql`
      SELECT * FROM ai_credit_balances WHERE user_id = ${userId}
    `

    if (rows.length === 0) {
      // Create new balance record
      rows = await sql`
        INSERT INTO ai_credit_balances (user_id, monthly_balance, purchased_balance)
        VALUES (${userId}, 0, 0)
        RETURNING *
      `
    }

    const row = rows[0]
    return {
      userId: row.user_id as string,
      subdomainId: null,
      monthlyBalance: (row.monthly_balance as number) || 0,
      purchasedBalance: (row.purchased_balance as number) || 0,
      totalBalance: ((row.monthly_balance as number) || 0) + ((row.purchased_balance as number) || 0),
      lifetimeAllocated: (row.lifetime_allocated as number) || 0,
      lifetimePurchased: (row.lifetime_purchased as number) || 0,
      lifetimeUsed: (row.lifetime_used as number) || 0,
      lastAllocationDate: row.last_allocation_date as string | null,
      monthlyAllocationAmount: (row.monthly_allocation_amount as number) || 0,
      rolloverCap: (row.rollover_cap as number) || 0,
    }
  } catch (error) {
    console.error("[ai-credits] Error getting user balance:", error)
    return {
      userId,
      subdomainId: null,
      monthlyBalance: 0,
      purchasedBalance: 0,
      totalBalance: 0,
      lifetimeAllocated: 0,
      lifetimePurchased: 0,
      lifetimeUsed: 0,
      lastAllocationDate: null,
      monthlyAllocationAmount: 0,
      rolloverCap: 0,
    }
  }
}

/**
 * Get or create credit balance for a team/subdomain pool
 */
export async function getTeamCreditBalance(subdomainId: string): Promise<CreditBalance> {
  try {
    let rows = await sql`
      SELECT * FROM ai_credit_balances WHERE subdomain_id = ${subdomainId}::int
    `

    if (rows.length === 0) {
      rows = await sql`
        INSERT INTO ai_credit_balances (subdomain_id, monthly_balance, purchased_balance)
        VALUES (${subdomainId}::int, 0, 0)
        RETURNING *
      `
    }

    const row = rows[0]
    return {
      userId: null,
      subdomainId: row.subdomain_id as string,
      monthlyBalance: (row.monthly_balance as number) || 0,
      purchasedBalance: (row.purchased_balance as number) || 0,
      totalBalance: ((row.monthly_balance as number) || 0) + ((row.purchased_balance as number) || 0),
      lifetimeAllocated: (row.lifetime_allocated as number) || 0,
      lifetimePurchased: (row.lifetime_purchased as number) || 0,
      lifetimeUsed: (row.lifetime_used as number) || 0,
      lastAllocationDate: row.last_allocation_date as string | null,
      monthlyAllocationAmount: (row.monthly_allocation_amount as number) || 0,
      rolloverCap: (row.rollover_cap as number) || 0,
    }
  } catch (error) {
    console.error("[ai-credits] Error getting team balance:", error)
    return {
      userId: null,
      subdomainId,
      monthlyBalance: 0,
      purchasedBalance: 0,
      totalBalance: 0,
      lifetimeAllocated: 0,
      lifetimePurchased: 0,
      lifetimeUsed: 0,
      lastAllocationDate: null,
      monthlyAllocationAmount: 0,
      rolloverCap: 0,
    }
  }
}

/**
 * Get combined balance (user + team pool if available)
 */
export async function getCombinedBalance(
  userId: string,
  subdomainId?: string
): Promise<{
  user: CreditBalance
  team: CreditBalance | null
  totalAvailable: number
}> {
  const userBalance = await getUserCreditBalance(userId)
  let teamBalance: CreditBalance | null = null

  if (subdomainId) {
    teamBalance = await getTeamCreditBalance(subdomainId)
  }

  const totalAvailable =
    userBalance.totalBalance + (teamBalance?.purchasedBalance || 0)

  return { user: userBalance, team: teamBalance, totalAvailable }
}

// ============================================
// COST CALCULATION
// ============================================

/**
 * Get feature cost configuration
 */
export async function getFeatureCost(feature: string): Promise<FeatureCost | null> {
  try {
    const rows = await sql`
      SELECT * FROM ai_feature_costs WHERE feature = ${feature} AND is_active = true
    `

    if (rows.length === 0) return null

    const row = rows[0]
    return {
      feature: row.feature as string,
      displayName: row.display_name as string,
      description: row.description as string | null,
      category: row.category as string,
      baseCost: row.base_cost as number,
      unitType: row.unit_type as string,
      minTier: row.min_tier as string,
    }
  } catch (error) {
    console.error("[ai-credits] Error getting feature cost:", error)
    return null
  }
}

/**
 * Get model tier configuration
 */
export async function getModelTier(tierName: string): Promise<ModelTier | null> {
  try {
    const rows = await sql`
      SELECT * FROM ai_model_tiers WHERE name = ${tierName} AND is_active = true
    `

    if (rows.length === 0) return null

    const row = rows[0]
    return {
      id: row.id as string,
      name: row.name as string,
      displayName: row.display_name as string,
      description: row.description as string | null,
      creditMultiplier: parseFloat(row.credit_multiplier as string),
      models: row.models as string[],
      minTier: row.min_tier as string,
      isDefault: row.is_default as boolean,
    }
  } catch (error) {
    console.error("[ai-credits] Error getting model tier:", error)
    return null
  }
}

/**
 * Get default model tier
 */
export async function getDefaultModelTier(): Promise<ModelTier | null> {
  try {
    const rows = await sql`
      SELECT * FROM ai_model_tiers WHERE is_default = true AND is_active = true LIMIT 1
    `

    if (rows.length === 0) {
      // Fallback to 'pro' tier
      return getModelTier("pro")
    }

    const row = rows[0]
    return {
      id: row.id as string,
      name: row.name as string,
      displayName: row.display_name as string,
      description: row.description as string | null,
      creditMultiplier: parseFloat(row.credit_multiplier as string),
      models: row.models as string[],
      minTier: row.min_tier as string,
      isDefault: row.is_default as boolean,
    }
  } catch (error) {
    console.error("[ai-credits] Error getting default model tier:", error)
    return null
  }
}

/**
 * Calculate credit cost for a feature with model tier multiplier
 */
export async function calculateCreditCost(
  feature: string,
  modelTierName?: string
): Promise<{ cost: number; baseCost: number; multiplier: number } | null> {
  const featureCost = await getFeatureCost(feature)
  if (!featureCost) return null

  let modelTier: ModelTier | null = null
  if (modelTierName) {
    modelTier = await getModelTier(modelTierName)
  }
  if (!modelTier) {
    modelTier = await getDefaultModelTier()
  }

  const multiplier = modelTier?.creditMultiplier || 1.0
  const cost = Math.ceil(featureCost.baseCost * multiplier)

  return {
    cost,
    baseCost: featureCost.baseCost,
    multiplier,
  }
}

// ============================================
// CREDIT USAGE
// ============================================

/**
 * Check if user has enough credits for a feature
 */
export async function checkCredits(params: {
  userId: string
  subdomainId?: string
  feature: string
  modelTier?: string
}): Promise<CheckCreditsResult> {
  const { userId, subdomainId, feature, modelTier } = params

  // Check for unlimited credits override
  const hasUnlimited = await hasUnlimitedAiCredits(userId)
  if (hasUnlimited) {
    return {
      canUse: true,
      creditCost: 0, // Free for unlimited users
      monthlyBalance: 999999,
      purchasedBalance: 999999,
      totalBalance: 999999,
      teamPoolBalance: 0,
      deficit: 0,
    }
  }

  // Calculate cost
  const costInfo = await calculateCreditCost(feature, modelTier)
  if (!costInfo) {
    return {
      canUse: false,
      creditCost: 0,
      monthlyBalance: 0,
      purchasedBalance: 0,
      totalBalance: 0,
      teamPoolBalance: 0,
      deficit: 0,
      error: `Unknown feature: ${feature}`,
    }
  }

  // Get balances
  const { user, team, totalAvailable } = await getCombinedBalance(userId, subdomainId)

  const canUse = totalAvailable >= costInfo.cost
  const deficit = canUse ? 0 : costInfo.cost - totalAvailable

  return {
    canUse,
    creditCost: costInfo.cost,
    monthlyBalance: user.monthlyBalance,
    purchasedBalance: user.purchasedBalance,
    totalBalance: user.totalBalance,
    teamPoolBalance: team?.purchasedBalance || 0,
    deficit,
  }
}

/**
 * Use credits for an AI feature
 * Priority: User monthly → User purchased → Team pool (purchased only)
 */
export async function useCredits(params: UseCreditsParams): Promise<UseCreditsResult> {
  const {
    userId,
    subdomainId,
    feature,
    modelTier,
    amount,
    referenceId,
    description,
    metadata,
  } = params

  // Check for unlimited credits override - no deduction needed
  const hasUnlimited = await hasUnlimitedAiCredits(userId)
  if (hasUnlimited) {
    // Log usage for tracking but don't deduct
    try {
      await sql`
        INSERT INTO ai_credit_transactions (
          user_id, type, monthly_amount, purchased_amount,
          monthly_balance_after, purchased_balance_after,
          feature, model_tier, description, reference_id, metadata
        ) VALUES (
          ${userId}, 'usage', 0, 0,
          999999, 999999,
          ${feature}, ${modelTier || "pro"}, ${description || "Unlimited credits override"}, ${referenceId || null},
          ${JSON.stringify({ ...metadata, unlimitedOverride: true })}
        )
      `
    } catch (error) {
      console.error("[ai-credits] Error logging unlimited usage:", error)
    }

    return {
      success: true,
      creditsUsed: 0,
      monthlyUsed: 0,
      purchasedUsed: 0,
      remainingMonthly: 999999,
      remainingPurchased: 999999,
      remainingTotal: 999999,
    }
  }

  // Calculate cost if not provided
  let creditCost = amount
  if (!creditCost) {
    const costInfo = await calculateCreditCost(feature, modelTier)
    if (!costInfo) {
      return {
        success: false,
        creditsUsed: 0,
        monthlyUsed: 0,
        purchasedUsed: 0,
        remainingMonthly: 0,
        remainingPurchased: 0,
        remainingTotal: 0,
        error: `Unknown feature: ${feature}`,
      }
    }
    creditCost = costInfo.cost
  }

  // Get current balances
  const userBalance = await getUserCreditBalance(userId)
  let teamBalance: CreditBalance | null = null
  if (subdomainId) {
    teamBalance = await getTeamCreditBalance(subdomainId)
  }

  const totalAvailable =
    userBalance.totalBalance + (teamBalance?.purchasedBalance || 0)

  if (totalAvailable < creditCost) {
    return {
      success: false,
      creditsUsed: 0,
      monthlyUsed: 0,
      purchasedUsed: 0,
      remainingMonthly: userBalance.monthlyBalance,
      remainingPurchased: userBalance.purchasedBalance,
      remainingTotal: totalAvailable,
      error: `Insufficient credits. Need ${creditCost}, have ${totalAvailable}`,
    }
  }

  // Calculate deductions (monthly first, then purchased, then team)
  let remainingToDeduct = creditCost
  let monthlyUsed = 0
  let purchasedUsed = 0
  let teamUsed = 0

  // 1. Deduct from user's monthly balance
  if (remainingToDeduct > 0 && userBalance.monthlyBalance > 0) {
    monthlyUsed = Math.min(remainingToDeduct, userBalance.monthlyBalance)
    remainingToDeduct -= monthlyUsed
  }

  // 2. Deduct from user's purchased balance
  if (remainingToDeduct > 0 && userBalance.purchasedBalance > 0) {
    purchasedUsed = Math.min(remainingToDeduct, userBalance.purchasedBalance)
    remainingToDeduct -= purchasedUsed
  }

  // 3. Deduct from team pool (purchased only)
  if (remainingToDeduct > 0 && teamBalance && teamBalance.purchasedBalance > 0) {
    teamUsed = Math.min(remainingToDeduct, teamBalance.purchasedBalance)
    remainingToDeduct -= teamUsed
  }

  try {
    // Update user balance
    const newUserMonthly = userBalance.monthlyBalance - monthlyUsed
    const newUserPurchased = userBalance.purchasedBalance - purchasedUsed

    await sql`
      UPDATE ai_credit_balances SET
        monthly_balance = ${newUserMonthly},
        purchased_balance = ${newUserPurchased},
        lifetime_used = lifetime_used + ${monthlyUsed + purchasedUsed},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `

    // Log user transaction
    await sql`
      INSERT INTO ai_credit_transactions (
        user_id, type, monthly_amount, purchased_amount,
        monthly_balance_after, purchased_balance_after,
        feature, model_tier, description, reference_id, metadata
      ) VALUES (
        ${userId}, 'usage', ${-monthlyUsed}, ${-purchasedUsed},
        ${newUserMonthly}, ${newUserPurchased},
        ${feature}, ${modelTier || "pro"}, ${description || null}, ${referenceId || null},
        ${metadata ? JSON.stringify(metadata) : null}
      )
    `

    // Update team balance if used
    if (teamUsed > 0 && subdomainId) {
      const newTeamPurchased = (teamBalance?.purchasedBalance || 0) - teamUsed

      await sql`
        UPDATE ai_credit_balances SET
          purchased_balance = ${newTeamPurchased},
          lifetime_used = lifetime_used + ${teamUsed},
          updated_at = NOW()
        WHERE subdomain_id = ${subdomainId}::int
      `

      // Log team transaction
      await sql`
        INSERT INTO ai_credit_transactions (
          user_id, subdomain_id, type, monthly_amount, purchased_amount,
          monthly_balance_after, purchased_balance_after,
          feature, model_tier, description, reference_id, metadata
        ) VALUES (
          ${userId}, ${subdomainId}::int, 'usage', 0, ${-teamUsed},
          0, ${newTeamPurchased},
          ${feature}, ${modelTier || "pro"}, ${"Team pool usage by " + userId}, ${referenceId || null},
          ${JSON.stringify({ ...metadata, sourceUser: userId })}
        )
      `
    }

    return {
      success: true,
      creditsUsed: creditCost,
      monthlyUsed,
      purchasedUsed: purchasedUsed + teamUsed,
      remainingMonthly: newUserMonthly,
      remainingPurchased: newUserPurchased + ((teamBalance?.purchasedBalance || 0) - teamUsed),
      remainingTotal: newUserMonthly + newUserPurchased + ((teamBalance?.purchasedBalance || 0) - teamUsed),
    }
  } catch (error) {
    console.error("[ai-credits] Error using credits:", error)
    return {
      success: false,
      creditsUsed: 0,
      monthlyUsed: 0,
      purchasedUsed: 0,
      remainingMonthly: userBalance.monthlyBalance,
      remainingPurchased: userBalance.purchasedBalance,
      remainingTotal: totalAvailable,
      error: "Failed to deduct credits",
    }
  }
}

// ============================================
// CREDIT ALLOCATION & PURCHASES
// ============================================

/**
 * Allocate monthly credits to a user based on their tier
 */
export async function allocateMonthlyCredits(
  userId: string,
  monthlyAmount: number,
  rolloverCap: number
): Promise<{ allocated: number; rolledOver: number; expired: number; bonusFromOverride: number }> {
  const balance = await getUserCreditBalance(userId)

  const currentMonth = new Date().toISOString().slice(0, 7) // "2024-01"
  const lastMonth = balance.lastAllocationDate?.slice(0, 7)

  // Skip if already allocated this month
  if (lastMonth === currentMonth) {
    return { allocated: 0, rolledOver: 0, expired: 0, bonusFromOverride: 0 }
  }

  // Check for extra monthly credits from override
  const overrideBonus = await getMonthlyCreditAllocation(userId)
  const totalMonthlyAmount = monthlyAmount + overrideBonus

  // Calculate rollover (capped) and expired
  const rolledOver = Math.min(balance.monthlyBalance, rolloverCap)
  const expired = Math.max(0, balance.monthlyBalance - rolloverCap)

  // New monthly balance = rollover + new allocation + override bonus
  const newMonthlyBalance = rolledOver + totalMonthlyAmount

  try {
    await sql`
      UPDATE ai_credit_balances SET
        monthly_balance = ${newMonthlyBalance},
        lifetime_allocated = lifetime_allocated + ${totalMonthlyAmount},
        last_allocation_date = ${new Date().toISOString().slice(0, 10)},
        monthly_allocation_amount = ${totalMonthlyAmount},
        rollover_cap = ${rolloverCap},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `

    // Log allocation
    await sql`
      INSERT INTO ai_credit_transactions (
        user_id, type, monthly_amount, purchased_amount,
        monthly_balance_after, purchased_balance_after,
        description, metadata
      ) VALUES (
        ${userId}, 'allocation', ${totalMonthlyAmount}, 0,
        ${newMonthlyBalance}, ${balance.purchasedBalance},
        'Monthly credit allocation',
        ${JSON.stringify({ rolledOver, expired, month: currentMonth, baseAmount: monthlyAmount, overrideBonus })}
      )
    `

    // Log expired credits if any
    if (expired > 0) {
      await sql`
        INSERT INTO ai_credit_transactions (
          user_id, type, monthly_amount, purchased_amount,
          monthly_balance_after, purchased_balance_after,
          description
        ) VALUES (
          ${userId}, 'expired', ${-expired}, 0,
          ${newMonthlyBalance}, ${balance.purchasedBalance},
          'Monthly credits expired (exceeded rollover cap)'
        )
      `
    }

    return { allocated: totalMonthlyAmount, rolledOver, expired, bonusFromOverride: overrideBonus }
  } catch (error) {
    console.error("[ai-credits] Error allocating monthly credits:", error)
    return { allocated: 0, rolledOver: 0, expired: 0, bonusFromOverride: 0 }
  }
}

/**
 * Add purchased credits to team pool
 */
export async function addPurchasedCredits(
  subdomainId: string,
  credits: number,
  purchaserId: string,
  stripePaymentId?: string
): Promise<boolean> {
  try {
    // Ensure team balance exists
    const teamBalance = await getTeamCreditBalance(subdomainId)

    const newPurchasedBalance = teamBalance.purchasedBalance + credits

    await sql`
      UPDATE ai_credit_balances SET
        purchased_balance = ${newPurchasedBalance},
        lifetime_purchased = lifetime_purchased + ${credits},
        updated_at = NOW()
      WHERE subdomain_id = ${subdomainId}::int
    `

    // Log transaction
    await sql`
      INSERT INTO ai_credit_transactions (
        user_id, subdomain_id, type, monthly_amount, purchased_amount,
        monthly_balance_after, purchased_balance_after,
        description, reference_id, metadata
      ) VALUES (
        ${purchaserId}, ${subdomainId}::int, 'purchase', 0, ${credits},
        ${teamBalance.monthlyBalance}, ${newPurchasedBalance},
        'Credit pack purchase',
        ${stripePaymentId || null},
        ${JSON.stringify({ purchaserId })}
      )
    `

    return true
  } catch (error) {
    console.error("[ai-credits] Error adding purchased credits:", error)
    return false
  }
}

/**
 * Add purchased credits directly to user (for users without subdomain)
 */
export async function addUserPurchasedCredits(
  userId: string,
  credits: number,
  stripePaymentId?: string
): Promise<boolean> {
  try {
    const balance = await getUserCreditBalance(userId)
    const newPurchasedBalance = balance.purchasedBalance + credits

    await sql`
      UPDATE ai_credit_balances SET
        purchased_balance = ${newPurchasedBalance},
        lifetime_purchased = lifetime_purchased + ${credits},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `

    await sql`
      INSERT INTO ai_credit_transactions (
        user_id, type, monthly_amount, purchased_amount,
        monthly_balance_after, purchased_balance_after,
        description, reference_id
      ) VALUES (
        ${userId}, 'purchase', 0, ${credits},
        ${balance.monthlyBalance}, ${newPurchasedBalance},
        'Credit pack purchase',
        ${stripePaymentId || null}
      )
    `

    return true
  } catch (error) {
    console.error("[ai-credits] Error adding user purchased credits:", error)
    return false
  }
}

// ============================================
// CREDIT PACKS
// ============================================

/**
 * Get all available credit packs
 */
export async function getCreditPacks(options?: {
  onboardingOnly?: boolean
  minTier?: string
}): Promise<CreditPack[]> {
  try {
    let query = sql`
      SELECT * FROM ai_credit_packs
      WHERE is_active = true
    `

    if (options?.onboardingOnly) {
      query = sql`
        SELECT * FROM ai_credit_packs
        WHERE is_active = true AND show_in_onboarding = true
      `
    }

    const rows = await query

    return rows
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        displayName: row.display_name as string,
        description: row.description as string | null,
        credits: row.credits as number,
        bonusCredits: row.bonus_credits as number,
        totalCredits: (row.credits as number) + (row.bonus_credits as number),
        priceCents: row.price_cents as number,
        currency: row.currency as string,
        stripeProductId: row.stripe_product_id as string | null,
        stripePriceId: row.stripe_price_id as string | null,
        badge: row.badge as string | null,
        isPopular: row.is_popular as boolean,
        sortOrder: row.sort_order as number,
        minTier: row.min_tier as string,
        showInOnboarding: row.show_in_onboarding as boolean,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (error) {
    console.error("[ai-credits] Error getting credit packs:", error)
    return []
  }
}

/**
 * Get a specific credit pack by ID or name
 */
export async function getCreditPack(idOrName: string): Promise<CreditPack | null> {
  try {
    const rows = await sql`
      SELECT * FROM ai_credit_packs
      WHERE (id::text = ${idOrName} OR name = ${idOrName}) AND is_active = true
    `

    if (rows.length === 0) return null

    const row = rows[0]
    return {
      id: row.id as string,
      name: row.name as string,
      displayName: row.display_name as string,
      description: row.description as string | null,
      credits: row.credits as number,
      bonusCredits: row.bonus_credits as number,
      totalCredits: (row.credits as number) + (row.bonus_credits as number),
      priceCents: row.price_cents as number,
      currency: row.currency as string,
      stripeProductId: row.stripe_product_id as string | null,
      stripePriceId: row.stripe_price_id as string | null,
      badge: row.badge as string | null,
      isPopular: row.is_popular as boolean,
      sortOrder: row.sort_order as number,
      minTier: row.min_tier as string,
      showInOnboarding: row.show_in_onboarding as boolean,
    }
  } catch (error) {
    console.error("[ai-credits] Error getting credit pack:", error)
    return null
  }
}

// ============================================
// MODEL TIERS
// ============================================

/**
 * Get all available model tiers
 */
export async function getModelTiers(): Promise<ModelTier[]> {
  try {
    const rows = await sql`
      SELECT * FROM ai_model_tiers
      WHERE is_active = true
      ORDER BY sort_order ASC
    `

    return rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      displayName: row.display_name as string,
      description: row.description as string | null,
      creditMultiplier: parseFloat(row.credit_multiplier as string),
      models: row.models as string[],
      minTier: row.min_tier as string,
      isDefault: row.is_default as boolean,
    }))
  } catch (error) {
    console.error("[ai-credits] Error getting model tiers:", error)
    return []
  }
}

// ============================================
// USAGE HISTORY
// ============================================

/**
 * Get credit transaction history for a user
 */
export async function getCreditHistory(
  userId: string,
  options?: { limit?: number; offset?: number; type?: string }
): Promise<{
  transactions: Array<{
    id: string
    type: string
    monthlyAmount: number
    purchasedAmount: number
    feature: string | null
    modelTier: string | null
    description: string | null
    createdAt: Date
  }>
  total: number
}> {
  try {
    const limit = options?.limit || 50
    const offset = options?.offset || 0

    let whereClause = sql`WHERE user_id = ${userId}`
    if (options?.type) {
      whereClause = sql`WHERE user_id = ${userId} AND type = ${options.type}`
    }

    const rows = await sql`
      SELECT * FROM ai_credit_transactions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countRows = await sql`
      SELECT COUNT(*) as total FROM ai_credit_transactions
      ${whereClause}
    `

    return {
      transactions: rows.map((row) => ({
        id: row.id as string,
        type: row.type as string,
        monthlyAmount: row.monthly_amount as number,
        purchasedAmount: row.purchased_amount as number,
        feature: row.feature as string | null,
        modelTier: row.model_tier as string | null,
        description: row.description as string | null,
        createdAt: new Date(row.created_at as string),
      })),
      total: parseInt(countRows[0].total as string, 10),
    }
  } catch (error) {
    console.error("[ai-credits] Error getting credit history:", error)
    return { transactions: [], total: 0 }
  }
}

/**
 * Get all feature costs
 */
export async function getAllFeatureCosts(): Promise<FeatureCost[]> {
  try {
    const rows = await sql`
      SELECT * FROM ai_feature_costs WHERE is_active = true ORDER BY category, base_cost
    `

    return rows.map((row) => ({
      feature: row.feature as string,
      displayName: row.display_name as string,
      description: row.description as string | null,
      category: row.category as string,
      baseCost: row.base_cost as number,
      unitType: row.unit_type as string,
      minTier: row.min_tier as string,
    }))
  } catch (error) {
    console.error("[ai-credits] Error getting feature costs:", error)
    return []
  }
}

/**
 * Apply pending credit grants from super admin to user account
 * Should be called during user login or when accessing credits
 */
export async function applyPendingCreditGrants(userId: string): Promise<{
  applied: number
  totalCredits: number
  grants: Array<{ id: string; amount: number; type: string }>
}> {
  const pendingGrants = await getPendingCreditGrants(userId)

  if (pendingGrants.length === 0) {
    return { applied: 0, totalCredits: 0, grants: [] }
  }

  let totalCredits = 0
  const appliedGrants: Array<{ id: string; amount: number; type: string }> = []

  for (const grant of pendingGrants) {
    try {
      if (grant.creditType === 'monthly') {
        // Add to monthly balance
        const balance = await getUserCreditBalance(userId)
        const newMonthlyBalance = balance.monthlyBalance + grant.creditsAmount

        await sql`
          UPDATE ai_credit_balances SET
            monthly_balance = ${newMonthlyBalance},
            lifetime_allocated = lifetime_allocated + ${grant.creditsAmount},
            updated_at = NOW()
          WHERE user_id = ${userId}
        `

        // Log the grant
        await sql`
          INSERT INTO ai_credit_transactions (
            user_id, type, monthly_amount, purchased_amount,
            monthly_balance_after, purchased_balance_after,
            description, metadata
          ) VALUES (
            ${userId}, 'grant', ${grant.creditsAmount}, 0,
            ${newMonthlyBalance}, ${balance.purchasedBalance},
            ${grant.grantReason || 'Admin credit grant'},
            ${JSON.stringify({ grantId: grant.id, grantedBy: grant.grantedByUserId })}
          )
        `
      } else {
        // Add to purchased balance (never expires)
        const success = await addUserPurchasedCredits(userId, grant.creditsAmount)
        if (!success) {
          await markCreditGrantFailed(grant.id, 'Failed to add purchased credits')
          continue
        }
      }

      await markCreditGrantApplied(grant.id)
      totalCredits += grant.creditsAmount
      appliedGrants.push({
        id: grant.id,
        amount: grant.creditsAmount,
        type: grant.creditType,
      })
    } catch (error) {
      console.error(`[ai-credits] Error applying grant ${grant.id}:`, error)
      await markCreditGrantFailed(grant.id, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return {
    applied: appliedGrants.length,
    totalCredits,
    grants: appliedGrants,
  }
}
