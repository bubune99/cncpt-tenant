/**
 * Module Presets API
 *
 * POST -- Apply a preset (sets enabled state for all modules)
 */

import { NextResponse } from "next/server"
import { applyPreset, MODULE_PRESETS } from "@/lib/cms/modules/presets"
import { withPermission } from "@/lib/cms/permissions/middleware"

export const GET = withPermission('settings.view', async () => {
  return NextResponse.json({ ok: true, data: MODULE_PRESETS })
})

export const POST = withPermission('settings.edit', async (request) => {
  const body = await request.json()
  const { presetId } = body as { presetId: string }

  if (!presetId) {
    return NextResponse.json(
      { ok: false, error: { code: "MISSING_PRESET", message: "presetId is required" } },
      { status: 400 }
    )
  }

  try {
    await applyPreset(presetId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: { code: "PRESET_ERROR", message: (err as Error).message } },
      { status: 400 }
    )
  }
})
