import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

export const dynamic = 'force-dynamic'
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"
import { getAllTeams, createTeam, updateTeam, deleteTeam, getTeam } from "@/lib/teams"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const search = searchParams.get("search") || undefined

    const result = await getAllTeams({ page, limit, search })

    return NextResponse.json({
      teams: result.teams,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    })
  } catch (error) {
    console.error("[super-admin/teams] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    )
  }
}

// POST: Create a new team
export async function POST(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, ownerId } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    // Use the current admin as owner if no owner specified
    const teamOwnerId = ownerId || currentUser.id

    const team = await createTeam(name.trim(), teamOwnerId, {
      description: description?.trim() || undefined,
    })

    if (!team) {
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
    }

    // Log the activity
    await logPlatformActivity(
      "team.create",
      {
        teamId: team.id,
        teamName: team.name,
        teamSlug: team.slug,
        ownerId: teamOwnerId,
        createdBy: "super_admin",
      },
      {
        actorId: currentUser.id,
        actorEmail: currentUser.primaryEmail || undefined,
        targetType: "team",
        targetId: team.id,
      }
    )

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: team.description,
        ownerId: team.ownerId,
        createdAt: team.createdAt,
      },
    })
  } catch (error) {
    console.error("[super-admin/teams] POST Error:", error)
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
}

// PATCH: Update a team
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { teamId, name, description } = body

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Get the existing team
    const existingTeam = await getTeam(teamId)
    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const updates: { name?: string; description?: string } = {}
    if (name?.trim() && name.trim() !== existingTeam.name) {
      updates.name = name.trim()
    }
    if (description !== undefined && description !== existingTeam.description) {
      updates.description = description?.trim() || ""
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, team: existingTeam })
    }

    const success = await updateTeam(teamId, updates)

    if (!success) {
      return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
    }

    // Log the activity
    await logPlatformActivity(
      "team.update",
      {
        teamId,
        updates,
        previousValues: {
          name: existingTeam.name,
          description: existingTeam.description,
        },
      },
      {
        actorId: currentUser.id,
        actorEmail: currentUser.primaryEmail || undefined,
        targetType: "team",
        targetId: teamId,
      }
    )

    return NextResponse.json({
      success: true,
      message: "Team updated successfully",
    })
  } catch (error) {
    console.error("[super-admin/teams] PATCH Error:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}

// DELETE: Delete a team
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Get the team before deleting for logging
    const team = await getTeam(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const success = await deleteTeam(teamId)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
    }

    // Log the activity
    await logPlatformActivity(
      "team.delete",
      {
        teamId,
        teamName: team.name,
        teamSlug: team.slug,
      },
      {
        actorId: currentUser.id,
        actorEmail: currentUser.primaryEmail || undefined,
        targetType: "team",
        targetId: teamId,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[super-admin/teams] DELETE Error:", error)
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
  }
}
