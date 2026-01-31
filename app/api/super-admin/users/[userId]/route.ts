import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import {
  isSuperAdmin,
  logPlatformActivity,
  grantSuperAdmin,
  revokeSuperAdmin,
} from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

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
    const user = await stackServerApp.getUser({ userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get subdomains
    const subdomains = await sql`
      SELECT subdomain, emoji, created_at FROM subdomains WHERE user_id = ${userId}
    `

    // Get teams
    const teams = await sql`
      SELECT t.id, t.name, t.slug, tm.role
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ${userId} AND t.deleted_at IS NULL
    `

    // Get admin status
    const adminCheck = await sql`
      SELECT user_id FROM admin_users WHERE user_id = ${userId}
    `

    // Get super admin status
    const superAdminCheck = await sql`
      SELECT user_id, permissions FROM super_admins WHERE user_id = ${userId} AND revoked_at IS NULL
    `

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.primaryEmail || "",
        displayName: user.displayName || null,
        createdAt: user.signedUpAt,
        isAdmin: adminCheck.length > 0,
        isSuperAdmin: superAdminCheck.length > 0,
        superAdminPermissions: superAdminCheck[0]?.permissions || null,
      },
      subdomains: subdomains.map((s) => ({
        subdomain: s.subdomain,
        emoji: s.emoji,
        createdAt: s.created_at,
      })),
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        role: t.role,
      })),
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
    const { action, isAdmin, isSuperAdmin: makeSuperAdmin } = body

    const user = await stackServerApp.getUser({ userId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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

    const user = await stackServerApp.getUser({ userId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Log before deletion
    await logPlatformActivity(
      "user.delete",
      { targetUserId: userId, targetEmail: user.primaryEmail },
      { targetType: "user", targetId: userId }
    )

    // Delete from our tables first
    await sql`DELETE FROM admin_users WHERE user_id = ${userId}`
    await sql`UPDATE super_admins SET revoked_at = NOW() WHERE user_id = ${userId}`
    await sql`DELETE FROM team_members WHERE user_id = ${userId}`

    // Note: Stack Auth user deletion would need to be implemented
    // await stackServerApp.deleteUser({ userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[super-admin/users/[userId]] DELETE Error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
