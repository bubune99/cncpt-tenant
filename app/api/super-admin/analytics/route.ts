import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get total users from Stack Auth
    const users = await stackServerApp.listUsers()
    const totalUsers = users.length

    // Users created in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newUsers = users.filter(
      (u) => u.signedUpAt && new Date(u.signedUpAt) > thirtyDaysAgo
    ).length

    // Get subdomain stats
    const subdomainStats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30_days,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days
      FROM subdomains
    `

    // Get team stats
    const teamStats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30_days
      FROM teams
      WHERE deleted_at IS NULL
    `

    // Get team member stats
    const memberStats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(member_count)::numeric(10,2) as avg_team_size
      FROM team_members tm
      JOIN (
        SELECT team_id, COUNT(*) as member_count
        FROM team_members
        GROUP BY team_id
      ) mc ON tm.team_id = mc.team_id
    `

    // Get invitation stats
    const invitationStats = await sql`
      SELECT
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE accepted_at IS NOT NULL) as accepted,
        COUNT(*) FILTER (WHERE declined_at IS NOT NULL) as declined,
        COUNT(*) FILTER (WHERE accepted_at IS NULL AND declined_at IS NULL AND expires_at > NOW()) as pending
      FROM team_invitations
    `

    // Get activity stats (last 7 days)
    const activityStats = await sql`
      SELECT action, COUNT(*) as count
      FROM platform_activity_log
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `

    // Get daily signups for last 14 days
    const dailySignups = users
      .filter((u) => u.signedUpAt)
      .reduce(
        (acc, u) => {
          const date = new Date(u.signedUpAt!).toISOString().split("T")[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

    // Fill in missing dates
    const last14Days = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      last14Days.push({
        date: dateStr,
        count: dailySignups[dateStr] || 0,
      })
    }

    // Get top users by subdomain count
    const topUsersBySubdomains = await sql`
      SELECT user_id, COUNT(*) as subdomain_count
      FROM subdomains
      GROUP BY user_id
      ORDER BY subdomain_count DESC
      LIMIT 5
    `

    // Enrich with user info
    const topUsers = await Promise.all(
      topUsersBySubdomains.map(async (row) => {
        try {
          const user = await stackServerApp.getUser({ userId: row.user_id as string })
          return {
            userId: row.user_id,
            email: user?.primaryEmail || "Unknown",
            displayName: user?.displayName || null,
            subdomainCount: parseInt(row.subdomain_count as string),
          }
        } catch {
          return {
            userId: row.user_id,
            email: "Unknown",
            displayName: null,
            subdomainCount: parseInt(row.subdomain_count as string),
          }
        }
      })
    )

    return NextResponse.json({
      users: {
        total: totalUsers,
        newLast30Days: newUsers,
        dailySignups: last14Days,
      },
      subdomains: {
        total: parseInt(subdomainStats[0]?.total as string) || 0,
        last30Days: parseInt(subdomainStats[0]?.last_30_days as string) || 0,
        last7Days: parseInt(subdomainStats[0]?.last_7_days as string) || 0,
      },
      teams: {
        total: parseInt(teamStats[0]?.total as string) || 0,
        last30Days: parseInt(teamStats[0]?.last_30_days as string) || 0,
        avgSize: parseFloat(memberStats[0]?.avg_team_size as string) || 0,
        totalMembers: parseInt(memberStats[0]?.total as string) || 0,
        uniqueMembers: parseInt(memberStats[0]?.unique_users as string) || 0,
      },
      invitations: {
        totalSent: parseInt(invitationStats[0]?.total_sent as string) || 0,
        accepted: parseInt(invitationStats[0]?.accepted as string) || 0,
        declined: parseInt(invitationStats[0]?.declined as string) || 0,
        pending: parseInt(invitationStats[0]?.pending as string) || 0,
      },
      recentActivity: activityStats.map((row) => ({
        action: row.action,
        count: parseInt(row.count as string),
      })),
      topUsers,
    })
  } catch (error) {
    console.error("[super-admin/analytics] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
