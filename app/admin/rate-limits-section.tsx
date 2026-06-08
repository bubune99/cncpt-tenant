"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Gauge,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  ShieldAlert,
  Globe,
  Building2,
  Plug,
} from "lucide-react"

type Scope = "global" | "tenant" | "endpoint"
type RuleMode = "enforce" | "observe" | "" | null

interface Rule {
  id: string
  scope: Scope
  target: string
  maxRequests: number
  windowMs: number
  mode: RuleMode
  enabled: boolean
  note: string | null
  createdAt: string
  updatedAt: string
}

interface Preset {
  name: string
  maxRequests: number
  windowMs: number
}

type MasterMode = "observe" | "enforce" | "off"

const SCOPE_META: Record<Scope, { label: string; Icon: typeof Globe; color: string }> = {
  global: { label: "Global", Icon: Globe, color: "text-blue-400" },
  tenant: { label: "Tenant", Icon: Building2, color: "text-emerald-400" },
  endpoint: { label: "Endpoint", Icon: Plug, color: "text-orange-400" },
}

function formatWindow(ms: number): string {
  if (ms % 86_400_000 === 0) return `${ms / 86_400_000}d`
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000}h`
  if (ms % 60_000 === 0) return `${ms / 60_000}m`
  return `${Math.round(ms / 1000)}s`
}

const emptyForm = {
  scope: "global" as Scope,
  target: "",
  maxRequests: 60,
  window: 60, // seconds in the form, converted to ms on submit
  mode: "" as RuleMode,
  enabled: true,
  note: "",
}

export function RateLimitsSection() {
  const [rules, setRules] = useState<Rule[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [masterMode, setMasterMode] = useState<MasterMode>("observe")
  const [loading, setLoading] = useState(true)
  const [savingMode, setSavingMode] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/rate-limits")
      if (res.ok) {
        const data = await res.json()
        setRules(data.rules || [])
        setPresets(data.presets || [])
        setMasterMode(data.settings?.mode || "observe")
      }
    } catch (e) {
      console.error("Failed to load rate-limit config:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSaveMode = async (mode: MasterMode) => {
    setSavingMode(true)
    const prev = masterMode
    setMasterMode(mode)
    try {
      const res = await fetch("/api/super-admin/rate-limits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      if (!res.ok) setMasterMode(prev)
    } catch {
      setMasterMode(prev)
    } finally {
      setSavingMode(false)
    }
  }

  const openCreate = (scope: Scope = "global", target = "", presetVals?: Preset) => {
    setError(null)
    setForm({
      ...emptyForm,
      scope,
      target: scope === "global" ? "" : target,
      maxRequests: presetVals?.maxRequests ?? 60,
      window: presetVals ? Math.round(presetVals.windowMs / 1000) : 60,
    })
    setShowDialog(true)
  }

  const handleSaveRule = async () => {
    setError(null)
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/rate-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: form.scope,
          target: form.scope === "global" ? "*" : form.target.trim(),
          maxRequests: Number(form.maxRequests),
          windowMs: Number(form.window) * 1000,
          mode: form.mode || null,
          enabled: form.enabled,
          note: form.note || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowDialog(false)
        fetchConfig()
      } else {
        setError(data.error || "Failed to save rule")
      }
    } catch {
      setError("Failed to save rule")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleEnabled = async (rule: Rule) => {
    try {
      const res = await fetch("/api/super-admin/rate-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: rule.scope,
          target: rule.target,
          maxRequests: rule.maxRequests,
          windowMs: rule.windowMs,
          mode: rule.mode || null,
          enabled: !rule.enabled,
          note: rule.note,
        }),
      })
      if (res.ok) fetchConfig()
    } catch (e) {
      console.error("Failed to toggle rule:", e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rate-limit rule?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/super-admin/rate-limits?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (res.ok) fetchConfig()
    } catch (e) {
      console.error("Failed to delete rule:", e)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Gauge className="h-5 w-5 text-orange-400" />
            Rate Limiting
          </h2>
          <p className="text-sm text-slate-400">
            Configure global, per-tenant, and per-endpoint request limits.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openCreate()} size="sm" className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0">
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
          <Button onClick={fetchConfig} variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Master mode */}
      <Card className="bg-slate-800/50 border-white/[0.08]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            Enforcement Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-4">
            Master switch applied to every rule. <strong className="text-slate-200">Observe</strong> counts
            overages without blocking (safe — cannot lock anyone out). <strong className="text-slate-200">Enforce</strong> returns
            429s when limits are exceeded. <strong className="text-slate-200">Off</strong> disables rate limiting entirely.
          </p>
          <div className="flex gap-2">
            {(["observe", "enforce", "off"] as MasterMode[]).map((m) => {
              const active = masterMode === m
              const tone =
                m === "enforce"
                  ? "from-red-600 to-orange-500"
                  : m === "observe"
                    ? "from-blue-600 to-emerald-500"
                    : "from-slate-600 to-slate-700"
              return (
                <button
                  key={m}
                  type="button"
                  disabled={savingMode}
                  onClick={() => handleSaveMode(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${
                    active
                      ? `bg-gradient-to-r ${tone} text-white border-transparent`
                      : "bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {m}
                </button>
              )
            })}
            {savingMode && <Loader2 className="h-4 w-4 animate-spin text-slate-400 self-center" />}
          </div>
        </CardContent>
      </Card>

      {/* Rules table */}
      <Card className="bg-slate-800/50 border-white/[0.08] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              <TableHead className="text-slate-400">Scope</TableHead>
              <TableHead className="text-slate-400">Target</TableHead>
              <TableHead className="text-slate-400">Limit</TableHead>
              <TableHead className="text-slate-400">Mode</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400 w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  <Gauge className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                  <p>No custom rules. Hardcoded presets apply as the safety floor.</p>
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => {
                const meta = SCOPE_META[rule.scope]
                const Icon = meta.Icon
                return (
                  <TableRow key={rule.id} className="border-white/[0.08] hover:bg-white/[0.02]">
                    <TableCell>
                      <span className={`flex items-center gap-2 text-sm ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-white">{rule.target}</TableCell>
                    <TableCell className="text-sm text-slate-300">
                      {rule.maxRequests} / {formatWindow(rule.windowMs)}
                    </TableCell>
                    <TableCell>
                      {rule.mode ? (
                        <Badge className={rule.mode === "enforce" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}>
                          {rule.mode}
                        </Badge>
                      ) : (
                        <span className="text-slate-600 text-xs">inherit</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => handleToggleEnabled(rule)}>
                        <Badge className={rule.enabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-pointer" : "bg-slate-500/10 text-slate-400 border-slate-500/20 cursor-pointer"}>
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleting === rule.id}
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        {deleting === rule.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Presets reference */}
      <Card className="bg-slate-800/50 border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-white text-base">Endpoint Presets (defaults)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-3">
            These hardcoded presets apply when no rule overrides them. Click to create an override.
          </p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => openCreate("endpoint", p.name, p)}
                className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-white/[0.08] text-xs text-slate-300 hover:border-orange-500/40 hover:text-white transition-colors"
              >
                <span className="font-mono text-orange-400">{p.name}</span>{" "}
                {p.maxRequests}/{formatWindow(p.windowMs)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="text-white">New Rate-Limit Rule</DialogTitle>
            <DialogDescription className="text-slate-400">
              Rules override the hardcoded presets. Most-specific wins: tenant &gt; endpoint &gt; global.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Scope</Label>
              <select
                value={form.scope}
                onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as Scope }))}
                className="w-full bg-slate-800/50 border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none"
              >
                <option value="global">Global (all requests)</option>
                <option value="tenant">Tenant (by subdomain)</option>
                <option value="endpoint">Endpoint (preset name or /path prefix)</option>
              </select>
            </div>

            {form.scope !== "global" && (
              <div className="space-y-2">
                <Label className="text-slate-300">
                  {form.scope === "tenant" ? "Subdomain" : "Endpoint (preset name or /path)"}
                </Label>
                <Input
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                  placeholder={form.scope === "tenant" ? "dzidzor" : "checkout or /api/cms/checkout"}
                  className="bg-slate-800/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Max requests</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxRequests}
                  onChange={(e) => setForm((f) => ({ ...f, maxRequests: Number(e.target.value) }))}
                  className="bg-slate-800/50 border-white/[0.08] text-white focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Window (seconds)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.window}
                  onChange={(e) => setForm((f) => ({ ...f, window: Number(e.target.value) }))}
                  className="bg-slate-800/50 border-white/[0.08] text-white focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Mode override (optional)</Label>
              <select
                value={form.mode || ""}
                onChange={(e) => setForm((f) => ({ ...f, mode: (e.target.value || null) as RuleMode }))}
                className="w-full bg-slate-800/50 border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none"
              >
                <option value="">Inherit master mode</option>
                <option value="observe">Observe (count, never block)</option>
                <option value="enforce">Enforce (429 over limit)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Note (optional)</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Why this rule exists…"
                className="bg-slate-800/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="bg-transparent border-white/10 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={handleSaveRule}
              disabled={saving || (form.scope !== "global" && !form.target.trim())}
              className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
