/**
 * User Overrides Management
 *
 * Allows super admins to grant special permissions to users:
 * - Unlimited subdomains
 * - Unlimited AI credits
 * - Payment bypass
 * - Custom subdomain limits
 * - Free credit allocations
 */

import { sql } from "@/lib/neon"

// ============================================
// TYPES
// ============================================

export interface UserOverride {
  id: string
  userId: string
  userEmail: string | null
  unlimitedSubdomains: boolean
  unlimitedAiCredits: boolean
  bypassPayment: boolean
  subdomainLimitOverride: number | null
  monthlyCreditAllocation: number | null
  grantedByUserId: string
  grantedByEmail: string | null
  grantReason: string | null
  grantedAt: Date
  expiresAt: Date | null
  revokedAt: Date | null
  revokedByUserId: string | null
  revokeReason: string | null
  notes: string | null
  metadata: Record<string, unknown>
  updatedAt: Date
}

export interface CreditGrant {
  id: string
  userId: string
  userEmail: string | null
  creditsAmount: number
  creditType: 'monthly' | 'purchased'
  grantedByUserId: string
  grantedByEmail: string | null
  grantReason: string | null
  status: 'pending' | 'applied' | 'failed'
  appliedAt: Date | null
  errorMessage: string | null
  notes: string | null
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface CreateOverrideInput {
  userId: string
  userEmail?: string
  unlimitedSubdomains?: boolean
  unlimitedAiCredits?: boolean
  bypassPayment?: boolean
  subdomainLimitOverride?: number
  monthlyCreditAllocation?: number
  grantReason?: string
  expiresAt?: Date
  notes?: string
}

export interface GrantCreditsInput {
  userId: string
  userEmail?: string
  creditsAmount: number
  creditType?: 'monthly' | 'purchased'
  grantReason?: string
  notes?: string
}

// ============================================
// OVERRIDE FUNCTIONS
// ============================================

/**
 * Get active override for a user
 */
export async function getUserOverride(userId: string): Promise<UserOverride | null> {
  try {
    const rows = await sql`
      SELECT * FROM user_overrides
      WHERE user_id = ${userId}
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY granted_at DESC
      LIMIT 1
    `

    if (rows.length === 0) return null

    return mapRowToOverride(rows[0])
  } catch (error) {
    console.error("[user-overrides] Error getting user override:", error)
    return null
  }
}

/**
 * Check if user has unlimited subdomains
 */
export async function hasUnlimitedSubdomains(userId: string): Promise<boolean> {
  const override = await getUserOverride(userId)
  return override?.unlimitedSubdomains === true
}

/**
 * Check if user has unlimited AI credits
 */
export async function hasUnlimitedAiCredits(userId: string): Promise<boolean> {
  const override = await getUserOverride(userId)
  return override?.unlimitedAiCredits === true
}

/**
 * Check if user can bypass payment
 */
export async function canBypassPayment(userId: string): Promise<boolean> {
  const override = await getUserOverride(userId)
  return override?.bypassPayment === true
}

/**
 * Get custom subdomain limit if set
 */
export async function getSubdomainLimitOverride(userId: string): Promise<number | null> {
  const override = await getUserOverride(userId)

  if (override?.unlimitedSubdomains) return -1 // Unlimited
  return override?.subdomainLimitOverride ?? null
}

/**
 * Get extra monthly credit allocation
 */
export async function getMonthlyCreditAllocation(userId: string): Promise<number> {
  const override = await getUserOverride(userId)
  return override?.monthlyCreditAllocation ?? 0
}

/**
 * Create or update user override (super admin only)
 */
export async function createUserOverride(
  input: CreateOverrideInput,
  grantedByUserId: string,
  grantedByEmail?: string
): Promise<UserOverride> {
  try {
    // First, revoke any existing active overrides
    await sql`
      UPDATE user_overrides
      SET revoked_at = NOW(),
          revoked_by_user_id = ${grantedByUserId},
          revoke_reason = 'Superseded by new override'
      WHERE user_id = ${input.userId}
        AND revoked_at IS NULL
    `

    // Create new override
    const rows = await sql`
      INSERT INTO user_overrides (
        user_id,
        user_email,
        unlimited_subdomains,
        unlimited_ai_credits,
        bypass_payment,
        subdomain_limit_override,
        monthly_credit_allocation,
        granted_by_user_id,
        granted_by_email,
        grant_reason,
        expires_at,
        notes
      ) VALUES (
        ${input.userId},
        ${input.userEmail || null},
        ${input.unlimitedSubdomains || false},
        ${input.unlimitedAiCredits || false},
        ${input.bypassPayment || false},
        ${input.subdomainLimitOverride ?? null},
        ${input.monthlyCreditAllocation ?? null},
        ${grantedByUserId},
        ${grantedByEmail || null},
        ${input.grantReason || null},
        ${input.expiresAt || null},
        ${input.notes || null}
      )
      RETURNING *
    `

    return mapRowToOverride(rows[0])
  } catch (error) {
    console.error("[user-overrides] Error creating override:", error)
    throw new Error("Failed to create user override")
  }
}

/**
 * Revoke user override
 */
export async function revokeUserOverride(
  userId: string,
  revokedByUserId: string,
  revokeReason?: string
): Promise<void> {
  try {
    await sql`
      UPDATE user_overrides
      SET revoked_at = NOW(),
          revoked_by_user_id = ${revokedByUserId},
          revoke_reason = ${revokeReason || null}
      WHERE user_id = ${userId}
        AND revoked_at IS NULL
    `
  } catch (error) {
    console.error("[user-overrides] Error revoking override:", error)
    throw new Error("Failed to revoke user override")
  }
}

/**
 * List all overrides (for super admin view)
 */
export async function listAllOverrides(options?: {
  includeRevoked?: boolean
  limit?: number
  offset?: number
}): Promise<UserOverride[]> {
  try {
    const limit = options?.limit ?? 100
    const offset = options?.offset ?? 0

    let rows
    if (options?.includeRevoked) {
      rows = await sql`
        SELECT * FROM user_overrides
        ORDER BY granted_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      rows = await sql`
        SELECT * FROM user_overrides
        WHERE revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY granted_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return rows.map(mapRowToOverride)
  } catch (error) {
    console.error("[user-overrides] Error listing overrides:", error)
    return []
  }
}

// ============================================
// CREDIT GRANT FUNCTIONS
// ============================================

/**
 * Grant credits to a user (super admin only)
 */
export async function grantCredits(
  input: GrantCreditsInput,
  grantedByUserId: string,
  grantedByEmail?: string
): Promise<CreditGrant> {
  try {
    const rows = await sql`
      INSERT INTO credit_grants (
        user_id,
        user_email,
        credits_amount,
        credit_type,
        granted_by_user_id,
        granted_by_email,
        grant_reason,
        notes,
        status
      ) VALUES (
        ${input.userId},
        ${input.userEmail || null},
        ${input.creditsAmount},
        ${input.creditType || 'purchased'},
        ${grantedByUserId},
        ${grantedByEmail || null},
        ${input.grantReason || null},
        ${input.notes || null},
        'pending'
      )
      RETURNING *
    `

    return mapRowToCreditGrant(rows[0])
  } catch (error) {
    console.error("[user-overrides] Error granting credits:", error)
    throw new Error("Failed to grant credits")
  }
}

/**
 * Get pending credit grants for a user
 */
export async function getPendingCreditGrants(userId: string): Promise<CreditGrant[]> {
  try {
    const rows = await sql`
      SELECT * FROM credit_grants
      WHERE user_id = ${userId}
        AND status = 'pending'
      ORDER BY created_at ASC
    `
    return rows.map(mapRowToCreditGrant)
  } catch (error) {
    console.error("[user-overrides] Error getting pending grants:", error)
    return []
  }
}

/**
 * Mark credit grant as applied
 */
export async function markCreditGrantApplied(grantId: string): Promise<void> {
  try {
    await sql`
      UPDATE credit_grants
      SET status = 'applied',
          applied_at = NOW()
      WHERE id = ${grantId}
    `
  } catch (error) {
    console.error("[user-overrides] Error marking grant applied:", error)
  }
}

/**
 * Mark credit grant as failed
 */
export async function markCreditGrantFailed(grantId: string, errorMessage: string): Promise<void> {
  try {
    await sql`
      UPDATE credit_grants
      SET status = 'failed',
          error_message = ${errorMessage}
      WHERE id = ${grantId}
    `
  } catch (error) {
    console.error("[user-overrides] Error marking grant failed:", error)
  }
}

/**
 * List credit grants (for super admin view)
 */
export async function listCreditGrants(options?: {
  userId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<CreditGrant[]> {
  try {
    const limit = options?.limit ?? 100
    const offset = options?.offset ?? 0

    let rows
    if (options?.userId) {
      rows = await sql`
        SELECT * FROM credit_grants
        WHERE user_id = ${options.userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (options?.status) {
      rows = await sql`
        SELECT * FROM credit_grants
        WHERE status = ${options.status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      rows = await sql`
        SELECT * FROM credit_grants
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return rows.map(mapRowToCreditGrant)
  } catch (error) {
    console.error("[user-overrides] Error listing credit grants:", error)
    return []
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapRowToOverride(row: Record<string, unknown>): UserOverride {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userEmail: row.user_email as string | null,
    unlimitedSubdomains: row.unlimited_subdomains as boolean,
    unlimitedAiCredits: row.unlimited_ai_credits as boolean,
    bypassPayment: row.bypass_payment as boolean,
    subdomainLimitOverride: row.subdomain_limit_override as number | null,
    monthlyCreditAllocation: row.monthly_credit_allocation as number | null,
    grantedByUserId: row.granted_by_user_id as string,
    grantedByEmail: row.granted_by_email as string | null,
    grantReason: row.grant_reason as string | null,
    grantedAt: new Date(row.granted_at as string),
    expiresAt: row.expires_at ? new Date(row.expires_at as string) : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : null,
    revokedByUserId: row.revoked_by_user_id as string | null,
    revokeReason: row.revoke_reason as string | null,
    notes: row.notes as string | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    updatedAt: new Date(row.updated_at as string),
  }
}

function mapRowToCreditGrant(row: Record<string, unknown>): CreditGrant {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userEmail: row.user_email as string | null,
    creditsAmount: row.credits_amount as number,
    creditType: row.credit_type as 'monthly' | 'purchased',
    grantedByUserId: row.granted_by_user_id as string,
    grantedByEmail: row.granted_by_email as string | null,
    grantReason: row.grant_reason as string | null,
    status: row.status as 'pending' | 'applied' | 'failed',
    appliedAt: row.applied_at ? new Date(row.applied_at as string) : null,
    errorMessage: row.error_message as string | null,
    notes: row.notes as string | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: new Date(row.created_at as string),
  }
}
