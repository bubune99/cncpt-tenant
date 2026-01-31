import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId } = await params

    // Prevent self-impersonation
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot impersonate yourself" },
        { status: 400 }
      )
    }

    const targetUser = await stackServerApp.getUser({ userId })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Log impersonation
    await logPlatformActivity(
      "user.impersonate",
      {
        targetUserId: userId,
        targetEmail: targetUser.primaryEmail,
        adminUserId: currentUser.id,
        adminEmail: currentUser.primaryEmail,
      },
      { targetType: "user", targetId: userId }
    )

    // Note: Actual impersonation logic depends on Stack Auth capabilities
    // This might involve creating a special session token
    // For now, we return info that could be used by the frontend
    return NextResponse.json({
      success: true,
      message: "Impersonation initiated",
      targetUser: {
        id: targetUser.id,
        email: targetUser.primaryEmail,
        displayName: targetUser.displayName,
      },
      // In a real implementation, you might return a special token or redirect URL
      // impersonationToken: await createImpersonationToken(userId, currentUser.id)
    })
  } catch (error) {
    console.error("[super-admin/users/[userId]/impersonate] Error:", error)
    return NextResponse.json(
      { error: "Failed to impersonate user" },
      { status: 500 }
    )
  }
}
