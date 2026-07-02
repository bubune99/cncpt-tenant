/**
 * Auth Sync Utility
 *
 * Synchronizes Stack Auth users with both:
 * 1. Platform `users` table (raw SQL via @/lib/neon) — for dashboard, billing, credits
 * 2. CMS `User` model (Prisma) — for CMS admin, page editing, blog authoring
 *
 * Both records reference the same Stack Auth user ID.
 */

import { sql } from "@/lib/neon"
import { stackServerApp } from "@/stack"

// =============================================================================
// TYPES
// =============================================================================

export interface LocalUser {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  status: string
  tier_id: string | null
  subscription_status: string | null
  last_login_at: string | null
  login_count: number
  created_at: string
  updated_at: string
}

export interface UserUpdate {
  email?: string
  name?: string | null
  avatar_url?: string | null
  status?: string
  last_login_at?: string
  last_login_ip?: string
}

export interface SyncReport {
  total: number
  created: number
  updated: number
  errors: Array<{ userId: string; error: string }>
  durationMs: number
}

// Stack Auth user shape (subset of what the SDK provides)
interface StackUserData {
  id: string
  primaryEmail: string | null
  displayName: string | null
  profileImageUrl: string | null
  signedUpAt?: Date
}

// =============================================================================
// CORE SYNC FUNCTIONS
// =============================================================================

/**
 * Sync a single Stack Auth user to the platform users table (raw SQL).
 * Uses INSERT ... ON CONFLICT for idempotent upsert.
 */
export async function syncUserToDb(stackUser: StackUserData): Promise<LocalUser> {
  const { id, primaryEmail, displayName, profileImageUrl } = stackUser

  if (!primaryEmail) {
    throw new Error(`Stack Auth user ${id} has no primary email`)
  }

  const rows = await sql`
    INSERT INTO users (id, email, name, avatar_url, status, created_at, updated_at)
    VALUES (
      ${id},
      ${primaryEmail},
      ${displayName || null},
      ${profileImageUrl || null},
      'active',
      ${stackUser.signedUpAt ? stackUser.signedUpAt.toISOString() : new Date().toISOString()},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      updated_at = NOW()
    RETURNING *
  `

  if (rows.length === 0) {
    throw new Error(`Failed to upsert user ${id}`)
  }

  return mapRowToLocalUser(rows[0])
}

/**
 * Sync a Stack Auth user to the CMS User model (Prisma).
 * This calls the existing /api/cms/auth/sync endpoint logic directly.
 * We import prisma lazily to avoid circular dependency issues.
 */
export async function syncUserToCms(stackUser: StackUserData): Promise<{
  id: string
  stackAuthId: string | null
  email: string
  name: string | null
}> {
  // Dynamic import to avoid server-only import issues in some contexts
  const { prisma } = await import("@/lib/cms/db")

  const { id, primaryEmail, displayName, profileImageUrl } = stackUser

  if (!primaryEmail) {
    throw new Error(`Stack Auth user ${id} has no primary email`)
  }

  // Check if user exists by stackAuthId
  let user = await prisma.user.findUnique({
    where: { stackAuthId: id },
    select: { id: true, stackAuthId: true, email: true, name: true },
  })

  if (user) {
    // Update existing
    user = await prisma.user.update({
      where: { stackAuthId: id },
      data: {
        email: primaryEmail,
        name: displayName || undefined,
        avatar: profileImageUrl || undefined,
      },
      select: { id: true, stackAuthId: true, email: true, name: true },
    })
  } else {
    // Check if email exists (pre-existing user)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: primaryEmail },
      select: { id: true, stackAuthId: true, email: true, name: true },
    })

    if (existingByEmail) {
      // Link existing to Stack Auth
      user = await prisma.user.update({
        where: { email: primaryEmail },
        data: {
          stackAuthId: id,
          name: displayName || existingByEmail.name,
          avatar: profileImageUrl || undefined,
        },
        select: { id: true, stackAuthId: true, email: true, name: true },
      })
    } else {
      // Create new
      user = await prisma.user.create({
        data: {
          stackAuthId: id,
          email: primaryEmail,
          name: displayName || null,
          avatar: profileImageUrl || null,
          role: "CUSTOMER",
        },
        select: { id: true, stackAuthId: true, email: true, name: true },
      })
    }
  }

  return user
}

