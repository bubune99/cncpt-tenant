import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin, getPlatformActivityLogs } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const action = searchParams.get("action") || undefined
    const actorId = searchParams.get("actorId") || undefined
    const targetType = searchParams.get("targetType") || undefined
    const targetId = searchParams.get("targetId") || undefined
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined

    const result = await getPlatformActivityLogs({
      page,
      limit,
      action,
      actorId,
      targetType,
      targetId,
      startDate,
      endDate,
    })

    return NextResponse.json({
      logs: result.logs,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    })
  } catch (error) {
    console.error("[super-admin/activity-log] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    )
  }
}
