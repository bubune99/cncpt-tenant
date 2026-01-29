import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin } from "@/lib/super-admin"
import { getAllTeams } from "@/lib/teams"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const search = searchParams.get("search") || undefined

    const result = await getAllTeams({ page, limit, search })

    return NextResponse.json({
      teams: result.teams,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    })
  } catch (error) {
    console.error("[super-admin/teams] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    )
  }
}
