import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { prisma, runWithTenant, runAsSuperAdmin } from "@/lib/cms/db"

export const dynamic = "force-dynamic"

/**
 * Account-level customer-feedback list for the merchant dashboard — REAL data,
 * aggregated across the signed-in user's sites. Feedback is tenant-scoped, so
 * each site's feedback is read inside its own tenant context. Empty for
 * accounts with none (honest empty state, no sample rows).
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
            prisma.feedback.findMany({
              orderBy: { createdAt: "desc" },
              take: 15,
              select: { id: true, type: true, subject: true, message: true, status: true, createdAt: true },
            })
          )
            .then((rows) => rows.map((r) => ({ ...r, site: site.subdomain })))
            .catch(() => [])
        )
      )
    ).flat()

    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ feedback: all.slice(0, 30) })
  } catch (error) {
    console.error("[dashboard/feedback] Error:", error)
    return NextResponse.json({ feedback: [] })
  }
}
