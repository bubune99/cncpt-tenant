import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || "all"
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const offset = (page - 1) * limit

    // Ensure table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS platform_invites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL,
          name TEXT,
          invited_by TEXT NOT NULL,
          invited_by_email TEXT,
          tier TEXT DEFAULT 'starter',
          message TEXT,
          token TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
          accepted_at TIMESTAMPTZ,
          accepted_by TEXT,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    } catch {
      // Table may already exist
    }

    // Auto-expire old pending invites
    try {
      await sql`
        UPDATE platform_invites
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'pending' AND expires_at < NOW()
      `
    } catch {
      // Ignore errors
    }

    // Build query based on status filter
    let invites
    let countResult

    if (status === "all") {
      invites = await sql`
        SELECT id, email, name, invited_by, invited_by_email, tier, message, token, status, accepted_at, accepted_by, expires_at, created_at
        FROM platform_invites
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM platform_invites
      `
    } else {
      invites = await sql`
        SELECT id, email, name, invited_by, invited_by_email, tier, message, token, status, accepted_at, accepted_by, expires_at, created_at
        FROM platform_invites
        WHERE status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM platform_invites WHERE status = ${status}
      `
    }

    const total = parseInt(countResult[0]?.total as string) || 0

    // Get status counts
    const statusCountsResult = await sql`
      SELECT status, COUNT(*) as count FROM platform_invites GROUP BY status
    `
    const statusCounts: Record<string, number> = { pending: 0, accepted: 0, expired: 0, revoked: 0 }
    for (const row of statusCountsResult) {
      statusCounts[row.status as string] = parseInt(row.count as string)
    }

    return NextResponse.json({
      invites: invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        name: inv.name,
        invitedBy: inv.invited_by,
        invitedByEmail: inv.invited_by_email,
        tier: inv.tier,
        message: inv.message,
        token: inv.token,
        status: inv.status,
        acceptedAt: inv.accepted_at,
        acceptedBy: inv.accepted_by,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
        inviteLink: `${APP_URL}/invite/${inv.token}`,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts,
    })
  } catch (error) {
    console.error("[super-admin/users/invites] GET Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { inviteId } = body

    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID is required" }, { status: 400 })
    }

    // Check if invite exists and is pending
    const existing = await sql`
      SELECT id, email, status FROM platform_invites WHERE id = ${inviteId}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    if (existing[0].status !== "pending") {
      return NextResponse.json(
        { error: `Cannot revoke an invite with status: ${existing[0].status}` },
        { status: 400 }
      )
    }

    // Revoke the invite
    await sql`
      UPDATE platform_invites
      SET status = 'revoked', updated_at = NOW()
      WHERE id = ${inviteId}
    `

    await logPlatformActivity(
      "user.invite_revoked",
      { inviteId, invitedEmail: existing[0].email },
      { targetType: "invite", targetId: inviteId }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[super-admin/users/invites] DELETE Error:", error)
    return NextResponse.json(
      { error: "Failed to revoke invite" },
      { status: 500 }
    )
  }
}

// Resend an invite
export async function POST(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { inviteId } = body

    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID is required" }, { status: 400 })
    }

    // Get the invite
    const existing = await sql`
      SELECT id, email, name, message, token, status, invited_by_email
      FROM platform_invites WHERE id = ${inviteId}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    const invite = existing[0]

    if (invite.status !== "pending" && invite.status !== "expired") {
      return NextResponse.json(
        { error: `Cannot resend an invite with status: ${invite.status}` },
        { status: 400 }
      )
    }

    // Reset expiry and status
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await sql`
      UPDATE platform_invites
      SET status = 'pending', expires_at = ${newExpiry.toISOString()}, updated_at = NOW()
      WHERE id = ${inviteId}
    `

    // Resend email
    const COMPANY_NAME = process.env.COMPANY_NAME || 'CNCPT Web'
    const inviteLink = `${APP_URL}/invite/${invite.token}`
    const personalMessage = invite.message
      ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;background:#f9fafb;padding:16px;border-radius:8px;border-left:4px solid #3b82f6;">
          <em>"${invite.message}"</em>
        </p>`
      : ""

    try {
      const { sendEmail } = await import("@/lib/email")
      await sendEmail({
        to: invite.email as string,
        subject: `Reminder: You're invited to join ${COMPANY_NAME}`,
        html: `
          <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#18181b;">You're Invited!</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            ${invite.name ? `Hi ${invite.name},` : "Hi,"}
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            This is a reminder that you've been invited to join ${COMPANY_NAME}.
          </p>
          ${personalMessage}
          <div style="text-align:center;margin:32px 0;">
            <a href="${inviteLink}" style="display:inline-block;padding:14px 32px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:500;">
              Accept Invitation
            </a>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
            This invitation expires in 7 days.
          </p>
        `,
      })
    } catch (emailError) {
      console.error("[invite] Failed to resend invite email:", emailError)
    }

    await logPlatformActivity(
      "user.invite_resent",
      { inviteId, invitedEmail: invite.email },
      { targetType: "invite", targetId: inviteId }
    )

    return NextResponse.json({ success: true, newExpiresAt: newExpiry.toISOString() })
  } catch (error) {
    console.error("[super-admin/users/invites] POST Error:", error)
    return NextResponse.json(
      { error: "Failed to resend invite" },
      { status: 500 }
    )
  }
}
