import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin } from "@/lib/super-admin"
import { canAccessSubdomain } from "@/lib/team-auth"
import { uploadTenantMedia, getStorageConfig } from "@/lib/cms/r2"
import { rateLimitCheck, RATE_LIMIT_PRESETS } from "@/lib/cms/rate-limit"
import { checkBrandImage, brandFileName, isBrandSlot } from "@/lib/dashboard/brand-upload"

export const dynamic = "force-dynamic"

/**
 * POST /api/dashboard/branding/upload  (multipart: file, subdomain, slot)
 * Upload a client site's logo or icon from the workspace's Branding tab and return its address; the
 * Branding form then saves that address with PUT /api/cms/admin/branding as before.
 * Same access as that save: a platform super admin, or admin access to the site. Stored under the
 * site's own folder (tenants/<subdomain>/...). File rules: lib/dashboard/brand-upload.ts.
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.upload, { name: "upload" })
  if (limited) return limited

  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await request.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: "Send the image as form data" }, { status: 400 })
  const subdomain = String(form.get("subdomain") ?? "").toLowerCase().trim()
  const slot = form.get("slot")
  const file = form.get("file")
  if (!subdomain || !/^[a-z0-9-]{1,63}$/.test(subdomain)) return NextResponse.json({ error: "Say which site" }, { status: 400 })
  if (!isBrandSlot(slot)) return NextResponse.json({ error: "Say which image this is" }, { status: 400 })
  if (!(file instanceof File)) return NextResponse.json({ error: "No image was sent" }, { status: 400 })

  const rule = checkBrandImage({ type: file.type, size: file.size })
  if (!rule.ok) return NextResponse.json({ error: rule.error }, { status: 400 })

  if (!(await isSuperAdmin(user.id))) {
    const access = await canAccessSubdomain(user.id, subdomain, "admin")
    if (!access.hasAccess) return NextResponse.json({ error: "You do not have admin access to this site" }, { status: 403 })
  }

  const storage = await getStorageConfig()
  if (!storage.isConfigured) return NextResponse.json({ error: "Image storage is not set up yet" }, { status: 503 })

  try {
    const stored = await uploadTenantMedia(
      subdomain,
      Buffer.from(await file.arrayBuffer()),
      brandFileName(slot, file.type, Date.now()),
      "media/images",
      file.type,
    )
    if (!stored) return NextResponse.json({ error: "The image could not be stored. Nothing was changed." }, { status: 502 })
    return NextResponse.json({ url: stored.url })
  } catch (error) {
    console.error("[branding-upload] failed:", error)
    return NextResponse.json({ error: "The image could not be stored. Nothing was changed." }, { status: 500 })
  }
}
