import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { createInvitation, getTeamInvitations, getTeam } from "@/lib/teams"
import { hasTeamAccess, getTeamMembership, canManageRole } from "@/lib/team-auth"
import type { TeamRole } from "@/lib/team-auth"
import { logPlatformActivity } from "@/lib/super-admin"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId } = await params

    // Check access
    const hasAccess = await hasTeamAccess(user.id, teamId, "invitations.view")
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const invitations = await getTeamInvitations(teamId)

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("[teams/[teamId]/invitations] GET Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId } = await params
    const body = await request.json()
    const { email, role = "member" } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: TeamRole[] = ["admin", "member", "viewer"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, member, or viewer" },
        { status: 400 }
      )
    }

    // Check permission to invite
    const currentMembership = await getTeamMembership(user.id, teamId)
    if (!currentMembership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if user can assign this role
    if (!canManageRole(currentMembership.role, role)) {
      return NextResponse.json(
        { error: "You cannot invite with this role" },
        { status: 403 }
      )
    }

    // Check if email is already a member
    const users = await stackServerApp.listUsers()
    const existingUser = users.find(
      (u) => u.primaryEmail?.toLowerCase() === email.toLowerCase()
    )
    if (existingUser) {
      const existingMembership = await getTeamMembership(existingUser.id, teamId)
      if (existingMembership) {
        return NextResponse.json(
          { error: "This user is already a team member" },
          { status: 400 }
        )
      }
    }

    const team = await getTeam(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const invitation = await createInvitation(teamId, email, role, user.id)

    if (!invitation) {
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      )
    }

    await logPlatformActivity(
      "team.invitation_send",
      { teamId, teamName: team.name, inviteeEmail: email, role },
      { targetType: "team_invitation", targetId: invitation.id }
    )

    // TODO: Send invitation email
    // await sendInvitationEmail(email, team, invitation.token)

    return NextResponse.json({
      invitation,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/teams/invite/${invitation.token}`,
    }, { status: 201 })
  } catch (error) {
    console.error("[teams/[teamId]/invitations] POST Error:", error)
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    )
  }
}
