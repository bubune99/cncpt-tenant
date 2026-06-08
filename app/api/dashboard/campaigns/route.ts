import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { prisma, runWithTenant, runAsSuperAdmin } from "@/lib/cms/db"

export const dynamic = "force-dynamic"

/**
 * Account-level email-campaign list for the merchant dashboard — REAL data,
 * aggregated across the signed-in user's sites. EmailCampaign is tenant-scoped,
 * so each site's campaigns are read inside its own tenant context. Empty for
 * accounts that have created none (honest empty state, no sample rows).
 */
export async function GET() {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sites = await runAsSuperAdmin(() =>
      prisma.subdomain.findMany({
        where: { userId: user.id },
        select: { id: true, subdomain: true },
      })
    )

    const all = (
      await Promise.all(
        sites.map((site) =>
          runWithTenant(site.id, () =>
            prisma.emailCampaign.findMany({
              orderBy: { createdAt: "desc" },
              take: 10,
              select: { id: true, name: true, subject: true, status: true, sentAt: true, recipientCount: true, sentCount: true, createdAt: true },
            })
          )
            .then((rows) => rows.map((r) => ({ ...r, site: site.subdomain })))
            .catch(() => [])
        )
      )
    ).flat()

    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ campaigns: all.slice(0, 20) })
  } catch (error) {
    console.error("[dashboard/campaigns] Error:", error)
    return NextResponse.json({ campaigns: [] })
  }
}
