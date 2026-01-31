import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

// Platform settings are stored in a simple key-value table
// We'll create this table if it doesn't exist

const DEFAULT_SETTINGS = {
  platformName: "CNCPT",
  supportEmail: "",
  maintenanceMode: false,
  registrationEnabled: true,
  inviteOnlyMode: false,
  maxSubdomainsPerUser: 10,
  maxTeamsPerUser: 5,
  maxMembersPerTeam: 50,
  defaultTrialDays: 14,
  requireEmailVerification: true,
  allowCustomDomains: true,
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Try to get settings from database
    try {
      const result = await sql`
        SELECT key, value FROM platform_settings
      `

      const settings = { ...DEFAULT_SETTINGS }
      for (const row of result) {
        const key = row.key as string
        if (key in settings) {
          try {
            ;(settings as Record<string, unknown>)[key] = JSON.parse(row.value as string)
          } catch {
            ;(settings as Record<string, unknown>)[key] = row.value
          }
        }
      }

      return NextResponse.json({ settings })
    } catch {
      // Table might not exist yet, return defaults
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }
  } catch (error) {
    console.error("[super-admin/settings] GET Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    // Ensure settings table exists
    await sql`
      CREATE TABLE IF NOT EXISTS platform_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by VARCHAR(255)
      )
    `

    // Update each setting
    const allowedKeys = Object.keys(DEFAULT_SETTINGS)
    const updatedSettings: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key)) {
        const stringValue = typeof value === "string" ? value : JSON.stringify(value)

        await sql`
          INSERT INTO platform_settings (key, value, updated_by)
          VALUES (${key}, ${stringValue}, ${currentUser.id})
          ON CONFLICT (key) DO UPDATE SET
            value = ${stringValue},
            updated_at = NOW(),
            updated_by = ${currentUser.id}
        `

        updatedSettings[key] = value
      }
    }

    // Log the change
    await logPlatformActivity(
      "settings.update",
      { changes: updatedSettings },
      { targetType: "settings", targetId: "platform" }
    )

    // Return updated settings
    const result = await sql`
      SELECT key, value FROM platform_settings
    `

    const settings = { ...DEFAULT_SETTINGS }
    for (const row of result) {
      const key = row.key as string
      if (key in settings) {
        try {
          ;(settings as Record<string, unknown>)[key] = JSON.parse(row.value as string)
        } catch {
          ;(settings as Record<string, unknown>)[key] = row.value
        }
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[super-admin/settings] PATCH Error:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
