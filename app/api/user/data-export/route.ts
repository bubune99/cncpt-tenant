import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id
    const email = user.primaryEmail || ""

    // Gather all user data
    const [subdomains, teams, activityLogs] = await Promise.all([
      sql`
        SELECT subdomain, emoji, created_at
        FROM subdomains
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `.catch(() => []),
      sql`
        SELECT t.name, t.slug, tm.role, tm.joined_at
        FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE tm.user_id = ${userId}
        ORDER BY tm.joined_at DESC
      `.catch(() => []),
      sql`
        SELECT action, target_type, target_id, details, created_at
        FROM platform_activity_log
        WHERE actor_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1000
      `.catch(() => []),
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: userId,
        email,
        displayName: user.displayName,
      },
      subdomains,
      teams,
      activityLogs,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="data-export-${userId}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error("[Data Export] Error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
