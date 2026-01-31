/**
 * Super Admin MCP Server Route
 * Platform-wide management tools for super administrators
 *
 * Authentication: Super admin API keys or session-based super admin access
 */

import { createMcpHandler } from "mcp-handler"
import { z } from "zod"
import { NextRequest } from "next/server"
import { sql } from "@/lib/neon"
import { prisma } from "@/lib/cms/db"
import { stackServerApp } from "@/stack"
import {
  isSuperAdmin,
  getPlatformActivityLogs,
  logPlatformActivity,
  SUPER_ADMIN_PERMISSIONS,
  hasPermission,
  type SuperAdminContext
} from "@/lib/super-admin"
import {
  validateMcpApiKey,
  runWithMcpContext,
  mcpResponse,
  mcpError,
  normalizePagination,
  type McpContext
} from "@/lib/cms/mcp"

// ==========================================
// Authentication
// ==========================================

interface SuperAdminMcpContext {
  userId: string
  apiKeyId: string
  scopes: string[]
  email?: string
  permissions: string[]
  isSuperAdmin: true
}

async function authenticateSuperAdmin(
  request: NextRequest
): Promise<SuperAdminMcpContext | null> {
  // Check Authorization header first (API key auth)
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    const context = await validateMcpApiKey(authHeader)
    if (context) {
      // Verify user is a super admin
      const isAdmin = await isSuperAdmin(context.userId)
      if (isAdmin) {
        return {
          ...context,
          permissions: ["*"], // API key super admin has full permissions
          isSuperAdmin: true
        }
      }
    }
  }

  // Fall back to X-API-Key header
  const xApiKey = request.headers.get("x-api-key")
  if (xApiKey) {
    const context = await validateMcpApiKey(xApiKey)
    if (context) {
      const isAdmin = await isSuperAdmin(context.userId)
      if (isAdmin) {
        return {
          ...context,
          permissions: ["*"],
          isSuperAdmin: true
        }
      }
    }
  }

  // Dev mode fallback
  if (process.env.NODE_ENV === "development" && process.env.SUPER_ADMIN_MCP_KEY) {
    const devKey = process.env.SUPER_ADMIN_MCP_KEY
    if (authHeader === `Bearer ${devKey}` || xApiKey === devKey) {
      console.warn("MCP: Using development super admin key")
      return {
        userId: "dev-super-admin",
        apiKeyId: "dev-super-admin-key",
        scopes: ["read", "write", "admin"],
        permissions: ["*"],
        isSuperAdmin: true
      }
    }
  }

  return null
}

// ==========================================
// MCP Handler
// ==========================================

