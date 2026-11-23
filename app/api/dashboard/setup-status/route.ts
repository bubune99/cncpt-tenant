import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import type { SiteFacts } from "@/lib/dashboard/setup-guide"

export const dynamic = "force-dynamic"

/**
 * GET /api/dashboard/setup-status
 * The stored facts behind the Overview's setup guide and each site's setup checklist, for the signed-in
 * user's own sites only (the same sites as the Overview list: subdomains.user_id = me).
 * The rules that turn facts into ticks live in lib/dashboard/setup-guide.ts.
 */
export async function GET() {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const rows = await sql`
      SELECT
        s.subdomain,
        COALESCE(s.disabled, false) AS disabled,
        COALESCE(NULLIF(ts.site_name, ''), NULLIF(ts.site_title, ''), NULLIF(s.site_name, '')) AS title,
        (COALESCE(ts.logo_url, '') <> '' OR COALESCE(ts.logo_dark_url, '') <> '' OR COALESCE(ts.primary_color, '') <> '') AS branded,
        COALESCE(
          NULLIF(s.custom_domain, ''),
          (SELECT cd.domain FROM custom_domains cd WHERE cd.subdomain = s.subdomain AND cd.verified_at IS NOT NULL ORDER BY cd.is_primary DESC NULLS LAST LIMIT 1)
        ) AS custom_domain,
        COALESCE(ss.visibility, 'public') AS visibility,
        (
          SELECT COUNT(DISTINCT tm.user_id)::int
          FROM team_subdomains tsd
          JOIN team_members tm ON tm.team_id = tsd.team_id
          WHERE tsd.subdomain = s.subdomain AND tm.user_id <> s.user_id
        ) AS collaborators
      FROM subdomains s
      LEFT JOIN tenant_settings ts ON ts.tenant_id = s.id
      LEFT JOIN subdomain_settings ss ON ss.subdomain = s.subdomain
      WHERE s.user_id = ${user.id}
      ORDER BY s.created_at DESC
    `
    const sites: (SiteFacts & { disabled: boolean })[] = rows.map((r) => ({
      subdomain: String(r.subdomain),
      disabled: Boolean(r.disabled),
      title: r.title ? String(r.title) : null,
      branded: Boolean(r.branded),
      customDomain: r.custom_domain ? String(r.custom_domain) : null,
      visibility: String(r.visibility),
      collaborators: Number(r.collaborators) || 0,
    }))
    return NextResponse.json({ sites })
  } catch (error) {
    console.error("[setup-status] failed:", error)
    return NextResponse.json({ error: "Could not load setup status" }, { status: 500 })
  }
}
