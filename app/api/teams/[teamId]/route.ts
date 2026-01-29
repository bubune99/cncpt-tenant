import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { getTeam, updateTeam, deleteTeam, getTeamStats } from "@/lib/teams"
import { hasTeamAccess, getTeamMembership } from "@/lib/team-auth"
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
    const hasAccess = await hasTeamAccess(user.id, teamId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const team = await getTeam(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const membership = await getTeamMembership(user.id, teamId)
    const stats = await getTeamStats(teamId)

    return NextResponse.json({
      team,
      membership,
      stats,
    })
  } catch (error) {
    console.error("[teams/[teamId]] GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId } = await params

    // Check permission to edit team
    const hasAccess = await hasTeamAccess(user.id, teamId, "team.edit")
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, logoUrl, billingEmail, settings } = body

    const team = await getTeam(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const updatedTeam = await updateTeam(teamId, {
      name,
      description,
      logoUrl,
      billingEmail,
      settings,
    })

    await logPlatformActivity(
      "team.update",
      { teamId, changes: body },
      { targetType: "team", targetId: teamId }
    )

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    console.error("[teams/[teamId]] PATCH Error:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId } = await params

    // Only owner can delete team
    const membership = await getTeamMembership(user.id, teamId)
    if (!membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only the team owner can delete the team" },
        { status: 403 }
      )
    }

    const team = await getTeam(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    await logPlatformActivity(
      "team.delete",
      { teamId, teamName: team.name },
      { targetType: "team", targetId: teamId }
    )

    const success = await deleteTeam(teamId)
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete team" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[teams/[teamId]] DELETE Error:", error)
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
  }
}
