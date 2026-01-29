import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { bulkSyncDomainsToEdgeConfig } from "@/lib/edge-config"

/**
 * Admin endpoint to bulk sync all active custom domains to Edge Config
 * Use this for initial setup or recovery after Edge Config issues
 *
 * POST /api/admin/sync-edge-config
 * Requires: ADMIN_API_KEY header for authentication
 */
export async function POST(request: Request) {
  // Simple API key auth for admin operations
  const apiKey = request.headers.get("x-admin-api-key")
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all active custom domains from database
    const domains = await sql`
      SELECT domain, subdomain
      FROM custom_domains
      WHERE status = 'active'
    `

    if (domains.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active domains to sync",
        count: 0,
      })
    }

    // Bulk sync to Edge Config
    const success = await bulkSyncDomainsToEdgeConfig(
      domains.map((d) => ({
        domain: d.domain,
        subdomain: d.subdomain,
      }))
    )

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Synced ${domains.length} domains to Edge Config`,
        count: domains.length,
        domains: domains.map((d) => d.domain),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to sync domains to Edge Config",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Edge Config sync error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check Edge Config sync status
 */
export async function GET(request: Request) {
  const apiKey = request.headers.get("x-admin-api-key")
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const domains = await sql`
      SELECT domain, subdomain, status
      FROM custom_domains
      WHERE status = 'active'
    `

    return NextResponse.json({
      totalActiveDomains: domains.length,
      domains: domains.map((d) => ({
        domain: d.domain,
        subdomain: d.subdomain,
      })),
      edgeConfigId: process.env.EDGE_CONFIG_ID ? "configured" : "not configured",
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
