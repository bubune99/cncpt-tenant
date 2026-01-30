/**
 * Subdomain Availability Check API
 * Quick endpoint to check if a subdomain is available
 */

import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { redis } from "@/lib/redis"

const RESERVED_SUBDOMAINS = [
  "www", "app", "api", "admin", "dashboard", "mail", "email",
  "ftp", "blog", "shop", "store", "help", "support", "docs",
  "dev", "staging", "test", "demo",
]

/**
 * GET /api/dashboard/subdomain/check?subdomain=xxx
 * Check if a subdomain is available
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get("subdomain")?.toLowerCase().trim()

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
  }

  // Check reserved list
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return NextResponse.json({ available: false, taken: true, reason: "reserved" })
  }

  try {
    // Check database
    const existing = await sql`
      SELECT id FROM subdomains WHERE subdomain = ${subdomain}
    `

    if (existing.length > 0) {
      return NextResponse.json({ available: false, taken: true })
    }

    // Also check Redis for legacy subdomains
    const redisData = await redis.get(`subdomain:${subdomain}`)
    if (redisData) {
      return NextResponse.json({ available: false, taken: true })
    }

    return NextResponse.json({ available: true, taken: false })
  } catch (error) {
    console.error("[subdomain-check] Error:", error)
    // On error, return available to let the actual creation validate
    return NextResponse.json({ available: true, taken: false })
  }
}
