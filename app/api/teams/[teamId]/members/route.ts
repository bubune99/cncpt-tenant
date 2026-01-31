import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { getTeamMembers, addTeamMember } from "@/lib/teams"
import { hasTeamAccess, getTeamMembership, canManageRole } from "@/lib/team-auth"
import type { TeamRole } from "@/lib/team-auth"
import { logPlatformActivity } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

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
    const hasAccess = await hasTeamAccess(user.id, teamId, "members.view")
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const members = await getTeamMembers(teamId)

    return NextResponse.json({ members })
  } catch (error) {
    console.error("[teams/[teamId]/members] GET Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch members" },
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
    const { userId, email, role = "member" } = body

    // Validate role
    const validRoles: TeamRole[] = ["admin", "member", "viewer"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, member, or viewer" },
        { status: 400 }
      )
    }

    // Check permission to add members
    const currentMembership = await getTeamMembership(user.id, teamId)
    if (!currentMembership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if user can assign this role
    if (!canManageRole(currentMembership.role, role)) {
      return NextResponse.json(
        { error: "You cannot assign this role" },
        { status: 403 }
      )
    }

    // Find user by ID or email
    let targetUserId = userId
    if (!targetUserId && email) {
      const users = await stackServerApp.listUsers()
      const targetUser = users.find(
        (u) => u.primaryEmail?.toLowerCase() === email.toLowerCase()
      )
      if (!targetUser) {
        return NextResponse.json(
          { error: "User not found. They may need to sign up first." },
          { status: 404 }
        )
      }
      targetUserId = targetUser.id
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Either userId or email is required" },
        { status: 400 }
      )
    }

    // Check if already a member
    const existingMembership = await getTeamMembership(targetUserId, teamId)
    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      )
    }

    const member = await addTeamMember(teamId, targetUserId, role, user.id)

    if (!member) {
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 500 }
      )
    }

    await logPlatformActivity(
      "team.member_add",
      { teamId, targetUserId, role },
      { targetType: "team_member", targetId: member.id }
    )

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error("[teams/[teamId]/members] POST Error:", error)
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    )
  }
}
