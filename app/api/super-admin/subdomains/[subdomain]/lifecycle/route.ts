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

// ---------------------------------------------------------------------------
// PATCH — soft-disable (suspend) / re-enable a tenant. Reversible.
//   body: { action: "suspend" | "unsuspend", reason?: string, unassignOwner?: bool }
// ---------------------------------------------------------------------------

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
    const action = String(body.action || "")
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null
    const unassignOwner = Boolean(body.unassignOwner)

    const existing = await sql`SELECT id FROM subdomains WHERE subdomain = ${subdomain} LIMIT 1`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    if (action === "suspend") {
      await sql`
        UPDATE subdomains
        SET disabled = TRUE,
            disabled_at = NOW(),
            disabled_reason = ${reason},
            maintenance_mode = TRUE,
            updated_at = NOW()
        WHERE subdomain = ${subdomain}
      `
      if (unassignOwner) {
        await sql`UPDATE subdomains SET user_id = NULL, updated_at = NOW() WHERE subdomain = ${subdomain}`
      }
      invalidateTenantTier(subdomain)
      await logPlatformActivity(
        "tenant.suspend",
        { subdomain, reason, unassignOwner },
        { actorId: user.id, actorEmail: user.primaryEmail || undefined, targetType: "subdomain", targetId: subdomain },
      )
      return NextResponse.json({ success: true, disabled: true })
    }

    if (action === "unsuspend") {
      await sql`
        UPDATE subdomains
        SET disabled = FALSE,
            disabled_at = NULL,
            disabled_reason = NULL,
            maintenance_mode = FALSE,
            updated_at = NOW()
        WHERE subdomain = ${subdomain}
      `
      invalidateTenantTier(subdomain)
      await logPlatformActivity(
        "tenant.unsuspend",
        { subdomain },
        { actorId: user.id, actorEmail: user.primaryEmail || undefined, targetType: "subdomain", targetId: subdomain },
      )
      return NextResponse.json({ success: true, disabled: false })
    }

    return NextResponse.json({ error: "action must be suspend|unsuspend" }, { status: 400 })
  } catch (error) {
    console.error("[super-admin/subdomains/lifecycle] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update tenant lifecycle" }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — HARD delete. Gated: caller must pass ?confirm=<exact subdomain>.
// This is destructive and irreversible; it is never auto-run.
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { subdomain: raw } = await params
  const subdomain = sanitize(raw)
  if (!subdomain) return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 })

  // Confirmation gate: the typed name must exactly match the target.
  const confirm = sanitize(request.nextUrl.searchParams.get("confirm") || "")
  if (confirm !== subdomain) {
    return NextResponse.json(
      { error: "Confirmation required: pass ?confirm=<exact subdomain> to hard-delete" },
      { status: 428 }, // Precondition Required
    )
  }

  try {
    const existing = await sql`SELECT id FROM subdomains WHERE subdomain = ${subdomain} LIMIT 1`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Tenant-scoped content rows are FK'd to subdomains.id with onDelete: Cascade
    // in the Prisma schema, so deleting the subdomain row cascades CMS data.
    const result = await sql`DELETE FROM subdomains WHERE subdomain = ${subdomain} RETURNING id`

    // Best-effort cleanup of non-FK'd legacy stores.
    try { await sql`DELETE FROM tenant_settings WHERE subdomain = ${subdomain}` } catch { /* ignore */ }

    invalidateTenantTier(subdomain)
    await logPlatformActivity(
      "tenant.hard_delete",
      { subdomain, deletedId: result[0]?.id },
      { actorId: user.id, actorEmail: user.primaryEmail || undefined, targetType: "subdomain", targetId: subdomain },
    )

    return NextResponse.json({ success: true, deleted: subdomain })
  } catch (error) {
    console.error("[super-admin/subdomains/lifecycle] DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 })
  }
}
