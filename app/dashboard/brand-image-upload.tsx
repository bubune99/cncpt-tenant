"use client"

/**
 * Upload for one brand image (logo, dark logo, favicon, Apple touch icon) on the Branding form.
 * Sends the file to /api/dashboard/branding/upload and hands back its address; the form's own Save stores it.
 * The address box stays beside it for anyone who already has the image online.
 */

import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { checkBrandImage, type BrandSlot } from "@/lib/dashboard/brand-upload"

export function BrandImageUpload({
  subdomain,
  slot,
  label,
  onUploaded,
}: {
  subdomain: string
  slot: BrandSlot
  /** what is being uploaded, for the button's accessible name ("logo", "favicon") */
  label: string
  onUploaded: (url: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(file: File) {
    const rule = checkBrandImage({ type: file.type, size: file.size })
    if (!rule.ok) { setError(rule.error ?? "That file cannot be used."); return }
    setBusy(true); setError(null)
    try {
      const body = new FormData()
      body.append("file", file)
      body.append("subdomain", subdomain)
      body.append("slot", slot)
      const r = await fetch("/api/dashboard/branding/upload", { method: "POST", body })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || typeof d?.url !== "string") { setError(d?.error || "The image could not be uploaded."); return }
      onUploaded(d.url)
    } catch {
      setError("The image could not be uploaded. Check your connection.")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f) }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={busy}
        onClick={() => input.current?.click()}
        aria-label={`Upload ${label}`}
        data-ui={`branding.upload.${slot}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? "Uploading…" : "Upload image"}
      </Button>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : (
        <p className="text-xs text-muted-foreground">PNG, JPEG, WebP or GIF, up to 2 MB. Save to apply it.</p>
      )}
    </div>
  )
}
