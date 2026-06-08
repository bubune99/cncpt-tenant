import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { prisma, runWithTenant, runAsSuperAdmin } from "@/lib/cms/db"

export const dynamic = "force-dynamic"

/**
 * Account-level metrics for the merchant dashboard overview — REAL data
 * aggregated across all of the signed-in user's sites (subdomains). Replaces
 * the former demo KPI strip. Every figure is tenant-scoped and summed; a brand
 * new account legitimately reads zero.
 *
 * Order.total / subtotal are stored in integer cents.
 */
export async function GET() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // The user's sites — resolved without tenant scoping, then each site's
    // metrics are gathered inside its own tenant context.
    const sites = await runAsSuperAdmin(() =>
      prisma.subdomain.findMany({
        where: { userId: user.id },
        select: { id: true, subdomain: true },
      })
    )

    let revenueCents = 0
    let orders = 0
    let products = 0
    let customers = 0

    await Promise.all(
      sites.map((site) =>
        runWithTenant(site.id, async () => {
          const [orderAgg, productCount, customerCount] = await Promise.all([
            prisma.order.aggregate({
              _sum: { total: true },
              _count: { _all: true },
              where: { paymentStatus: "PAID" },
            }).catch(() => ({ _sum: { total: null }, _count: { _all: 0 } })),
            prisma.product.count().catch(() => 0),
            prisma.customer.count().catch(() => 0),
          ])
          revenueCents += Number(orderAgg._sum.total ?? 0)
          orders += orderAgg._count._all ?? 0
          products += productCount
          customers += customerCount
        }).catch(() => {
          // A single site failing must not blank the whole strip.
        })
      )
    )

    return NextResponse.json({
      sites: sites.length,
      revenue: revenueCents / 100,
      orders,
      products,
      customers,
    })
  } catch (error) {
    console.error("[dashboard/metrics] Error:", error)
    return NextResponse.json(
      { error: "Failed to load metrics" },
      { status: 500 }
    )
  }
}