/**
 * Check if a user exists in the platform users table, create if not.
 * JIT (Just-In-Time) provisioning for first login.
 */
export async function ensureLocalUser(stackAuthId: string): Promise<LocalUser> {
  // Check if already exists
  // The users table is hybrid: CMS-created rows have a cuid id + the Stack
  // UUID in stack_auth_id; legacy platform rows used the Stack UUID as id.
  const existing = await sql`
    SELECT * FROM users WHERE stack_auth_id = ${stackAuthId} OR id = ${stackAuthId}
  `

  if (existing.length > 0) {
    return mapRowToLocalUser(existing[0])
  }

  // Fetch from Stack Auth
  const stackUser = await stackServerApp.getUser(stackAuthId)
  if (!stackUser) {
    throw new Error(`Stack Auth user ${stackAuthId} not found`)
  }

  return syncUserToDb({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail,
    displayName: stackUser.displayName,
    profileImageUrl: stackUser.profileImageUrl,
    signedUpAt: stackUser.signedUpAt,
  })
}

/**
 * Update local user from partial data.
 */
export async function updateLocalUser(
  stackAuthId: string,
  data: Partial<UserUpdate>
): Promise<void> {
  const setClauses: string[] = []
  const values: unknown[] = []

  if (data.email !== undefined) {
    setClauses.push("email = $1")
    values.push(data.email)
  }
  if (data.name !== undefined) {
    setClauses.push(`name = $${values.length + 1}`)
    values.push(data.name)
  }
  if (data.avatar_url !== undefined) {
    setClauses.push(`avatar_url = $${values.length + 1}`)
    values.push(data.avatar_url)
  }
  if (data.status !== undefined) {
    setClauses.push(`status = $${values.length + 1}`)
    values.push(data.status)
  }
  if (data.last_login_at !== undefined) {
    setClauses.push(`last_login_at = $${values.length + 1}`)
    values.push(data.last_login_at)
  }
  if (data.last_login_ip !== undefined) {
    setClauses.push(`last_login_ip = $${values.length + 1}`)
    values.push(data.last_login_ip)
  }

  if (setClauses.length === 0) return

  // Use the tagged template approach for safety
  await sql`
    UPDATE users SET
      email = COALESCE(${data.email ?? null}, email),
      name = COALESCE(${data.name ?? null}, name),
      avatar_url = COALESCE(${data.avatar_url ?? null}, avatar_url),
      updated_at = NOW()
    WHERE stack_auth_id = ${stackAuthId} OR id = ${stackAuthId}
  `
}

/**
 * Record a sign-in event for a user.
 */
export async function recordSignIn(
  stackAuthId: string,
  ipAddress?: string
): Promise<void> {
  try {
    await sql`
      UPDATE users SET
        last_login_at = NOW(),
        last_login_ip = ${ipAddress || null},
        login_count = COALESCE(login_count, 0) + 1,
        updated_at = NOW()
      WHERE stack_auth_id = ${stackAuthId} OR id = ${stackAuthId}
    `
  } catch (error) {
    console.error("[auth-sync] Error recording sign-in:", error)
  }
}

/**
 * Handle user deletion — soft-delete the local record.
 */
export async function handleUserDeletion(stackAuthId: string): Promise<void> {
  try {
    // Soft-delete in platform users table
    await sql`
      UPDATE users SET
        status = 'deleted',
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE stack_auth_id = ${stackAuthId} OR id = ${stackAuthId}
    `

    // Clean up related records
    await sql`
      DELETE FROM sessions WHERE user_id = ${stackAuthId}
    `

    // Revoke admin/super admin access
    await sql`
      DELETE FROM admin_users WHERE user_id = ${stackAuthId}
    `
    await sql`
      UPDATE super_admins SET revoked_at = NOW() WHERE user_id = ${stackAuthId} AND revoked_at IS NULL
    `

    // Remove from team memberships
    await sql`
      DELETE FROM team_members WHERE user_id = ${stackAuthId}
    `

    console.log(`[auth-sync] User ${stackAuthId} soft-deleted and cleaned up`)
  } catch (error) {
    console.error("[auth-sync] Error handling user deletion:", error)
    throw error
  }
}

