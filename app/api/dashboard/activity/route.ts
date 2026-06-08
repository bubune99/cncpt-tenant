import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { prisma } from "@/lib/cms/db"

export const dynamic = "force-dynamic"

/**
 * Account activity feed for the merchant dashboard — REAL data. Returns the
 * signed-in user's recent audit-log entries (team/role/permission/account
 * actions). AuditLog is not tenant-scoped; it is filtered by userId so a user
 * only ever sees their own activity. Empty for accounts with no recorded
 * actions yet (honest empty state, no fabricated rows).
 */
export async function GET() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        userEmail: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ logs })
  } catch (error) {
    console.error("[dashboard/activity] Error:", error)
    return NextResponse.json({ logs: [] })
  }
}
