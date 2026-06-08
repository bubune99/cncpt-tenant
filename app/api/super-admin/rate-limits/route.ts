import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"
import {
  ensureRateLimitTables,
  invalidateRateLimitConfig,
} from "@/lib/cms/rate-limit/config"
import { RATE_LIMIT_PRESETS } from "@/lib/cms/rate-limit"
import {
  DEFAULT_RATE_LIMIT_SETTINGS,
  type RateLimitMode,
  type RateLimitScope,
} from "@/lib/cms/rate-limit/types"

export const dynamic = "force-dynamic"

const SCOPES: RateLimitScope[] = ["global", "tenant", "endpoint"]
const MODES: (RateLimitMode | "off")[] = ["enforce", "observe", "off"]

async function requireOwner() {
  const user = await stackServerApp.getUser()
  if (!user || !(await isSuperAdmin(user.id))) return null
  return user
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface RuleInput {
  scope?: unknown
  target?: unknown
  maxRequests?: unknown
  windowMs?: unknown
  mode?: unknown
  enabled?: unknown
  note?: unknown
}

function validateRule(body: RuleInput): { ok: true; value: {
  scope: RateLimitScope
  target: string
  maxRequests: number
  windowMs: number
  mode: RateLimitMode | null
  enabled: boolean
  note: string | null
} } | { ok: false; error: string } {
  const scope = String(body.scope ?? "")
  if (!SCOPES.includes(scope as RateLimitScope)) {
    return { ok: false, error: "scope must be one of global|tenant|endpoint" }
  }
  let target = typeof body.target === "string" ? body.target.trim() : ""
  if (scope === "global") target = "*"
  if (scope !== "global" && !target) {
    return { ok: false, error: "target is required for tenant/endpoint scope" }
  }
  if (target.length > 255) return { ok: false, error: "target too long" }

  const maxRequests = Number(body.maxRequests)
  if (!Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 10_000_000) {
    return { ok: false, error: "maxRequests must be an integer between 1 and 10,000,000" }
  }
  const windowMs = Number(body.windowMs)
  if (!Number.isInteger(windowMs) || windowMs < 1_000 || windowMs > 86_400_000) {
    return { ok: false, error: "windowMs must be an integer between 1,000 and 86,400,000" }
  }

  let mode: RateLimitMode | null = null
  if (body.mode === "enforce" || body.mode === "observe") mode = body.mode
  else if (body.mode != null && body.mode !== "") {
    return { ok: false, error: "mode must be enforce|observe or empty" }
  }

  const enabled = body.enabled === undefined ? true : Boolean(body.enabled)
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : null

  return { ok: true, value: { scope: scope as RateLimitScope, target, maxRequests, windowMs, mode, enabled, note } }
}

// ---------------------------------------------------------------------------
// GET — rules + settings + presets + live usage
// ---------------------------------------------------------------------------

export async function GET() {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  try {
    await ensureRateLimitTables()

    const ruleRows = await sql`
      SELECT id, scope, target, max_requests, window_ms, mode, enabled, note, created_at, updated_at
      FROM rate_limit_rules
      ORDER BY
        CASE scope WHEN 'tenant' THEN 0 WHEN 'endpoint' THEN 1 ELSE 2 END,
        target ASC
    `

    const rules = ruleRows.map((r) => ({
      id: String(r.id),
      scope: r.scope as string,
      target: String(r.target),
      maxRequests: Number(r.max_requests),
      windowMs: Number(r.window_ms),
      mode: (r.mode as string | null) ?? null,
      enabled: Boolean(r.enabled),
      note: (r.note as string | null) ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))

    const settingRows = await sql`SELECT value FROM rate_limit_settings WHERE key = 'config'`
    let settings = { ...DEFAULT_RATE_LIMIT_SETTINGS }
    if (settingRows.length > 0) {
      try {
        settings = { ...settings, ...JSON.parse(settingRows[0].value as string) }
      } catch { /* keep defaults */ }
    }

    // Surface the hardcoded presets so the owner can see/override the floor.
    const presets = Object.entries(RATE_LIMIT_PRESETS).map(([name, cfg]) => ({
      name,
      maxRequests: cfg.maxRequests,
      windowMs: cfg.windowMs,
    }))

    return NextResponse.json({ rules, settings, presets })
  } catch (error) {
    console.error("[super-admin/rate-limits] GET error:", error)
    return NextResponse.json({ error: "Failed to load rate-limit config" }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST — create or upsert a rule
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  try {
    await ensureRateLimitTables()
    const body = await request.json()
    const validated = validateRule(body)
    if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 })
    const v = validated.value

    const result = await sql`
      INSERT INTO rate_limit_rules (scope, target, max_requests, window_ms, mode, enabled, note)
      VALUES (${v.scope}, ${v.target}, ${v.maxRequests}, ${v.windowMs}, ${v.mode}, ${v.enabled}, ${v.note})
      ON CONFLICT (scope, target) DO UPDATE SET
        max_requests = ${v.maxRequests},
        window_ms = ${v.windowMs},
        mode = ${v.mode},
        enabled = ${v.enabled},
        note = ${v.note},
        updated_at = NOW()
      RETURNING id
    `

    invalidateRateLimitConfig()
    await logPlatformActivity(
      "rate_limit.rule.upsert",
      { scope: v.scope, target: v.target, maxRequests: v.maxRequests, windowMs: v.windowMs, mode: v.mode, enabled: v.enabled },
      { actorId: user.id, actorEmail: user.primaryEmail || undefined, targetType: "rate_limit_rule", targetId: String(result[0]?.id) },
    )

    return NextResponse.json({ success: true, id: result[0]?.id })
  } catch (error) {
    console.error("[super-admin/rate-limits] POST error:", error)
    return NextResponse.json({ error: "Failed to save rule" }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH — update master settings (mode)
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  try {
    await ensureRateLimitTables()
    const body = await request.json()
    const mode = String(body.mode ?? "")
    if (!MODES.includes(mode as RateLimitMode | "off")) {
      return NextResponse.json({ error: "mode must be observe|enforce|off" }, { status: 400 })
    }

    const value = JSON.stringify({ mode })
    await sql`
      INSERT INTO rate_limit_settings (key, value, updated_by)
      VALUES ('config', ${value}, ${user.id})
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW(), updated_by = ${user.id}
    `

    invalidateRateLimitConfig()
    await logPlatformActivity(
      "rate_limit.settings.update",
      { mode },
      { actorId: user.id, actorEmail: user.primaryEmail || undefined, targetType: "rate_limit_settings", targetId: "config" },
    )

    return NextResponse.json({ success: true, settings: { mode } })
  } catch (error) {
    console.error("[super-admin/rate-limits] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove a rule by id
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const result = await sql`DELETE FROM rate_limit_rules WHERE id = ${id}::uuid RETURNING id`
    if (result.length === 0) return NextResponse.json({ error: "Rule not found" }, { status: 404 })

    invalidateRateLimitConfig()
    await logPlatformActivity(
      "rate_limit.rule.delete",
      { id },
      { actorId: user.id, actorEmail: user.primaryEmail || undefined, targetType: "rate_limit_rule", targetId: id },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[super-admin/rate-limits] DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 })
  }
}
