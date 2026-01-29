import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { updateTeamMemberRole, removeTeamMember, getTeam } from "@/lib/teams"
import { getTeamMembership, canManageRole } from "@/lib/team-auth"
import type { TeamRole } from "@/lib/team-auth"
import { logPlatformActivity } from "@/lib/super-admin"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; memberId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, memberId } = await params
    const body = await request.json()
    const { role } = body

    // Validate role
    const validRoles: TeamRole[] = ["admin", "member", "viewer"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, member, or viewer" },
        { status: 400 }
      )
    }

    // Check current user's membership
    const currentMembership = await getTeamMembership(user.id, teamId)
    if (!currentMembership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get target member
    const targetResult = await sql`
      SELECT id, user_id, role FROM team_members WHERE id = ${memberId} AND team_id = ${teamId}
    `
    if (targetResult.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const targetMember = targetResult[0]
    const targetRole = targetMember.role as TeamRole

    // Cannot change owner role
    if (targetRole === "owner") {
      return NextResponse.json(
        { error: "Cannot change the owner's role" },
        { status: 403 }
      )
    }

    // Check if user can manage the target's current role
    if (!canManageRole(currentMembership.role, targetRole)) {
      return NextResponse.json(
        { error: "You cannot manage this member's role" },
        { status: 403 }
      )
    }

    // Check if user can assign the new role
    if (!canManageRole(currentMembership.role, role)) {
      return NextResponse.json(
        { error: "You cannot assign this role" },
        { status: 403 }
      )
    }

    const success = await updateTeamMemberRole(memberId, role)
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update member role" },
        { status: 500 }
      )
    }

    await logPlatformActivity(
      "team.member_role_change",
      { teamId, memberId, previousRole: targetRole, newRole: role },
      { targetType: "team_member", targetId: memberId }
    )

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error("[teams/[teamId]/members/[memberId]] PATCH Error:", error)
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; memberId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, memberId } = await params

    // Check current user's membership
    const currentMembership = await getTeamMembership(user.id, teamId)
    if (!currentMembership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get target member
    const targetResult = await sql`
      SELECT id, user_id, role FROM team_members WHERE id = ${memberId} AND team_id = ${teamId}
    `
    if (targetResult.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const targetMember = targetResult[0]
    const targetUserId = targetMember.user_id as string
    const targetRole = targetMember.role as TeamRole

    // Cannot remove owner
    if (targetRole === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the team owner" },
        { status: 403 }
      )
    }

    // Users can remove themselves
    const isSelfRemoval = targetUserId === user.id

    // If not self-removal, check permission to remove members
    if (!isSelfRemoval) {
      if (!canManageRole(currentMembership.role, targetRole)) {
        return NextResponse.json(
          { error: "You cannot remove this member" },
          { status: 403 }
        )
      }
    }

    const success = await removeTeamMember(memberId)
    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      )
    }

    await logPlatformActivity(
      isSelfRemoval ? "team.member_leave" : "team.member_remove",
      { teamId, memberId, targetUserId },
      { targetType: "team_member", targetId: memberId }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[teams/[teamId]/members/[memberId]] DELETE Error:", error)
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    )
  }
}
