import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { createTeam, getUserTeams } from "@/lib/teams"
import { logPlatformActivity } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teams = await getUserTeams(user.id)

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("[teams] GET Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, logoUrl } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      )
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: "Team name must be 255 characters or less" },
        { status: 400 }
      )
    }

    const team = await createTeam(name.trim(), user.id, {
      description,
      logoUrl,
      billingEmail: user.primaryEmail || undefined,
    })

    if (!team) {
      return NextResponse.json(
        { error: "Failed to create team" },
        { status: 500 }
      )
    }

    // Log team creation
    await logPlatformActivity(
      "team.create",
      { teamId: team.id, teamName: team.name, teamSlug: team.slug },
      { targetType: "team", targetId: team.id }
    )

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error("[teams] POST Error:", error)
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    )
  }
}
