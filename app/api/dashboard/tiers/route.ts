import { NextResponse } from "next/server"
import { getAllTiers } from "@/lib/tiers"
import { stackServerApp } from "@/stack"

export const dynamic = "force-dynamic"

/**
 * Active subscription tiers for the create-site wizard and plan pickers.
 * Any signed-in user may read these (pricing is public on /pricing anyway) —
 * the previous wizard called the super-admin /api/admin/tiers endpoint and
 * got a 401, which left the plan list empty and dead-ended site creation.
 */
export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tiers = await getAllTiers()
    return NextResponse.json({ tiers })
  } catch (error) {
    console.error("[API] Error fetching tiers:", error)
    return NextResponse.json({ error: "Failed to fetch tiers" }, { status: 500 })
  }
}
