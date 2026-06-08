import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin } from "@/lib/super-admin"

export const dynamic = "force-dynamic"

async function requireOwner() {
  const user = await stackServerApp.getUser()
  if (!user || !(await isSuperAdmin(user.id))) return null
  return user
}

/**
 * Consolidated owner billing + usage view.
 *
 * Returns:
 * - per-tenant rows: assigned tier, status, storage usage (sum of media.size),
 *   media count, disabled flag — joined from subdomains + subscription_tiers + media.
 * - platform totals: tenant counts by tier, active subscriptions, API usage
 *   aggregates (api_key_usage), total storage.
 *
 * All numeric aggregates are coerced with Number() (pg returns numeric/bigint
 * as strings).
 */
export async function GET(request: NextRequest) {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const limit = Math.min(200, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "100", 10)))

  try {
    // Per-tenant usage. Storage = sum of media.size for the tenant.
    const tenantRows = await sql`
      SELECT s.id, s.subdomain, s.disabled, s.subscription_status,
             t.name AS tier_name, t.display_name AS tier_display_name,
             t.price_monthly AS tier_price, t.limits AS tier_limits,
             COALESCE(m.media_count, 0) AS media_count,
             COALESCE(m.storage_bytes, 0) AS storage_bytes
      FROM subdomains s
      LEFT JOIN subscription_tiers t ON t.id = s.subscription_tier_id
      LEFT JOIN (
        SELECT tenant_id, COUNT(*) AS media_count, SUM(size) AS storage_bytes
        FROM media GROUP BY tenant_id
      ) m ON m.tenant_id = s.id
      ORDER BY storage_bytes DESC NULLS LAST, s.created_at DESC
      LIMIT ${limit}
    `

    const tenants = tenantRows.map((r) => {
      const storageBytes = Number(r.storage_bytes) || 0
      const limits = (r.tier_limits as Record<string, unknown> | null) || {}
      const storageLimitGb = typeof limits.storage_gb === "number" ? (limits.storage_gb as number) : null
      const storageGb = storageBytes / 1_073_741_824
      return {
        id: r.id,
        subdomain: r.subdomain,
        disabled: Boolean(r.disabled),
        tierName: (r.tier_name as string | null) ?? null,
        tierDisplayName: (r.tier_display_name as string | null) ?? null,
        tierPriceMonthly: r.tier_price != null ? Number(r.tier_price) : null,
        subscriptionStatus: (r.subscription_status as string | null) ?? null,
        mediaCount: Number(r.media_count) || 0,
        storageBytes,
        storageGb: Number(storageGb.toFixed(3)),
        storageLimitGb,
        overStorage: storageLimitGb != null && storageLimitGb >= 0 && storageGb > storageLimitGb,
      }
    })

    // Platform totals.
    const [tierCounts, subStats, apiUsage, storageTotal] = await Promise.all([
      sql`
        SELECT COALESCE(t.name, 'unassigned') AS tier, COUNT(*)::int AS count,
               COALESCE(SUM(t.price_monthly), 0) AS mrr
        FROM subdomains s
        LEFT JOIN subscription_tiers t ON t.id = s.subscription_tier_id
        GROUP BY COALESCE(t.name, 'unassigned')
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active')::int AS active,
          COUNT(*) FILTER (WHERE status = 'trialing')::int AS trialing,
          COUNT(*) FILTER (WHERE status = 'canceled')::int AS canceled,
          COUNT(*)::int AS total
        FROM subscriptions
      `,
      sql`
        SELECT
          COALESCE(SUM("requestCount"), 0) AS requests,
          COALESCE(SUM("errorCount"), 0) AS errors,
          COALESCE(SUM("rateLimitCount"), 0) AS rate_limited
        FROM api_key_usage
        WHERE date >= (CURRENT_DATE - INTERVAL '30 days')
      `,
      sql`SELECT COALESCE(SUM(size), 0) AS bytes, COUNT(*)::int AS files FROM media`,
    ])

    const byTier: Record<string, { count: number; mrr: number }> = {}
    let mrr = 0
    for (const row of tierCounts) {
      const m = Number(row.mrr) || 0
      byTier[String(row.tier)] = { count: Number(row.count) || 0, mrr: m }
      mrr += m
    }

    return NextResponse.json({
      tenants,
      totals: {
        mrr: Number(mrr.toFixed(2)),
        byTier,
        subscriptions: {
          active: Number(subStats[0]?.active) || 0,
          trialing: Number(subStats[0]?.trialing) || 0,
          canceled: Number(subStats[0]?.canceled) || 0,
          total: Number(subStats[0]?.total) || 0,
        },
        apiUsage30d: {
          requests: Number(apiUsage[0]?.requests) || 0,
          errors: Number(apiUsage[0]?.errors) || 0,
          rateLimited: Number(apiUsage[0]?.rate_limited) || 0,
        },
        storage: {
          bytes: Number(storageTotal[0]?.bytes) || 0,
          gb: Number(((Number(storageTotal[0]?.bytes) || 0) / 1_073_741_824).toFixed(3)),
          files: Number(storageTotal[0]?.files) || 0,
        },
      },
    })
  } catch (error) {
    console.error("[super-admin/billing] GET error:", error)
    return NextResponse.json({ error: "Failed to load billing/usage data" }, { status: 500 })
  }
}