/**
 * Bulk sync all Stack Auth users to the platform users table.
 * Used as an admin tool to reconcile data.
 */
export async function syncAllUsers(): Promise<SyncReport> {
  const startTime = Date.now()
  const report: SyncReport = {
    total: 0,
    created: 0,
    updated: 0,
    errors: [],
    durationMs: 0,
  }

  try {
    // Fetch all users from Stack Auth
    const stackUsers = await stackServerApp.listUsers()
    report.total = stackUsers.length

    // Get existing local user IDs for determining created vs updated
    const existingRows = await sql`SELECT id FROM users`
    const existingIds = new Set(existingRows.map((r) => r.id as string))

    for (const stackUser of stackUsers) {
      try {
        const wasExisting = existingIds.has(stackUser.id)

        await syncUserToDb({
          id: stackUser.id,
          primaryEmail: stackUser.primaryEmail,
          displayName: stackUser.displayName,
          profileImageUrl: stackUser.profileImageUrl,
          signedUpAt: stackUser.signedUpAt,
        })

        if (wasExisting) {
          report.updated++
        } else {
          report.created++
        }
      } catch (error) {
        report.errors.push({
          userId: stackUser.id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Also sync to CMS User model
    for (const stackUser of stackUsers) {
      try {
        await syncUserToCms({
          id: stackUser.id,
          primaryEmail: stackUser.primaryEmail,
          displayName: stackUser.displayName,
          profileImageUrl: stackUser.profileImageUrl,
          signedUpAt: stackUser.signedUpAt,
        })
      } catch (error) {
        // CMS sync errors are secondary — don't add to main error list
        console.warn(
          `[auth-sync] CMS sync failed for ${stackUser.id}:`,
          error instanceof Error ? error.message : error
        )
      }
    }
  } catch (error) {
    console.error("[auth-sync] Bulk sync failed:", error)
    report.errors.push({
      userId: "BULK",
      error: error instanceof Error ? error.message : "Bulk sync failed",
    })
  }

  report.durationMs = Date.now() - startTime
  return report
}

/**
 * Get sync health status — compare Stack Auth users vs local DB.
 */
export async function getSyncStatus(): Promise<{
  stackAuthCount: number
  localDbCount: number
  cmsUserCount: number
  orphanedLocal: string[]
  missingLocal: string[]
  lastSyncAt: string | null
}> {
  try {
    // Count Stack Auth users
    const stackUsers = await stackServerApp.listUsers()
    const stackUserIds = new Set(stackUsers.map((u) => u.id))

    // Count local platform users
    const localRows = await sql`
      SELECT id FROM users WHERE status != 'deleted'
    `
    const localIds = new Set(localRows.map((r) => r.id as string))

    // Count CMS users
    const { prisma } = await import("@/lib/cms/db")
    const cmsUserCount = await prisma.user.count()

    // Find orphaned local users (in local DB but not in Stack Auth)
    const orphanedLocal: string[] = []
    for (const localId of localIds) {
      if (!stackUserIds.has(localId)) {
        orphanedLocal.push(localId)
      }
    }

    // Find missing local users (in Stack Auth but not in local DB)
    const missingLocal: string[] = []
    for (const stackId of stackUserIds) {
      if (!localIds.has(stackId)) {
        missingLocal.push(stackId)
      }
    }

    // Get last sync timestamp from webhook events
    const lastSyncRows = await sql`
      SELECT processed_at FROM webhook_events
      WHERE event_type LIKE 'user.%'
      ORDER BY processed_at DESC
      LIMIT 1
    `

    return {
      stackAuthCount: stackUsers.length,
      localDbCount: localRows.length,
      cmsUserCount,
      orphanedLocal,
      missingLocal,
      lastSyncAt: lastSyncRows.length > 0
        ? (lastSyncRows[0].processed_at as string)
        : null,
    }
  } catch (error) {
    console.error("[auth-sync] Error getting sync status:", error)
    throw error
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function mapRowToLocalUser(row: Record<string, unknown>): LocalUser {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) || null,
    avatar_url: (row.avatar_url as string) || null,
    status: (row.status as string) || "active",
    tier_id: (row.tier_id as string) || null,
    subscription_status: (row.subscription_status as string) || null,
    last_login_at: (row.last_login_at as string) || null,
    login_count: (row.login_count as number) || 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}
