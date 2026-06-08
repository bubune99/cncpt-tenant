import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin } from "@/lib/super-admin"
import { prisma } from "@/lib/cms/db"

export const dynamic = "force-dynamic"

/**
 * Real platform-health probe for the super-admin overview. Replaces the former
 * always-green static badges. Each signal reflects an actual check:
 *  - api:  the route executed → operational.
 *  - db:   a live `SELECT 1` → connected / down.
 *  - auth: the Stack Auth session resolved for this super-admin → active / down.
 */
export async function GET() {
  const user = await stackServerApp.getUser().catch(() => null)
  const authOk = !!user
  if (!user || !(await isSuperAdmin(user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
  }

  return NextResponse.json({
    api: "operational",
    db: dbOk ? "connected" : "down",
    auth: authOk ? "active" : "down",
  })
}
