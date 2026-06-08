import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { prisma, runWithTenant, runAsSuperAdmin } from "@/lib/cms/db"
import { getOrCreateSiteSettings, updateAnnouncementBarConfig } from "@/lib/cms/site-settings"

export const dynamic = "force-dynamic"

/**
 * Account-level Announcements — REAL. Manages the storefront announcement bar
 * (SiteSettings.announcementBar, rendered by components/cms/storefront-wl/
 * AnnouncementBar) for each of the signed-in user's sites. GET lists every
 * site's current banner; PUT updates one site's banner. Per-site config is
 * read/written inside that site's tenant context.
 */

async function userSites(userId: string) {
  return runAsSuperAdmin(() =>
    prisma.subdomain.findMany({
      where: { userId },
      select: { id: true, subdomain: true },
      orderBy: { createdAt: "desc" },
    })
  )
}

export async function GET() {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sites = await userSites(user.id)
    const announcements = await Promise.all(
      sites.map((site) =>
        runWithTenant(site.id, async () => {
          const s = await getOrCreateSiteSettings()
          return {
            subdomain: site.subdomain,
            enabled: !!s.showAnnouncementBar,
            announcementBar: (s.announcementBar ?? {}) as Record<string, unknown>,
          }
        }).catch(() => ({ subdomain: site.subdomain, enabled: false, announcementBar: {} }))
      )
    )
    return NextResponse.json({ announcements })
  } catch (error) {
    console.error("[dashboard/announcements] GET Error:", error)
    return NextResponse.json({ announcements: [] })
  }
}

export async function PUT(request: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const subdomain = typeof body.subdomain === "string" ? body.subdomain : null
    if (!subdomain) {
      return NextResponse.json({ error: "subdomain is required" }, { status: 400 })
    }

    // Ownership: the target site must belong to this user.
    const sites = await userSites(user.id)
    const site = sites.find((s) => s.subdomain === subdomain)
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const announcementBar = (body.announcementBar && typeof body.announcementBar === "object")
      ? body.announcementBar
      : {}
    const enabled = typeof body.enabled === "boolean" ? body.enabled : false

    const updated = await runWithTenant(site.id, () =>
      updateAnnouncementBarConfig(announcementBar, enabled)
    )

    return NextResponse.json({
      subdomain,
      enabled: !!updated.showAnnouncementBar,
      announcementBar: (updated.announcementBar ?? {}) as Record<string, unknown>,
    })
  } catch (error) {
    console.error("[dashboard/announcements] PUT Error:", error)
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 })
  }
}
