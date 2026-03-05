/**
 * Module Management API
 *
 * GET  -- List all modules with current enabled/config state
 * PATCH -- Toggle module enabled state or update config
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/cms/db"
import { clearModuleCache } from "@/lib/cms/modules/registry"
import { withTenant } from "@/lib/cms/api/tenant"

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
  const modules = await prisma.cmsModule.findMany({
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json({ ok: true, data: modules })
  })
}

export async function PATCH(request: NextRequest) {
  return withTenant(request, async () => {
  const body = await request.json()
  const { slug, enabled, config } = body as {
    slug: string
    enabled?: boolean
    config?: Record<string, unknown>
  }

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: { code: "MISSING_SLUG", message: "slug is required" } },
      { status: 400 }
    )
  }

  // Core module cannot be disabled
  if (slug === "core" && enabled === false) {
    return NextResponse.json(
      { ok: false, error: { code: "CORE_REQUIRED", message: "Core module cannot be disabled" } },
      { status: 400 }
    )
  }

  const existing = await prisma.cmsModule.findUnique({ where: { slug } })
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: `Module "${slug}" not found` } },
      { status: 404 }
    )
  }

  const updated = await prisma.cmsModule.update({
    where: { slug },
    data: {
      ...(enabled !== undefined ? { enabled } : {}),
      ...(config !== undefined
        ? { config: JSON.parse(JSON.stringify(config)) }
        : {}),
    },
  })

  clearModuleCache()

  return NextResponse.json({ ok: true, data: updated })
  })
}
