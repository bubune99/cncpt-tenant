import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"
import { invalidateTenantTier } from "@/lib/cms/billing/tenant-tier"

export const dynamic = "force-dynamic"

async function requireOwner() {
  const user = await stackServerApp.getUser()
  if (!user || !(await isSuperAdmin(user.id))) return null
  return user
}

function sanitize(subdomain: string): string {
  return String(subdomain || "").toLowerCase().replace(/[^a-z0-9-]/g, "")
}

// GET — current tier assignment + the effective limits for this tenant.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { subdomain: raw } = await params
  const subdomain = sanitize(raw)
  if (!subdomain) return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 })

  try {
    const rows = await sql`
      SELECT s.subdomain, s.subscription_tier_id, s.subscription_status,
             t.name AS tier_name, t.display_name AS tier_display_name, t.limits AS tier_limits
      FROM subdomains s
      LEFT JOIN subscription_tiers t ON t.id = s.subscription_tier_id
      WHERE s.subdomain = ${subdomain}
      LIMIT 1
    `
    if (rows.length === 0) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    const r = rows[0]
    return NextResponse.json({
      subdomain: r.subdomain,
      tierId: r.subscription_tier_id ?? null,
      tierName: r.tier_name ?? null,
      tierDisplayName: r.tier_display_name ?? null,
      subscriptionStatus: r.subscription_status ?? null,
      limits: r.tier_limits ?? {},
    })
  } catch (error) {
    console.error("[super-admin/subdomains/tier] GET error:", error)
    return NextResponse.json({ error: "Failed to load tier" }, { status: 500 })
  }
}

// PATCH — assign (or clear) a tenant's tier.
//   body: { tierId: string | null }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { subdomain: raw } = await params
  const subdomain = sanitize(raw)
  if (!subdomain) return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 })

  try {
    const body = await request.json().catch(() => ({}))
    const tierId = body.tierId == null ? null : String(body.tierId)

    const existing = await sql`SELECT id FROM subdomains WHERE subdomain = ${subdomain} LIMIT 1`
    if (existing.length === 0) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

    // Validate the tier exists (when assigning).
    if (tierId) {
      const tier = await sql`SELECT id FROM subscription_tiers WHERE id = ${tierId}::uuid LIMIT 1`
      if (tier.length === 0) return NextResponse.json({ error: "Tier not found" }, { status: 400 })
    }

    if (tierId) {
      await sql`
        UPDATE subdomains
        SET subscription_tier_id = ${tierId}::uuid, updated_at = NOW()
        WHERE subdomain = ${subdomain}
      `
    } else {
      await sql`
        UPDATE subdomains
        SET subscription_tier_id = NULL, updated_at = NOW()
        WHERE subdomain = ${subdomain}
      `
    }

    invalidateTenantTier(subdomain)
    await logPlatformActivity(
      "tenant.tier.assign",
      { subdomain, tierId },
      { actorId: user.id, actorEmail: user.primaryEmail || undefined, targetType: "subdomain", targetId: subdomain },
    )

    return NextResponse.json({ success: true, tierId })
  } catch (error) {
    console.error("[super-admin/subdomains/tier] PATCH error:", error)
    return NextResponse.json({ error: "Failed to assign tier" }, { status: 500 })
  }
}
