import { NextRequest, NextResponse } from "next/server"
import { getInvitationByToken } from "@/lib/teams"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const invitation = await getInvitationByToken(token)

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: "Invitation already accepted", status: "accepted" },
        { status: 400 }
      )
    }

    if (invitation.declinedAt) {
      return NextResponse.json(
        { error: "Invitation was declined", status: "declined" },
        { status: 400 }
      )
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired", status: "expired" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        team: invitation.team
          ? {
              id: invitation.team.id,
              name: invitation.team.name,
              slug: invitation.team.slug,
              description: invitation.team.description,
              logoUrl: invitation.team.logoUrl,
            }
          : null,
      },
    })
  } catch (error) {
    console.error("[teams/invitations/[token]] GET Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    )
  }
}
