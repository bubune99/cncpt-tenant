/**
 * Subdomain Availability Check API
 * Quick endpoint to check if a subdomain is available
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { rateLimitCheck, RATE_LIMIT_PRESETS } from "@/lib/cms/rate-limit"
import { RESERVED_ADDRESSES, checkAddress } from "@/lib/dashboard/site-address"

export const dynamic = 'force-dynamic'


/**
 * GET /api/dashboard/subdomain/check?subdomain=xxx
 * Check if a subdomain is available
 */
export async function GET(request: NextRequest) {
  const limited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.publicRead, { name: "publicRead" })
  if (limited) return limited
  // Only the signed-in workspace asks (the New client site panel, Create site); nobody else needs to probe addresses.
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get("subdomain")?.toLowerCase().trim()

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
  }

  // Reserved stays a plain "taken" answer (the screens show it that way).
  if (RESERVED_ADDRESSES.includes(subdomain)) {
    return NextResponse.json({ available: false, taken: true, reason: "reserved" })
  }
  // The same rule creation applies (lib/dashboard/site-address): an address it would refuse is never "available".
  const rule = checkAddress(subdomain)
  if (!rule.valid) return NextResponse.json({ available: false, taken: false, reason: "invalid", error: rule.error }, { status: 400 })

  try {
    // Check database
    const existing = await sql`
      SELECT id FROM subdomains WHERE subdomain = ${subdomain}
    `

    if (existing.length > 0) {
      return NextResponse.json({ available: false, taken: true })
    }

    return NextResponse.json({ available: true, taken: false })
  } catch (error) {
    console.error("[subdomain-check] Error:", error)
    // Unknown is not "available": the panel says it could not check, and creation still validates.
    return NextResponse.json({ available: null, error: "Could not check the address" }, { status: 500 })
  }
}
