"use client"

/**
 * Feature Settings UI
 *
 * Admin component for managing feature enablement per tenant.
 * Shows modules with toggles, expandable sub-features, and vertical presets.
 */

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
  BarChart3,
  GraduationCap,
  Workflow,
  Star,
  Heart,
  Download,
  RefreshCcw,
  Tag,
  Package,
  MessageSquare,
  Search,
  Upload,
  GitBranch,
  Sparkles,
  Code,
  Puzzle,
  Loader2,
  Check,
  ChevronDown,
  ChevronRight,
  Rocket,
  ShoppingBag,
  Palette,
  UtensilsCrossed,
  Webhook,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeatureData {
  key: string
  name: string
  description: string
  module: string | null
  isModule: boolean
  defaultEnabled: boolean
  locked: boolean
  icon: string
  sortOrder: number
  enabled: boolean
  minTier?: string | null
}

interface ModuleGroup {
  module: FeatureData
  subFeatures: FeatureData[]
}

interface PresetData {
  id: string
  name: string
  description: string
  icon: string
  enabledFeatures: string[]
  tags: string[]
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
  BarChart3,
  GraduationCap,
  Workflow,
  Star,
  Heart,
  Download,
  RefreshCcw,
  Tag,
  Package,
  MessageSquare,
  Search,
  Upload,
  GitBranch,
  Sparkles,
  Code,
  Puzzle,
  Rocket,
  ShoppingBag,
  Palette,
  UtensilsCrossed,
  Webhook,
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FeatureSettings() {
  const [modules, setModules] = useState<ModuleGroup[]>([])
  const [presets, setPresets] = useState<PresetData[]>([])
  const [config, setConfig] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Fetch features and presets
  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch("/api/cms/admin/features")
      const json = await res.json()
      if (json.ok) {
        setConfig(json.data.config)

        // Build module groups from response
        const grouped = json.data.features as Record<
          string,
          { module: FeatureData; subFeatures: FeatureData[] }
        >
        const groups: ModuleGroup[] = Object.values(grouped).sort(
          (a, b) => a.module.sortOrder - b.module.sortOrder
        )
        setModules(groups)
      }
    } catch {
      // silent
    }
  }, [])

  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch("/api/cms/admin/features/presets")
      const json = await res.json()
      if (json.ok) setPresets(json.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchFeatures(), fetchPresets()]).finally(() =>
      setLoading(false)
    )
  }, [fetchFeatures, fetchPresets])

  // Toggle a feature
  const toggleFeature = async (key: string, currentEnabled: boolean) => {
    setTogglingKey(key)
    try {
      const res = await fetch("/api/cms/admin/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled: !currentEnabled }),
      })
      const json = await res.json()
      if (json.ok) {
        setConfig(json.data.config)
        // Refresh the full feature data to get updated sub-feature states
        await fetchFeatures()
        showSuccess(`${key} ${!currentEnabled ? "enabled" : "disabled"}`)
      }
    } finally {
      setTogglingKey(null)
    }
  }

  // Apply a preset
  const handleApplyPreset = async (presetId: string) => {
    setApplyingPreset(presetId)
    try {
      const res = await fetch("/api/cms/admin/features/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId }),
      })
      const json = await res.json()
      if (json.ok) {
        setConfig(json.data.config)
        await fetchFeatures()
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

  const toggleExpanded = (moduleKey: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleKey)) {
        next.delete(moduleKey)
      } else {
        next.add(moduleKey)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Success toast */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Vertical Presets */}
      {presets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Setup - Vertical Presets
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Apply a preset to configure all features for your use case. You can
            customize individual features afterward.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                    "text-left transition-all hover:border-primary/40 hover:bg-accent/50",
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
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {preset.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {preset.enabledFeatures
                      .filter((k) => !k.includes(".") && k !== "core")
                      .slice(0, 5)
                      .map((k) => (
                        <span
                          key={k}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {k}
                        </span>
                      ))}
                    {preset.enabledFeatures.filter(
                      (k) => !k.includes(".") && k !== "core"
                    ).length > 5 && (
                      <span className="text-[10px] text-muted-foreground">
                        +
                        {preset.enabledFeatures.filter(
                          (k) => !k.includes(".") && k !== "core"
                        ).length - 5}{" "}
                        more
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Module List with Sub-Features */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Modules & Features
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Toggle modules and their sub-features. Disabling a module automatically
          disables all its sub-features.
        </p>
        <div className="space-y-2">
          {modules.map(({ module: mod, subFeatures }) => {
            const ModIcon = iconMap[mod.icon] || Layers
            const isCore = mod.locked
            const isToggling = togglingKey === mod.key
            const isExpanded = expandedModules.has(mod.key)
            const hasSubFeatures = subFeatures.length > 0
            const enabledSubCount = subFeatures.filter(
              (f) => config[f.key]
            ).length

            return (
              <div
                key={mod.key}
                className={cn(
                  "rounded-xl border border-border bg-card overflow-hidden",
                  !config[mod.key] && "opacity-60"
                )}
              >
                {/* Module row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Expand arrow */}
                  {hasSubFeatures ? (
                    <button
                      onClick={() => toggleExpanded(mod.key)}
                      className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  ) : (
                    <div className="w-6" />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      config[mod.key]
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
                      {mod.minTier && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          {mod.minTier}+
                        </span>
                      )}
                      {hasSubFeatures && config[mod.key] && (
                        <span className="text-[10px] text-muted-foreground">
                          {enabledSubCount}/{subFeatures.length} sub-features
                        </span>
                      )}
                    </div>
                    {mod.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {mod.description}
                      </p>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleFeature(mod.key, !!config[mod.key])}
                    disabled={isCore || !!togglingKey}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      config[mod.key] ? "bg-primary" : "bg-muted"
                    )}
                    role="switch"
                    aria-checked={!!config[mod.key]}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                        config[mod.key] ? "translate-x-5" : "translate-x-0"
                      )}
                    >
                      {isToggling && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground absolute top-1 left-1" />
                      )}
                    </span>
                  </button>
                </div>

                {/* Sub-features (expandable) */}
                {hasSubFeatures && isExpanded && config[mod.key] && (
                  <div className="border-t border-border bg-muted/30 px-5 py-3">
                    <div className="space-y-2 ml-6">
                      {subFeatures.map((sub) => {
                        const SubIcon = iconMap[sub.icon] || Layers
                        const isSubToggling = togglingKey === sub.key

                        return (
                          <div
                            key={sub.key}
                            className="flex items-center gap-3 py-2"
                          >
                            <SubIcon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                config[sub.key]
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {sub.name}
                                </span>
                                {sub.minTier && (
                                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                    {sub.minTier}+
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {sub.description}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                toggleFeature(sub.key, !!config[sub.key])
                              }
                              disabled={!!togglingKey}
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                "disabled:cursor-not-allowed disabled:opacity-50",
                                config[sub.key] ? "bg-primary" : "bg-muted"
                              )}
                              role="switch"
                              aria-checked={!!config[sub.key]}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform",
                                  config[sub.key]
                                    ? "translate-x-4"
                                    : "translate-x-0"
                                )}
                              >
                                {isSubToggling && (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground absolute top-0.5 left-0.5" />
                                )}
                              </span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