const handler = createMcpHandler(
  async (server) => {
    // ==========================================
    // Subdomain Management
    // ==========================================
    server.tool(
      "list_all_subdomains",
      "List all subdomains across the platform with owner info",
      {
        limit: z.number().optional().describe("Max results (default 50, max 200)"),
        offset: z.number().optional().describe("Skip N results"),
        search: z.string().optional().describe("Search by subdomain name")
      },
      async ({ limit, offset, search }) => {
        try {
          const { limit: l, offset: o } = normalizePagination(limit, offset, 50, 200)

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
            LIMIT ${l} OFFSET ${o}
          `

          const countResult = await sql`
            SELECT COUNT(*) as total FROM subdomains ${sql.unsafe(whereClause)}
          `

          // Enrich with user info
          const userIds = Array.from(new Set(subdomainsResult.map(s => s.user_id as string)))
          const userMap = new Map()

          for (const userId of userIds) {
            try {
              const user = await stackServerApp.getUser({ userId })
              if (user) {
                userMap.set(userId, {
                  id: user.id,
                  email: user.primaryEmail,
                  displayName: user.displayName
                })
              }
            } catch {
              // User may have been deleted
            }
          }

          const subdomains = subdomainsResult.map(s => ({
            id: s.id,
            subdomain: s.subdomain,
            emoji: s.emoji,
            userId: s.user_id,
            owner: userMap.get(s.user_id as string) || null,
            createdAt: s.created_at,
            teamShareCount: parseInt(s.team_share_count as string) || 0
          }))

          return mcpResponse({
            subdomains,
            total: parseInt(countResult[0]?.total as string) || 0,
            limit: l,
            offset: o
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_subdomain_details",
      "Get detailed information about a specific subdomain",
      {
        subdomain: z.string().describe("Subdomain name")
      },
      async ({ subdomain }) => {
        try {
          const result = await sql`
            SELECT s.*,
                   (SELECT COUNT(*) FROM team_subdomains WHERE subdomain = s.subdomain) as team_share_count
            FROM subdomains s
            WHERE s.subdomain = ${subdomain}
          `

          if (result.length === 0) {
            return mcpError("Subdomain not found")
          }

          const s = result[0]

          // Get owner info
          let owner = null
          try {
            const user = await stackServerApp.getUser({ userId: s.user_id as string })
            if (user) {
              owner = {
                id: user.id,
                email: user.primaryEmail,
                displayName: user.displayName
              }
            }
          } catch {
            // User deleted
          }

          // Get team shares
          const teamShares = await sql`
            SELECT ts.team_id, ts.access_level, t.name as team_name
            FROM team_subdomains ts
            JOIN teams t ON ts.team_id = t.id
            WHERE ts.subdomain = ${subdomain} AND t.deleted_at IS NULL
          `

          // Get CMS stats from Prisma
          const tenantRecord = await prisma.subdomain.findUnique({
            where: { subdomain },
            select: { id: true }
          })

          let cmsStats = null
          if (tenantRecord) {
            const [pageCount, postCount, productCount, orderCount] = await Promise.all([
              prisma.page.count({ where: { tenantId: tenantRecord.id } }),
              prisma.blogPost.count({ where: { tenantId: tenantRecord.id } }),
              prisma.product.count({ where: { tenantId: tenantRecord.id } }),
              prisma.order.count({ where: { tenantId: tenantRecord.id } })
            ])
            cmsStats = { pages: pageCount, posts: postCount, products: productCount, orders: orderCount }
          }

          return mcpResponse({
            subdomain: {
              id: s.id,
              name: s.subdomain,
              emoji: s.emoji,
              userId: s.user_id,
              createdAt: s.created_at
            },
            owner,
            teamShares: teamShares.map(ts => ({
              teamId: ts.team_id,
              teamName: ts.team_name,
              accessLevel: ts.access_level
            })),
            cmsStats
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // User Management
    // ==========================================
    server.tool(
      "list_platform_users",
      "List all users on the platform",
      {
        limit: z.number().optional().describe("Max results (default 50)"),
        offset: z.number().optional().describe("Skip N results"),
        search: z.string().optional().describe("Search by email")
      },
      async ({ limit, offset, search }) => {
        try {
          const { limit: l, offset: o } = normalizePagination(limit, offset, 50, 200)

          // Get users from Stack Auth
          const usersResponse = await stackServerApp.listUsers()
          let users = usersResponse.items || []

          // Filter by search if provided
          if (search) {
            const searchLower = search.toLowerCase()
            users = users.filter(u =>
              u.primaryEmail?.toLowerCase().includes(searchLower) ||
              u.displayName?.toLowerCase().includes(searchLower)
            )
          }

          // Get subdomain counts for each user
          const userSubdomainCounts = await sql`
            SELECT user_id, COUNT(*) as count
            FROM subdomains
            GROUP BY user_id
          `
          const countMap = new Map(userSubdomainCounts.map(r => [r.user_id as string, parseInt(r.count as string)]))

          const total = users.length
          const paginatedUsers = users.slice(o, o + l).map(u => ({
            id: u.id,
            email: u.primaryEmail,
            displayName: u.displayName,
            createdAt: u.signedUpAt,
            subdomainCount: countMap.get(u.id) || 0
          }))

          return mcpResponse({
            users: paginatedUsers,
            total,
            limit: l,
            offset: o
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_user_details",
      "Get detailed information about a platform user",
      {
        userId: z.string().describe("User ID")
      },
      async ({ userId }) => {
        try {
          const user = await stackServerApp.getUser({ userId })
          if (!user) {
            return mcpError("User not found")
          }

          // Get user's subdomains
          const subdomains = await sql`
            SELECT subdomain, emoji, created_at
            FROM subdomains
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
          `

          // Get user's teams
          const teams = await sql`
            SELECT t.id, t.name, tm.role
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = ${userId} AND t.deleted_at IS NULL
          `

          // Check if super admin
          const isAdmin = await isSuperAdmin(userId)

          return mcpResponse({
            user: {
              id: user.id,
              email: user.primaryEmail,
              displayName: user.displayName,
              createdAt: user.signedUpAt,
              isSuperAdmin: isAdmin
            },
            subdomains: subdomains.map(s => ({
              name: s.subdomain,
              emoji: s.emoji,
              createdAt: s.created_at
            })),
            teams: teams.map(t => ({
              id: t.id,
              name: t.name,
              role: t.role
            }))
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Platform Analytics
    // ==========================================
    server.tool(
      "get_platform_analytics",
      "Get platform-wide analytics and statistics",
      {
        days: z.number().optional().default(30).describe("Number of days to look back")
      },
      async ({ days }) => {
        try {
          const since = new Date()
          since.setDate(since.getDate() - (days || 30))

          // Platform-wide counts
          const [
            totalSubdomains,
            newSubdomains,
            totalTeams,
            newTeams
          ] = await Promise.all([
            sql`SELECT COUNT(*) as count FROM subdomains`,
            sql`SELECT COUNT(*) as count FROM subdomains WHERE created_at >= ${since.toISOString()}`,
            sql`SELECT COUNT(*) as count FROM teams WHERE deleted_at IS NULL`,
            sql`SELECT COUNT(*) as count FROM teams WHERE created_at >= ${since.toISOString()} AND deleted_at IS NULL`
          ])

          // CMS-wide counts from Prisma
          const [totalPages, totalPosts, totalProducts, totalOrders, recentRevenue] = await Promise.all([
            prisma.page.count(),
            prisma.blogPost.count(),
            prisma.product.count(),
            prisma.order.count(),
            prisma.order.aggregate({
              where: { createdAt: { gte: since } },
              _sum: { total: true }
            })
          ])

          // Get user count from Stack Auth
          const usersResponse = await stackServerApp.listUsers()
          const totalUsers = usersResponse.items?.length || 0

          return mcpResponse({
            period: `${days} days`,
            platform: {
              totalSubdomains: parseInt(totalSubdomains[0]?.count as string) || 0,
              newSubdomains: parseInt(newSubdomains[0]?.count as string) || 0,
              totalTeams: parseInt(totalTeams[0]?.count as string) || 0,
              newTeams: parseInt(newTeams[0]?.count as string) || 0,
              totalUsers
            },
            cms: {
              totalPages,
              totalPosts,
              totalProducts,
              totalOrders,
              recentRevenue: recentRevenue._sum.total || 0
            }
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Activity Logs
    // ==========================================
    server.tool(
      "get_activity_logs",
      "Get platform activity audit logs",
      {
        limit: z.number().optional().describe("Max results (default 50)"),
        offset: z.number().optional().describe("Skip N results"),
        action: z.string().optional().describe("Filter by action type"),
        actorId: z.string().optional().describe("Filter by actor user ID")
      },
      async ({ limit, offset, action, actorId }) => {
        try {
          const { limit: l, offset: o } = normalizePagination(limit, offset, 50, 200)
          const page = Math.floor(o / l) + 1

          const result = await getPlatformActivityLogs({
            page,
            limit: l,
            action,
            actorId
          })

          return mcpResponse({
            logs: result.logs.map(log => ({
              id: log.id,
              action: log.action,
              actorId: log.actorId,
              actorEmail: log.actorEmail,
              targetType: log.targetType,
              targetId: log.targetId,
              details: log.details,
              createdAt: log.createdAt
            })),
            total: result.total,
            limit: l,
            offset: o
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Platform Health
    // ==========================================
    server.tool(
      "check_platform_health",
      "Check platform health status and connectivity",
      {},
      async () => {
        try {
          const checks: Record<string, { status: string; latency?: number; error?: string }> = {}

          // Check database (Neon)
          const dbStart = Date.now()
          try {
            await sql`SELECT 1`
            checks.database = { status: "healthy", latency: Date.now() - dbStart }
          } catch (error) {
            checks.database = { status: "unhealthy", error: error instanceof Error ? error.message : "Unknown" }
          }

          // Check CMS database (Prisma)
          const prismaStart = Date.now()
          try {
            await prisma.$queryRaw`SELECT 1`
            checks.cmsPrisma = { status: "healthy", latency: Date.now() - prismaStart }
          } catch (error) {
            checks.cmsPrisma = { status: "unhealthy", error: error instanceof Error ? error.message : "Unknown" }
          }

          // Check Stack Auth
          const authStart = Date.now()
          try {
            await stackServerApp.listUsers({ limit: 1 })
            checks.auth = { status: "healthy", latency: Date.now() - authStart }
          } catch (error) {
            checks.auth = { status: "unhealthy", error: error instanceof Error ? error.message : "Unknown" }
          }

          const allHealthy = Object.values(checks).every(c => c.status === "healthy")

          return mcpResponse({
            status: allHealthy ? "healthy" : "degraded",
            checks,
            timestamp: new Date().toISOString()
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )
  },
  {},
  {
    basePath: "",
    verboseLogs: process.env.NODE_ENV === "development",
    maxDuration: 60,
    disableSse: true
  }
)

// ==========================================
// Route Handlers
// ==========================================

async function handleWithSuperAdminAuth(request: NextRequest) {
  const context = await authenticateSuperAdmin(request)

  if (!context) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Super admin access required. Provide a valid super admin API key."
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" }
      }
    )
  }

  // Log MCP access
  await logPlatformActivity("mcp.access", {
    endpoint: "/api/platform/mcp"
  }, {
    actorId: context.userId,
    actorEmail: context.email
  }).catch(() => {}) // Don't fail on log errors

  return runWithMcpContext(context, () => handler(request))
}

export const GET = handleWithSuperAdminAuth
export const POST = handleWithSuperAdminAuth
export const DELETE = handleWithSuperAdminAuth
