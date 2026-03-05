import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"
import { sendEmail } from "@/lib/email"
import { randomBytes } from "crypto"

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const COMPANY_NAME = process.env.COMPANY_NAME || 'CNCPT Web'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, tier, message } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Ensure the table exists
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

    // Check if there's already a pending invite for this email
    const existing = await sql`
      SELECT id, status FROM platform_invites
      WHERE email = ${email.toLowerCase()} AND status = 'pending' AND expires_at > NOW()
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A pending invite already exists for this email" },
        { status: 409 }
      )
    }

    // Check if user already exists on the platform
    const existingUsers = await stackServerApp.listUsers()
    const alreadyExists = existingUsers.find(
      (u) => u.primaryEmail?.toLowerCase() === email.toLowerCase()
    )
    if (alreadyExists) {
      return NextResponse.json(
        { error: "A user with this email already exists on the platform" },
        { status: 409 }
      )
    }

    // Generate unique invite token
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    // Create invite record
    const result = await sql`
      INSERT INTO platform_invites (email, name, invited_by, invited_by_email, tier, message, token, expires_at)
      VALUES (
        ${email.toLowerCase()},
        ${name || null},
        ${currentUser.id},
        ${currentUser.primaryEmail || null},
        ${tier || 'starter'},
        ${message || null},
        ${token},
        ${expiresAt.toISOString()}
      )
      RETURNING id, email, name, tier, token, status, expires_at, created_at
    `

    const invite = result[0]

    // Generate invite link
    const inviteLink = `${APP_URL}/invite/${token}`

    // Send invite email
    const personalMessage = message
      ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;background:#f9fafb;padding:16px;border-radius:8px;border-left:4px solid #3b82f6;">
          <em>"${message}"</em>
        </p>`
      : ""

    try {
      await sendEmail({
        to: email,
        subject: `You're invited to join ${COMPANY_NAME}`,
        html: `
          <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#18181b;">You're Invited!</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            ${name ? `Hi ${name},` : "Hi,"}
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            ${currentUser.displayName || currentUser.primaryEmail} has invited you to join ${COMPANY_NAME} — a powerful platform for building and managing websites.
          </p>
          ${personalMessage}
          <div style="text-align:center;margin:32px 0;">
            <a href="${inviteLink}" style="display:inline-block;padding:14px 32px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:500;">
              Accept Invitation
            </a>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
            This invitation expires in 7 days. If the button doesn't work, copy and paste this link:
          </p>
          <p style="margin:0 0 24px;font-size:13px;color:#3b82f6;word-break:break-all;">
            ${inviteLink}
          </p>
        `,
      })
    } catch (emailError) {
      console.error("[invite] Failed to send invite email:", emailError)
      // Don't fail the invite creation if email fails
    }

    // Log the invite
    await logPlatformActivity(
      "user.invite",
      {
        invitedEmail: email,
        invitedName: name,
        tier,
        inviteId: invite.id,
      },
      { targetType: "invite", targetId: invite.id as string }
    )

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        name: invite.name,
        tier: invite.tier,
        status: invite.status,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
        inviteLink,
      },
    })
  } catch (error) {
    console.error("[super-admin/users/invite] Error:", error)
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    )
  }
}
