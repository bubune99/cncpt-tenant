import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { stackServerApp } from "@/stack"
import { getUserTeams } from "@/lib/teams"

export const dynamic = "force-dynamic"

/**
 * Team messages — REAL in-app team chat. A lightweight per-team channel feed
 * (default channel "general"). Membership-gated: a user can only read/post to
 * teams they belong to. The table is created idempotently on first use
 * (same lazy pattern as the rate-limit rules table) so no migration step is
 * required to ship.
 */

let ensured = false
async function ensureTable() {
  if (ensured) return
  await sql`
    CREATE TABLE IF NOT EXISTS team_messages (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id    uuid NOT NULL,
      channel    text NOT NULL DEFAULT 'general',
      user_id    varchar(255) NOT NULL,
      user_name  text,
      body       text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_team_messages_team_channel ON team_messages (team_id, channel, created_at)`
  ensured = true
}

async function isMember(userId: string, teamId: string): Promise<boolean> {
  const teams = await getUserTeams(userId)
  return teams.some((t: any) => t.id === teamId)
}

function displayName(user: any): string {
  return (user?.displayName as string) || (user?.primaryEmail as string) || "Member"
}

export async function GET(request: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = request.nextUrl.searchParams.get("teamId")
  const channel = request.nextUrl.searchParams.get("channel") || "general"
  if (!teamId) return NextResponse.json({ error: "teamId is required" }, { status: 400 })

  if (!(await isMember(user.id, teamId))) {
    return NextResponse.json({ error: "Not a member of this team" }, { status: 403 })
  }

  try {
    await ensureTable()
    const messages = await sql`
      SELECT id, team_id, channel, user_id, user_name, body, created_at
      FROM team_messages
      WHERE team_id = ${teamId} AND channel = ${channel}
      ORDER BY created_at ASC
      LIMIT 100
    `
    return NextResponse.json({ messages, me: user.id })
  } catch (error) {
    console.error("[dashboard/team-messages] GET Error:", error)
    return NextResponse.json({ messages: [], me: user.id })
  }
}

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const teamId = typeof body.teamId === "string" ? body.teamId : null
    const channel = typeof body.channel === "string" && body.channel ? body.channel : "general"
    const text = typeof body.body === "string" ? body.body.trim() : ""
    if (!teamId) return NextResponse.json({ error: "teamId is required" }, { status: 400 })
    if (!text) return NextResponse.json({ error: "Message is empty" }, { status: 400 })
    if (text.length > 4000) return NextResponse.json({ error: "Message too long" }, { status: 400 })

    if (!(await isMember(user.id, teamId))) {
      return NextResponse.json({ error: "Not a member of this team" }, { status: 403 })
    }

    await ensureTable()
    const rows = await sql`
      INSERT INTO team_messages (team_id, channel, user_id, user_name, body)
      VALUES (${teamId}, ${channel}, ${user.id}, ${displayName(user)}, ${text})
      RETURNING id, team_id, channel, user_id, user_name, body, created_at
    `
    return NextResponse.json({ message: rows[0] }, { status: 201 })
  } catch (error) {
    console.error("[dashboard/team-messages] POST Error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
