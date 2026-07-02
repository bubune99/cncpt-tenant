import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import {
  isSuperAdmin,
  logPlatformActivity,
  grantSuperAdmin,
  revokeSuperAdmin,
} from "@/lib/super-admin"
import { sendEmail } from "@/lib/email"

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const COMPANY_NAME = process.env.COMPANY_NAME || 'CNCPT Web'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId } = await params
    const user = await stackServerApp.getUser(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get subdomains
    let subdomains: Array<{ subdomain: string; createdAt: string }> = []
    try {
      const subResult = await sql`
        SELECT subdomain, created_at FROM subdomains WHERE user_id = ${userId}
      `
      subdomains = subResult.map((s) => ({
        subdomain: s.subdomain as string,
        createdAt: s.created_at as string,
      }))
    } catch {
      // Table might not exist
    }

    // Get teams
    let teams: Array<{ id: string; name: string; slug: string; role: string }> = []
    try {
      const teamResult = await sql`
        SELECT t.id, t.name, t.slug, tm.role
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ${userId} AND t.deleted_at IS NULL
      `
      teams = teamResult.map((t) => ({
        id: t.id as string,
        name: t.name as string,
        slug: t.slug as string,
        role: t.role as string,
      }))
    } catch {
      // Tables might not exist
    }

    // Get admin status
    let isAdmin = false
    try {
      const adminCheck = await sql`
        SELECT user_id FROM admin_users WHERE user_id = ${userId}
      `
      isAdmin = adminCheck.length > 0
    } catch {
      // Table might not exist
    }

    // Get super admin status
    let isSuperAdminUser = false
    let superAdminPermissions: string[] | null = null
    try {
      const superAdminCheck = await sql`
        SELECT user_id, permissions FROM super_admins WHERE user_id = ${userId} AND revoked_at IS NULL
      `
      isSuperAdminUser = superAdminCheck.length > 0
      superAdminPermissions = superAdminCheck[0]?.permissions
        ? (Array.isArray(superAdminCheck[0].permissions)
          ? superAdminCheck[0].permissions
          : JSON.parse(superAdminCheck[0].permissions as string))
        : null
    } catch {
      // Table might not exist
    }

    // Get metadata (suspension, deletion, notes)
    let metadata: {
      suspendedAt: string | null
      suspendedBy: string | null
      suspensionReason: string | null
      deletedAt: string | null
      deletedBy: string | null
      adminNotes: string | null
      tierOverride: string | null
    } = {
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
      deletedAt: null,
      deletedBy: null,
      adminNotes: null,
      tierOverride: null,
    }
    try {
      const metaResult = await sql`
        SELECT suspended_at, suspended_by, suspension_reason, deleted_at, deleted_by, admin_notes, tier_override
        FROM platform_user_metadata
        WHERE user_id = ${userId}
      `
      if (metaResult.length > 0) {
        const m = metaResult[0]
        metadata = {
          suspendedAt: m.suspended_at as string | null,
          suspendedBy: m.suspended_by as string | null,
          suspensionReason: m.suspension_reason as string | null,
          deletedAt: m.deleted_at as string | null,
          deletedBy: m.deleted_by as string | null,
          adminNotes: m.admin_notes as string | null,
          tierOverride: m.tier_override as string | null,
        }
      }
    } catch {
      // Table might not exist
    }

    // Get AI credit balance
    let creditBalance = 0
    try {
      const creditResult = await sql`
        SELECT COALESCE(monthly_balance, 0) + COALESCE(purchased_balance, 0) as total_balance
        FROM ai_credit_balances
        WHERE user_id = ${userId}
      `
      if (creditResult.length > 0) {
        creditBalance = parseInt(creditResult[0].total_balance as string)
      }
    } catch {
      // Table might not exist
    }

    // Get recent activity for this user
    let recentActivity: Array<{
      id: string
      action: string
      details: Record<string, unknown>
      createdAt: string
    }> = []
    try {
      const activityResult = await sql`
        SELECT id, action, details, created_at
        FROM platform_activity_log
        WHERE target_id = ${userId} AND target_type = 'user'
        ORDER BY created_at DESC
        LIMIT 20
      `
      recentActivity = activityResult.map((a) => ({
        id: a.id as string,
        action: a.action as string,
        details: (a.details as Record<string, unknown>) || {},
        createdAt: a.created_at as string,
      }))
    } catch {
      // Table might not exist
    }

    // Get tier from platform_clients
    let tierName: string | null = null
    try {
      const tierResult = await sql`
        SELECT st.display_name as tier_name
        FROM platform_clients pc
        LEFT JOIN subscription_tiers st ON pc.tier_id = st.id
        WHERE pc.user_id = ${userId}
      `
      if (tierResult.length > 0) {
        tierName = tierResult[0].tier_name as string | null
      }
    } catch {
      // Tables might not exist
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.primaryEmail || "",
        displayName: user.displayName || null,
        profileImageUrl: user.profileImageUrl || null,
        createdAt: user.signedUpAt?.toISOString() || null,
        lastActiveAt: user.lastActiveAt?.toISOString() || null,
        isAdmin,
        isSuperAdmin: isSuperAdminUser,
        superAdminPermissions,
        ...metadata,
        tierName: tierName || metadata.tierOverride,
        creditBalance,
      },
      subdomains,
      teams,
      recentActivity,
    })
  } catch (error) {
    console.error("[super-admin/users/[userId]] Error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()
    const {
      action: userAction,
      isAdmin,
      isSuperAdmin: makeSuperAdmin,
      reason,
      adminNotes,
      tierOverride,
    } = body

    const user = await stackServerApp.getUser(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Handle suspend action
    if (userAction === "suspend") {
      if (userId === currentUser.id) {
        return NextResponse.json(
          { error: "Cannot suspend yourself" },
          { status: 400 }
        )
      }

      // Ensure metadata table and row exists
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS platform_user_metadata (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT UNIQUE NOT NULL,
            admin_notes TEXT,
            suspended_at TIMESTAMPTZ,
            suspended_by TEXT,
            suspension_reason TEXT,
            deleted_at TIMESTAMPTZ,
            deleted_by TEXT,
            deletion_reason TEXT,
            hard_delete_after TIMESTAMPTZ,
            tier_override TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      } catch {
        // Table may already exist
      }

      await sql`
        INSERT INTO platform_user_metadata (user_id, suspended_at, suspended_by, suspension_reason)
        VALUES (${userId}, NOW(), ${currentUser.id}, ${reason || null})
        ON CONFLICT (user_id) DO UPDATE SET
          suspended_at = NOW(),
          suspended_by = ${currentUser.id},
          suspension_reason = ${reason || null},
          updated_at = NOW()
      `

      // Also update platform users table status
      try {
        await sql`
          UPDATE users SET
            status = 'suspended',
            suspended_at = NOW(),
            suspension_reason = ${reason || null},
            updated_at = NOW()
          WHERE id = ${userId}
        `
      } catch { /* ignore - columns may not exist yet */ }

      await logPlatformActivity(
        "user.suspend",
        { targetUserId: userId, targetEmail: user.primaryEmail, reason },
        { targetType: "user", targetId: userId }
      )

      // Send suspension notification email
      try {
        await sendEmail({
          to: user.primaryEmail || "",
          subject: `Your ${COMPANY_NAME} account has been suspended`,
          html: `
            <h2>Account Suspended</h2>
            <p>Your account on ${COMPANY_NAME} has been suspended by an administrator.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>If you believe this is an error, please contact support.</p>
          `,
        })
      } catch {
        // Don't fail the action if email fails
      }

      return NextResponse.json({ success: true, action: "suspended" })
    }

    // Handle unsuspend action
    if (userAction === "unsuspend") {
      await sql`
        UPDATE platform_user_metadata
        SET suspended_at = NULL, suspended_by = NULL, suspension_reason = NULL, updated_at = NOW()
        WHERE user_id = ${userId}
      `

      // Also update platform users table status
      try {
        await sql`
          UPDATE users SET
            status = 'active',
            suspended_at = NULL,
            suspension_reason = NULL,
            updated_at = NOW()
          WHERE id = ${userId}
        `
      } catch { /* ignore - columns may not exist yet */ }

      await logPlatformActivity(
        "user.unsuspend",
        { targetUserId: userId, targetEmail: user.primaryEmail },
        { targetType: "user", targetId: userId }
      )

      // Send reactivation notification
      try {
        await sendEmail({
          to: user.primaryEmail || "",
          subject: `Your ${COMPANY_NAME} account has been reactivated`,
          html: `
            <h2>Account Reactivated</h2>
            <p>Your account on ${COMPANY_NAME} has been reactivated. You can now log in and use the platform.</p>
            <p><a href="${APP_URL}">Go to ${COMPANY_NAME}</a></p>
          `,
        })
      } catch {
        // Don't fail the action if email fails
      }

      return NextResponse.json({ success: true, action: "unsuspended" })
    }

    // Handle admin notes update
    if (typeof adminNotes === "string") {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS platform_user_metadata (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT UNIQUE NOT NULL,
            admin_notes TEXT,
            suspended_at TIMESTAMPTZ,
            suspended_by TEXT,
            suspension_reason TEXT,
            deleted_at TIMESTAMPTZ,
            deleted_by TEXT,
            deletion_reason TEXT,
            hard_delete_after TIMESTAMPTZ,
            tier_override TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      } catch {
        // Table may already exist
      }

      await sql`
        INSERT INTO platform_user_metadata (user_id, admin_notes)
        VALUES (${userId}, ${adminNotes})
        ON CONFLICT (user_id) DO UPDATE SET
          admin_notes = ${adminNotes},
          updated_at = NOW()
      `

      await logPlatformActivity(
        "user.notes_updated",
        { targetUserId: userId, targetEmail: user.primaryEmail },
        { targetType: "user", targetId: userId }
      )

      return NextResponse.json({ success: true, action: "notes_updated" })
    }

    // Handle tier override
    if (typeof tierOverride === "string") {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS platform_user_metadata (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT UNIQUE NOT NULL,
            admin_notes TEXT,
            suspended_at TIMESTAMPTZ,
            suspended_by TEXT,
            suspension_reason TEXT,
            deleted_at TIMESTAMPTZ,
            deleted_by TEXT,
            deletion_reason TEXT,
            hard_delete_after TIMESTAMPTZ,
            tier_override TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      } catch {
        // Table may already exist
      }

      await sql`
        INSERT INTO platform_user_metadata (user_id, tier_override)
        VALUES (${userId}, ${tierOverride || null})
        ON CONFLICT (user_id) DO UPDATE SET
          tier_override = ${tierOverride || null},
          updated_at = NOW()
      `

      await logPlatformActivity(
        "user.tier_changed",
        { targetUserId: userId, targetEmail: user.primaryEmail, newTier: tierOverride },
        { targetType: "user", targetId: userId }
      )

      return NextResponse.json({ success: true, action: "tier_changed" })
    }

    // Handle admin status change
    if (typeof isAdmin === "boolean") {
      if (isAdmin) {
        await sql`
          INSERT INTO admin_users (user_id, email)
          VALUES (${userId}, ${user.primaryEmail || ""})
          ON CONFLICT (user_id) DO NOTHING
        `
      } else {
        await sql`DELETE FROM admin_users WHERE user_id = ${userId}`
      }

      await logPlatformActivity(
        isAdmin ? "user.grant_admin" : "user.revoke_admin",
        { targetUserId: userId, targetEmail: user.primaryEmail },
        { targetType: "user", targetId: userId }
      )
    }

    // Handle super admin status change
    if (typeof makeSuperAdmin === "boolean") {
      if (makeSuperAdmin) {
        await grantSuperAdmin(
          userId,
          user.primaryEmail || "",
          currentUser.id
        )
      } else {
        // Prevent self-revocation
        if (userId === currentUser.id) {
          return NextResponse.json(
            { error: "Cannot revoke your own super admin status" },
            { status: 400 }
          )
        }
        await revokeSuperAdmin(userId)
      }

      await logPlatformActivity(
        makeSuperAdmin ? "user.grant_super_admin" : "user.revoke_super_admin",
        { targetUserId: userId, targetEmail: user.primaryEmail },
        { targetType: "user", targetId: userId }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[super-admin/users/[userId]] PATCH Error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId } = await params

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      )
    }

    const user = await stackServerApp.getUser(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parse body for confirmation and options
    let body: { confirm?: boolean; hardDelete?: boolean; reason?: string } = {}
    try {
      body = await request.json()
    } catch {
      // No body is ok for backward compat
    }

    if (!body.confirm) {
      return NextResponse.json(
        { error: "Deletion requires confirmation. Send { confirm: true } in the request body." },
        { status: 400 }
      )
    }

    const reason = body.reason || "Deleted by super admin"

    if (body.hardDelete) {
      // Hard delete - remove everything
      await logPlatformActivity(
        "user.hard_delete",
        { targetUserId: userId, targetEmail: user.primaryEmail, reason },
        { targetType: "user", targetId: userId }
      )

      // Update platform users table status
      try {
        await sql`
          UPDATE users SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
          WHERE id = ${userId}
        `
      } catch { /* ignore - table may not have these columns yet */ }

      // Delete from our tables
      try { await sql`DELETE FROM admin_users WHERE user_id = ${userId}` } catch { /* ignore */ }
      try { await sql`UPDATE super_admins SET revoked_at = NOW() WHERE user_id = ${userId}` } catch { /* ignore */ }
      try { await sql`DELETE FROM team_members WHERE user_id = ${userId}` } catch { /* ignore */ }
      try { await sql`DELETE FROM platform_user_metadata WHERE user_id = ${userId}` } catch { /* ignore */ }
      try { await sql`DELETE FROM ai_credit_balances WHERE user_id = ${userId}` } catch { /* ignore */ }
      try { await sql`DELETE FROM sessions WHERE user_id = ${userId}` } catch { /* ignore */ }

      // Unassign subdomains (don't delete them, just remove ownership)
      try { await sql`UPDATE subdomains SET user_id = NULL WHERE user_id = ${userId}` } catch { /* ignore */ }

      // Send deletion notification
      try {
        await sendEmail({
          to: user.primaryEmail || "",
          subject: `Your ${COMPANY_NAME} account has been deleted`,
          html: `
            <h2>Account Deleted</h2>
            <p>Your account on ${COMPANY_NAME} has been permanently deleted by an administrator.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>If you believe this is an error, please contact support immediately.</p>
          `,
        })
      } catch {
        // Don't fail the action if email fails
      }

      return NextResponse.json({ success: true, action: "hard_deleted" })
    } else {
      // Soft delete - mark as deleted, retain for 30 days
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS platform_user_metadata (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT UNIQUE NOT NULL,
            admin_notes TEXT,
            suspended_at TIMESTAMPTZ,
            suspended_by TEXT,
            suspension_reason TEXT,
            deleted_at TIMESTAMPTZ,
            deleted_by TEXT,
            deletion_reason TEXT,
            hard_delete_after TIMESTAMPTZ,
            tier_override TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      } catch {
        // Table may already exist
      }

      await sql`
        INSERT INTO platform_user_metadata (user_id, deleted_at, deleted_by, deletion_reason, hard_delete_after)
        VALUES (${userId}, NOW(), ${currentUser.id}, ${reason}, NOW() + INTERVAL '30 days')
        ON CONFLICT (user_id) DO UPDATE SET
          deleted_at = NOW(),
          deleted_by = ${currentUser.id},
          deletion_reason = ${reason},
          hard_delete_after = NOW() + INTERVAL '30 days',
          updated_at = NOW()
      `

      // Also suspend them immediately
      await sql`
        UPDATE platform_user_metadata
        SET suspended_at = COALESCE(suspended_at, NOW()),
            suspended_by = COALESCE(suspended_by, ${currentUser.id}),
            suspension_reason = COALESCE(suspension_reason, 'Account scheduled for deletion')
        WHERE user_id = ${userId}
      `

      // Update platform users table status
      try {
        await sql`
          UPDATE users SET
            status = 'deleted',
            deleted_at = NOW(),
            updated_at = NOW()
          WHERE id = ${userId}
        `
      } catch { /* ignore - table may not have these columns yet */ }

      await logPlatformActivity(
        "user.soft_delete",
        { targetUserId: userId, targetEmail: user.primaryEmail, reason },
        { targetType: "user", targetId: userId }
      )

      // Send deletion notification
      try {
        await sendEmail({
          to: user.primaryEmail || "",
          subject: `Your ${COMPANY_NAME} account has been scheduled for deletion`,
          html: `
            <h2>Account Deletion Scheduled</h2>
            <p>Your account on ${COMPANY_NAME} has been scheduled for deletion by an administrator.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>Your data will be permanently deleted after 30 days. If you believe this is an error, please contact support immediately.</p>
          `,
        })
      } catch {
        // Don't fail the action if email fails
      }

      return NextResponse.json({ success: true, action: "soft_deleted" })
    }
  } catch (error) {
    console.error("[super-admin/users/[userId]] DELETE Error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
