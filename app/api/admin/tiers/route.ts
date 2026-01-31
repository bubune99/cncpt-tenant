import { NextResponse } from "next/server"
import { getTiersWithCounts } from "@/lib/tiers"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
