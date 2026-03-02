import { NextResponse } from "next/server"
import { getTiersWithCounts } from "@/lib/tiers"
import { stackServerApp } from "@/stack"
import { isSuperAdmin } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user || !(await isSuperAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tiers = await getTiersWithCounts()
    return NextResponse.json({ tiers })
  } catch (error) {
    console.error("[API] Error fetching tiers:", error)
    return NextResponse.json(
      { error: "Failed to fetch tiers" },
      { status: 500 }
    )
  }
}
