import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { acceptInvitation, getInvitationByToken } from "@/lib/teams"
import { logPlatformActivity } from "@/lib/super-admin"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params

    // Get invitation to check email match
    const invitation = await getInvitationByToken(token)
    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    // Check if user email matches invitation email
    const userEmail = user.primaryEmail?.toLowerCase() || ""
    const inviteEmail = invitation.email.toLowerCase()

    if (userEmail !== inviteEmail) {
      return NextResponse.json(
        {
          error: "Email mismatch",
          message: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
        },
        { status: 403 }
      )
    }

    const result = await acceptInvitation(token, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    await logPlatformActivity(
      "team.invitation_accept",
      {
        teamId: result.teamId,
        invitationEmail: invitation.email,
        role: invitation.role,
      },
      { targetType: "team", targetId: result.teamId }
    )

    return NextResponse.json({
      success: true,
      teamId: result.teamId,
      redirectUrl: `/dashboard/teams/${result.teamId}`,
    })
  } catch (error) {
    console.error("[teams/invitations/[token]/accept] POST Error:", error)
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    )
  }
}
