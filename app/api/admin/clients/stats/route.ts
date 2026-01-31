import { NextResponse } from "next/server"
import { getClientStats } from "@/lib/clients"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getClientStats()
    return NextResponse.json({ stats })
  } catch (error) {
    console.error("[API] Error fetching client stats:", error)
    // Return empty stats if tables don't exist yet
    return NextResponse.json({
      stats: {
        total: 0,
        pendingApproval: 0,
        trial: 0,
        active: 0,
        suspended: 0,
        cancelled: 0,
        trialExpiringThisWeek: 0,
        newThisMonth: 0,
      },
    })
  }
}
