import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { subdomain } = await params
    const body = await request.json()
    const { newOwnerId, newOwnerEmail } = body

    if (!newOwnerId && !newOwnerEmail) {
      return NextResponse.json(
        { error: "Either newOwnerId or newOwnerEmail is required" },
        { status: 400 }
      )
    }

    // Get current subdomain info
    const subdomainResult = await sql`
      SELECT id, user_id FROM subdomains WHERE subdomain = ${subdomain}
    `

    if (subdomainResult.length === 0) {
      return NextResponse.json({ error: "Subdomain not found" }, { status: 404 })
    }

    const currentOwnerId = subdomainResult[0].user_id as string

    // Find new owner
    let targetUserId = newOwnerId
    if (!targetUserId && newOwnerEmail) {
      // Search by email in Stack Auth
      const users = await stackServerApp.listUsers()
      const targetUser = users.find(
        (u) => u.primaryEmail?.toLowerCase() === newOwnerEmail.toLowerCase()
      )
      if (!targetUser) {
        return NextResponse.json(
          { error: "User with that email not found" },
          { status: 404 }
        )
      }
      targetUserId = targetUser.id
    }

    // Verify target user exists
    const targetUser = await stackServerApp.getUser({ userId: targetUserId })
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      )
    }

    // Get current owner info for logging
    let currentOwnerEmail = ""
    try {
      const currentOwner = await stackServerApp.getUser({ userId: currentOwnerId })
      currentOwnerEmail = currentOwner?.primaryEmail || ""
    } catch {
      // Owner may have been deleted
    }

    // Transfer ownership
    await sql`
      UPDATE subdomains
      SET user_id = ${targetUserId}
      WHERE subdomain = ${subdomain}
    `

    // Log the transfer
    await logPlatformActivity(
      "subdomain.transfer",
      {
        subdomain,
        previousOwnerId: currentOwnerId,
        previousOwnerEmail: currentOwnerEmail,
        newOwnerId: targetUserId,
        newOwnerEmail: targetUser.primaryEmail,
      },
      { targetType: "subdomain", targetId: subdomain }
    )

    return NextResponse.json({
      success: true,
      subdomain,
      previousOwner: {
        id: currentOwnerId,
        email: currentOwnerEmail,
      },
      newOwner: {
        id: targetUserId,
        email: targetUser.primaryEmail,
        displayName: targetUser.displayName,
      },
    })
  } catch (error) {
    console.error("[super-admin/subdomains/[subdomain]/transfer] Error:", error)
    return NextResponse.json(
      { error: "Failed to transfer subdomain" },
      { status: 500 }
    )
  }
}
