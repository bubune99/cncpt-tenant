import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { getTeamSubdomains, shareSubdomainWithTeam, removeSubdomainFromTeam } from "@/lib/teams"
import { hasTeamAccess } from "@/lib/team-auth"
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
    const hasAccess = await hasTeamAccess(user.id, teamId, "subdomains.view")
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const subdomains = await getTeamSubdomains(teamId)

    // Enrich with subdomain details
    const enrichedSubdomains = await Promise.all(
      subdomains.map(async (ts) => {
        const subdomainResult = await sql`
          SELECT emoji, user_id, created_at FROM subdomains WHERE subdomain = ${ts.subdomain}
        `
        const subdomainData = subdomainResult[0]

        let ownerInfo = null
        if (subdomainData?.user_id) {
          try {
            const owner = await stackServerApp.getUser({ userId: subdomainData.user_id as string })
            if (owner) {
              ownerInfo = {
                id: owner.id,
                email: owner.primaryEmail,
                displayName: owner.displayName,
              }
            }
          } catch {
            // Owner may have been deleted
          }
        }

        return {
          ...ts,
          emoji: subdomainData?.emoji || null,
          owner: ownerInfo,
          subdomainCreatedAt: subdomainData?.created_at || null,
        }
      })
    )

    return NextResponse.json({ subdomains: enrichedSubdomains })
  } catch (error) {
    console.error("[teams/[teamId]/subdomains] GET Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subdomains" },
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
    const { subdomain, accessLevel = "edit" } = body

    if (!subdomain || typeof subdomain !== "string") {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 }
      )
    }

    // Validate access level
    const validAccessLevels = ["view", "edit", "admin"]
    if (!validAccessLevels.includes(accessLevel)) {
      return NextResponse.json(
        { error: "Invalid access level. Must be view, edit, or admin" },
        { status: 400 }
      )
    }

    // Check permission to add subdomains
    const hasAccess = await hasTeamAccess(user.id, teamId, "subdomains.add")
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Verify user owns the subdomain
    const subdomainResult = await sql`
      SELECT user_id FROM subdomains WHERE subdomain = ${subdomain}
    `
    if (subdomainResult.length === 0) {
      return NextResponse.json(
        { error: "Subdomain not found" },
        { status: 404 }
      )
    }

    if (subdomainResult[0].user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only share subdomains you own" },
        { status: 403 }
      )
    }

    const teamSubdomain = await shareSubdomainWithTeam(
      subdomain,
      teamId,
      accessLevel,
      user.id
    )

    if (!teamSubdomain) {
      return NextResponse.json(
        { error: "Failed to share subdomain" },
        { status: 500 }
      )
    }

    await logPlatformActivity(
      "team.subdomain_share",
      { teamId, subdomain, accessLevel },
      { targetType: "team_subdomain", targetId: teamSubdomain.id }
    )

    return NextResponse.json({ teamSubdomain }, { status: 201 })
  } catch (error) {
    console.error("[teams/[teamId]/subdomains] POST Error:", error)
    return NextResponse.json(
      { error: "Failed to share subdomain" },
      { status: 500 }
    )
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
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get("subdomain")

    if (!subdomain) {
      return NextResponse.json(
        { error: "Subdomain query parameter is required" },
        { status: 400 }
      )
    }

    // Check permission to remove subdomains
    const hasAccess = await hasTeamAccess(user.id, teamId, "subdomains.remove")
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const success = await removeSubdomainFromTeam(teamId, subdomain)
    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove subdomain" },
        { status: 500 }
      )
    }

    await logPlatformActivity(
      "team.subdomain_remove",
      { teamId, subdomain },
      { targetType: "subdomain", targetId: subdomain }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[teams/[teamId]/subdomains] DELETE Error:", error)
    return NextResponse.json(
      { error: "Failed to remove subdomain" },
      { status: 500 }
    )
  }
}
