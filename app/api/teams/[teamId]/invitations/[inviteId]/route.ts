import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { cancelInvitation } from "@/lib/teams"
import { hasTeamAccess } from "@/lib/team-auth"
import { logPlatformActivity } from "@/lib/super-admin"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; inviteId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, inviteId } = await params

    // Check permission to cancel invitations
    const hasAccess = await hasTeamAccess(user.id, teamId, "invitations.cancel")
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const success = await cancelInvitation(inviteId)
    if (!success) {
      return NextResponse.json(
        { error: "Failed to cancel invitation" },
        { status: 500 }
      )
    }

    await logPlatformActivity(
      "team.invitation_cancel",
      { teamId, invitationId: inviteId },
      { targetType: "team_invitation", targetId: inviteId }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[teams/[teamId]/invitations/[inviteId]] DELETE Error:", error)
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    )
  }
}
