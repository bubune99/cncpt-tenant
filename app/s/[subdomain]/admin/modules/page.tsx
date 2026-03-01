"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  Layers,
  ShoppingCart,
  FileText,
  ClipboardList,
  Image,
  CalendarDays,
  Mail,
  ShoppingBag,
  Palette,
  Settings,
  Loader2,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CmsModuleRow {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  version: string
  enabled: boolean
  builtIn: boolean
  config: Record<string, unknown> | null
  sortOrder: number
}

interface PresetData {
  id: string
  name: string
  description: string
  icon: string
  enabledModules: string[]
}

/* ------------------------------------------------------------------ */
/*  Icon Map                                                           */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = {
  LayoutDashboard,
  Layers,
  ShoppingCart,
  FileText,
  ClipboardList,
  Image,
  CalendarDays,
  Mail,
  ShoppingBag,
  Palette,
  Settings,
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ModulesPage() {
  const [modules, setModules] = useState<CmsModuleRow[]>([])
  const [presets, setPresets] = useState<PresetData[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null)
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    const res = await fetch("/api/cms/admin/modules")
    const json = await res.json()
    if (json.ok) setModules(json.data)
  }, [])

  const fetchPresets = useCallback(async () => {
    const res = await fetch("/api/cms/admin/modules/presets")
    const json = await res.json()
    if (json.ok) setPresets(json.data)
  }, [])

  useEffect(() => {
    Promise.all([fetchModules(), fetchPresets()]).finally(() =>
      setLoading(false)
    )
  }, [fetchModules, fetchPresets])

  const toggleModule = async (slug: string, currentEnabled: boolean) => {
    setTogglingSlug(slug)
    try {
      const res = await fetch("/api/cms/admin/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, enabled: !currentEnabled }),
      })
      const json = await res.json()
      if (json.ok) {
        setModules((prev) =>
          prev.map((m) =>
            m.slug === slug ? { ...m, enabled: !currentEnabled } : m
          )
        )
        showSuccess(`${slug} ${!currentEnabled ? "enabled" : "disabled"}`)
      }
    } finally {
      setTogglingSlug(null)
    }
  }

  const handleApplyPreset = async (presetId: string) => {
    setApplyingPreset(presetId)
    try {
      const res = await fetch("/api/cms/admin/modules/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId }),
      })
      const json = await res.json()
      if (json.ok) {
        await fetchModules()
        const preset = presets.find((p) => p.id === presetId)
        showSuccess(`Applied "${preset?.name}" preset`)
      }
    } finally {
      setApplyingPreset(null)
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enable or disable CMS features. Changes take effect immediately.
          </p>
        </div>
        <a
          href="/admin/features"
          className="text-sm text-primary hover:underline font-medium"
        >
          Advanced Feature Settings &rarr;
        </a>
      </div>

      {/* Success toast */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <Check className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Quick Setup Presets */}
      {presets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Setup
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {presets.map((preset) => {
              const PresetIcon = iconMap[preset.icon] || Layers
              const isApplying = applyingPreset === preset.id

              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  disabled={!!applyingPreset}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4",
                    "text-left transition-all hover:border-primary/40 hover:bg-accent",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isApplying ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <PresetIcon className="h-5 w-5 text-primary" />
                    )}
                    <span className="text-sm font-semibold">{preset.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {preset.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {preset.enabledModules
                      .filter((s) => s !== "core")
                      .map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {s}
                        </span>
                      ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Module List */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          All Modules
        </h2>
        <div className="space-y-2">
          {modules.map((mod) => {
            const ModIcon = iconMap[mod.icon || ""] || Layers
            const isCore = mod.slug === "core"
            const isToggling = togglingSlug === mod.slug

            return (
              <div
                key={mod.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4",
                  !mod.enabled && "opacity-60"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    mod.enabled
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <ModIcon className="h-5 w-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{mod.name}</span>
                    {isCore && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Required
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      v{mod.version}
                    </span>
                  </div>
                  {mod.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {mod.description}
                    </p>
                  )}
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleModule(mod.slug, mod.enabled)}
                  disabled={isCore || !!togglingSlug}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    mod.enabled ? "bg-primary" : "bg-muted"
                  )}
                  role="switch"
                  aria-checked={mod.enabled}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                      mod.enabled ? "translate-x-5" : "translate-x-0"
                    )}
                  >
                    {isToggling && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground absolute top-1 left-1" />
                    )}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
