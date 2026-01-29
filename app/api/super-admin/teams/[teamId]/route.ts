import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"
import {
  getTeam,
  getTeamMembers,
  getTeamSubdomains,
  getTeamInvitations,
  updateTeam,
  deleteTeam,
} from "@/lib/teams"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { teamId } = await params
    const team = await getTeam(teamId)

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get additional details
    const [members, subdomains, invitations] = await Promise.all([
      getTeamMembers(teamId),
      getTeamSubdomains(teamId),
      getTeamInvitations(teamId),
    ])

    // Get owner details
    let ownerDetails = null
    try {
      const owner = await stackServerApp.getUser({ userId: team.ownerId })
      if (owner) {
        ownerDetails = {
          id: owner.id,
          email: owner.primaryEmail,
          displayName: owner.displayName,
        }
      }
    } catch {
      // Owner may have been deleted
    }

    return NextResponse.json({
      team: {
        ...team,
        owner: ownerDetails,
      },
      members,
      subdomains,
      invitations,
    })
  } catch (error) {
    console.error("[super-admin/teams/[teamId]] Error:", error)
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { teamId } = await params
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
      { teamId, teamName: team.name, changes: body },
      { targetType: "team", targetId: teamId }
    )

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    console.error("[super-admin/teams/[teamId]] PATCH Error:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { teamId } = await params
    const team = await getTeam(teamId)

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Log before deletion
    await logPlatformActivity(
      "team.delete",
      { teamId, teamName: team.name, teamSlug: team.slug },
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
    console.error("[super-admin/teams/[teamId]] DELETE Error:", error)
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
  }
}
