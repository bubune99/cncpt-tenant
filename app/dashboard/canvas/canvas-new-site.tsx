"use client"

/**
 * New client site: a panel inside the workspace (walk dce2661a: "Add subdomain" left the dashboard for a
 * 5-step wizard that opened on a plan picker). The name comes first and suggests the address; the address is
 * checked as it is typed; the contact email starts as the signed-in user's. A plan is only brought up when the
 * account has reached its site limit (the server says PLAN_LIMIT_REACHED), with a way to the plans.
 * Address rules: lib/dashboard/site-address.ts.
 */

import { useEffect, useRef, useState } from "react"
import { Loader2, Check, X as XIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { checkAddress, addressFromName } from "@/lib/dashboard/site-address"
import { rootDomain } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Availability = "idle" | "checking" | "free" | "taken" | "unknown"

export function CanvasNewSite({
  open,
  onOpenChange,
  defaultEmail,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultEmail: string
  onCreated: (subdomain: string) => void
}) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [addressTouched, setAddressTouched] = useState(false)
  const [email, setEmail] = useState(defaultEmail)
  const [avail, setAvail] = useState<Availability>("idle")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [atLimit, setAtLimit] = useState<string | null>(null)
  const seq = useRef(0)

  useEffect(() => {
    if (!open) return
    setName(""); setAddress(""); setAddressTouched(false); setEmail(defaultEmail)
    setAvail("idle"); setError(null); setAtLimit(null); setSaving(false)
  }, [open, defaultEmail])

  useEffect(() => {
    if (!addressTouched) setAddress(addressFromName(name))
  }, [name, addressTouched])

  const rule = address ? checkAddress(address) : null

  useEffect(() => {
    if (!address || !rule?.valid) { setAvail("idle"); return }
    const my = ++seq.current
    setAvail("checking")
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/dashboard/subdomain/check?subdomain=${encodeURIComponent(address)}`)
        const d = await r.json().catch(() => null)
        if (my !== seq.current) return
        setAvail(!r.ok || d?.available == null ? "unknown" : d.available === true ? "free" : "taken")
      } catch {
        if (my === seq.current) setAvail("unknown")
      }
    }, 300)
    return () => clearTimeout(t)
  }, [address, rule?.valid])

  const canSubmit = name.trim() !== "" && rule?.valid === true && avail !== "taken" && avail !== "checking" && email.trim() !== "" && !saving

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true); setError(null)
    try {
      const r = await fetch("/api/dashboard/subdomain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: address, siteName: name.trim(), contactEmail: email.trim() }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d?.code === "PLAN_LIMIT_REACHED") setAtLimit(d.error || "Your plan's site limit is reached.")
        else setError(d?.error || "The site could not be created. Nothing was saved.")
        return
      }
      onCreated(address)
      onOpenChange(false)
    } catch {
      setError("The site could not be created. Check your connection; nothing was saved.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]" data-ui="new_site.panel">
        <DialogHeader>
          <DialogTitle>New client site</DialogTitle>
          <DialogDescription>Name the site and pick its address. Branding, domain and access come next, from the guide.</DialogDescription>
        </DialogHeader>
        {atLimit ? (
          <div className="flex flex-col gap-3" data-ui="new_site.limit">
            <p className="text-sm">{atLimit}</p>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button asChild><a href="/dashboard/create-subdomain">See plans</a></Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-site-name">Site name</Label>
              <Input
                id="new-site-name"
                data-ui="new_site.name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Coffee"
                autoFocus
                maxLength={120}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-site-address">Address</Label>
              <div className="flex">
                <Input
                  id="new-site-address"
                  className="rounded-r-none"
                  data-ui="new_site.address"
                  value={address}
                  onChange={(e) => { setAddressTouched(true); setAddress(e.target.value.toLowerCase().trim()) }}
                  placeholder="acme-coffee"
                  aria-describedby="new-site-address-note"
                  aria-invalid={rule ? !rule.valid || avail === "taken" : undefined}
                  required
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">.{rootDomain}</span>
              </div>
              <span id="new-site-address-note" className="flex items-center gap-1.5 text-xs min-h-4" aria-live="polite" data-ui="new_site.address_note">
                {rule && !rule.valid ? <span className="text-destructive">{rule.error}</span>
                  : avail === "checking" ? <><Loader2 className="h-3 w-3 animate-spin" /> Checking…</>
                  : avail === "free" ? <><Check className="h-3 w-3 text-emerald-500" /> Available</>
                  : avail === "taken" ? <><XIcon className="h-3 w-3 text-destructive" /> Already taken</>
                  : avail === "unknown" ? <span className="text-muted-foreground">Could not check it now; it is checked again when you create the site.</span>
                  : <span className="text-muted-foreground">Lowercase letters, numbers and hyphens.</span>}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-site-email">Contact email</Label>
              <Input
                id="new-site-email"
                data-ui="new_site.email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={!canSubmit} data-ui="new_site.create">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create site"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
