import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

// PATCH: Update subdomain (reassign to different user)
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { subdomainId, newUserId, newUserEmail } = body

    if (!subdomainId) {
      return NextResponse.json({ error: "Subdomain ID is required" }, { status: 400 })
    }

    // Get the current subdomain
    const existing = await sql`
      SELECT * FROM subdomains WHERE id = ${subdomainId}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Subdomain not found" }, { status: 404 })
    }

    const oldUserId = existing[0].user_id

    // Update the subdomain owner
    await sql`
      UPDATE subdomains
      SET user_id = ${newUserId || null},
          updated_at = NOW()
      WHERE id = ${subdomainId}
    `

    // Log this action
    await sql`
      INSERT INTO activity_logs (
        actor_id, actor_email, action, target_type, target_id, details, created_at
      ) VALUES (
        ${currentUser.id},
        ${currentUser.primaryEmail},
        'subdomain.reassign',
        'subdomain',
        ${subdomainId.toString()},
        ${JSON.stringify({
          subdomain: existing[0].subdomain,
          oldUserId,
          newUserId,
          newUserEmail,
        })},
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      message: `Subdomain ${existing[0].subdomain} reassigned successfully`,
    })
  } catch (error) {
    console.error("[super-admin/subdomains] PATCH Error:", error)
    return NextResponse.json(
      { error: "Failed to update subdomain" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    let whereClause = ""
    if (search) {
      whereClause = `WHERE subdomain ILIKE '%${search.replace(/'/g, "''")}%'`
    }

    const subdomainsResult = await sql`
      SELECT s.id, s.subdomain, s.emoji, s.user_id, s.created_at,
             (SELECT COUNT(*) FROM team_subdomains WHERE subdomain = s.subdomain) as team_share_count
      FROM subdomains s
      ${sql.unsafe(whereClause)}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*) as total FROM subdomains ${sql.unsafe(whereClause)}
    `

    // Enrich with user info
    const userIds = [...new Set(subdomainsResult.map((s) => s.user_id as string))]
    const userMap = new Map()

    for (const userId of userIds) {
      try {
        const user = await stackServerApp.getUser({ userId })
        if (user) {
          userMap.set(userId, {
            id: user.id,
            email: user.primaryEmail,
            displayName: user.displayName,
          })
        }
      } catch {
        // User may have been deleted
      }
    }

    const subdomains = subdomainsResult.map((s) => ({
      id: s.id,
      subdomain: s.subdomain,
      emoji: s.emoji,
      userId: s.user_id,
      owner: userMap.get(s.user_id as string) || null,
      createdAt: s.created_at,
      teamShareCount: parseInt(s.team_share_count as string) || 0,
    }))

    return NextResponse.json({
      subdomains,
      total: parseInt(countResult[0]?.total as string) || 0,
      page,
      limit,
      totalPages: Math.ceil((parseInt(countResult[0]?.total as string) || 0) / limit),
    })
  } catch (error) {
    console.error("[super-admin/subdomains] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subdomains" },
      { status: 500 }
    )
  }
}
