import { NextRequest, NextResponse } from "next/server"
import { getClientActivityLog } from "@/lib/clients"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const resolvedParams = await params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    const activities = await getClientActivityLog(resolvedParams.clientId, limit)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("[API] Error fetching client activity:", error)
    return NextResponse.json({ activities: [] })
  }
}
