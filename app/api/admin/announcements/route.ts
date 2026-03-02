import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { isSuperAdmin } from "@/lib/super-admin"
import { stackServerApp } from "@/stack"

export const dynamic = 'force-dynamic'

// Ensure table exists
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS platform_announcements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      active BOOLEAN NOT NULL DEFAULT true,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ
    )
  `
}

// GET - list active announcements (authenticated users)
export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureTable()

    const announcements = await sql`
      SELECT id, title, message, type, active, created_by, created_at, expires_at
      FROM platform_announcements
      WHERE active = true AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT 10
    `

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error("[Announcements] Error:", error)
    return NextResponse.json({ announcements: [] })
  }
}

// POST - create announcement (super admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user || !(await isSuperAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await ensureTable()

    const body = await request.json()
    const { title, message, type = "info", expiresAt } = body

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO platform_announcements (title, message, type, created_by, expires_at)
      VALUES (${title}, ${message}, ${type}, ${user.primaryEmail || 'system'}, ${expiresAt || null})
      RETURNING id, title, message, type, active, created_by, created_at, expires_at
    `

    return NextResponse.json({ announcement: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[Announcements] Error creating:", error)
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 })
  }
}

// DELETE - deactivate announcement (super admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user || !(await isSuperAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    await sql`UPDATE platform_announcements SET active = false WHERE id = ${parseInt(id)}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Announcements] Error deleting:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
