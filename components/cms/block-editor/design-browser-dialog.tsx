"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/cms/ui/dialog"
import { Button } from "@/components/cms/ui/button"
import { Input } from "@/components/cms/ui/input"
import { BlockRenderer } from "./block-renderer"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { PAGE_TEMPLATES, type PageTemplate } from "@/lib/cms/block-editor/page-templates"
import { FEATURE_PRESETS, type FeaturePreset } from "@/lib/cms/features/presets"
import { generateThemeCss } from "@/lib/cms/theme/color-utils"
import {
  DEFAULT_DASHBOARD_THEME,
  type DashboardTheme,
} from "@/lib/cms/dashboard/theme"
import type { MarketplaceTemplate, MarketplacePageData } from "@/components/cms/marketplace/types"
import type { Block } from "@/lib/cms/block-editor/types"
import { cn } from "@/lib/cms/utils"
import { toast } from "sonner"
import {
  LayoutGrid,
  LayoutTemplate,
  Palette,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Replace,
  X,
  Monitor,
  Tablet,
  Smartphone,
  Loader2,
  ShoppingCart,
  ShoppingBag,
  GraduationCap,
  UtensilsCrossed,
  FileText,
  Rocket,
  Layers as LayersIcon,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────

type Tab = "templates" | "presets" | "design"

interface UnifiedTemplate {
  id: string
  name: string
  description: string
  category: string
  source: string
  blocks: Block[]
  type: "marketplace" | "builtin"
}

// ── Icon map for presets ─────────────────────────────────────────────

const PRESET_ICONS: Record<string, React.ReactNode> = {
  ShoppingCart: <ShoppingCart size={20} />,
  ShoppingBag: <ShoppingBag size={20} />,
  Palette: <Palette size={20} />,
  UtensilsCrossed: <UtensilsCrossed size={20} />,
  GraduationCap: <GraduationCap size={20} />,
  FileText: <FileText size={20} />,
  Rocket: <Rocket size={20} />,
  Layers: <LayersIcon size={20} />,
}

// ── Font options ─────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { label: "System Default", value: "" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
]

// ── Preview Renderer ─────────────────────────────────────────────────

function PreviewRenderer({ blocks }: { blocks: Block[] }) {
  const renderChildren = (children: Block[]) =>
    children.map((child) => (
      <BlockRenderer key={child.id} block={child} renderChildren={renderChildren} isPreview />
    ))

  return (
    <>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} renderChildren={renderChildren} isPreview />
      ))}
    </>
  )
}

// ── Main Component ───────────────────────────────────────────────────

interface DesignBrowserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DesignBrowserDialog({ open, onOpenChange }: DesignBrowserDialogProps) {
  const editor = useEditor()
  const { setBlocks, addBlockRaw } = editor

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("templates")

  // Templates tab state
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [marketplaceData, setMarketplaceData] = useState<MarketplacePageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")

  // Design tab state
  const [theme, setTheme] = useState<DashboardTheme>({ ...DEFAULT_DASHBOARD_THEME })
  const [previewCss, setPreviewCss] = useState("")

  // Fetch marketplace templates
  useEffect(() => {
    if (!open) return
    setLoading(true)
    const params = new URLSearchParams({ page: "1", pageSize: "200" })
    if (search) params.set("search", search)
    if (sourceFilter !== "all") params.set("source", sourceFilter)
    if (categoryFilter !== "all") params.set("category", categoryFilter)

    fetch(`/api/cms/marketplace?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MarketplacePageData | null) => {
        if (data) setMarketplaceData(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, search, sourceFilter, categoryFilter])

  // Merge marketplace + built-in templates into unified list
  const allTemplates: UnifiedTemplate[] = useMemo(() => {
    const builtIn: UnifiedTemplate[] = PAGE_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      source: "Built-in",
      blocks: t.blocks(),
      type: "builtin" as const,
    }))

    const marketplace: UnifiedTemplate[] = (marketplaceData?.templates || []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      source: t.source,
      blocks: t.blocks as Block[],
      type: "marketplace" as const,
    }))

    // Filter by source
    let merged = [...builtIn, ...marketplace]
    if (sourceFilter === "Built-in") {
      merged = builtIn
    } else if (sourceFilter !== "all") {
      merged = marketplace.filter((t) => t.source === sourceFilter)
    }

    return merged
  }, [marketplaceData, sourceFilter])

  // Available sources and categories for filters
  const sources = useMemo(() => {
    const s = new Set<string>(["all", "Built-in"])
    ;(marketplaceData?.sources || []).forEach((src) => s.add(src))
    return [...s]
  }, [marketplaceData])

  const categories = useMemo(() => {
    const c = new Set<string>(["all"])
    allTemplates.forEach((t) => c.add(t.category))
    return [...c]
  }, [allTemplates])

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let list = allTemplates
    if (categoryFilter !== "all") {
      list = list.filter((t) => t.category === categoryFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [allTemplates, categoryFilter, search])

  // Selected template
  const selected = filteredTemplates[selectedIndex] || null

  // Clamp selectedIndex when list changes
  useEffect(() => {
    if (selectedIndex >= filteredTemplates.length) {
      setSelectedIndex(Math.max(0, filteredTemplates.length - 1))
    }
  }, [filteredTemplates.length, selectedIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!open || activeTab !== "templates") return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(0, i - 1))
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(filteredTemplates.length - 1, i + 1))
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, activeTab, filteredTemplates.length])

  // Actions
  const handleInsert = useCallback(() => {
    if (!selected) return
    for (const block of selected.blocks) {
      addBlockRaw(block)
    }
    toast.success(`Inserted "${selected.name}" (${selected.blocks.length} blocks)`)
  }, [selected, addBlockRaw])

  const handleReplace = useCallback(() => {
    if (!selected) return
    if (!confirm(`Replace all blocks with "${selected.name}"? This cannot be undone.`)) return
    setBlocks(selected.blocks)
    toast.success(`Applied "${selected.name}"`)
    onOpenChange(false)
  }, [selected, setBlocks, onOpenChange])

  // Design tab: update preview CSS
  useEffect(() => {
    const css = generateThemeCss(theme.primaryColor, theme.accentColor)
    setPreviewCss(css)
  }, [theme.primaryColor, theme.accentColor])

  const handleApplyTheme = useCallback(async () => {
    try {
      const res = await fetch("/api/cms/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "dashboard.theme",
          value: JSON.stringify(theme),
          group: "dashboard",
        }),
      })
      if (res.ok) {
        toast.success("Theme applied to site")
      } else {
        toast.error("Failed to save theme")
      }
    } catch {
      toast.error("Failed to save theme")
    }
  }, [theme])

  // Viewport width
  const viewportWidth = viewport === "mobile" ? "375px" : viewport === "tablet" ? "768px" : "100%"

  // Sidebar tabs
  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "templates", icon: <LayoutGrid size={18} />, label: "Templates" },
    { id: "presets", icon: <LayoutTemplate size={18} />, label: "Presets" },
    { id: "design", icon: <Palette size={18} />, label: "Design" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0 overflow-hidden">
        <div className="flex h-full">
          {/* Icon sidebar */}
          <div className="w-14 flex flex-col items-center gap-1 py-4 border-r border-border bg-muted/30 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={tab.label}
              >
                {tab.icon}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-semibold">
                  {activeTab === "templates" && "Template Browser"}
                  {activeTab === "presets" && "Page Presets"}
                  {activeTab === "design" && "Design System"}
                </DialogTitle>
                {activeTab === "templates" && (
                  <div className="flex items-center gap-2">
                    {/* Viewport toggle */}
                    <div className="flex items-center rounded-md border border-border">
                      <button
                        onClick={() => setViewport("desktop")}
                        className={cn("h-7 px-2 rounded-l-md transition-colors", viewport === "desktop" ? "bg-secondary" : "hover:bg-muted")}
                      >
                        <Monitor size={13} />
                      </button>
                      <button
                        onClick={() => setViewport("tablet")}
                        className={cn("h-7 px-2 border-x border-border transition-colors", viewport === "tablet" ? "bg-secondary" : "hover:bg-muted")}
                      >
                        <Tablet size={13} />
                      </button>
                      <button
                        onClick={() => setViewport("mobile")}
                        className={cn("h-7 px-2 rounded-r-md transition-colors", viewport === "mobile" ? "bg-secondary" : "hover:bg-muted")}
                      >
                        <Smartphone size={13} />
                      </button>
                    </div>
                    {/* Counter */}
                    <span className="text-xs text-muted-foreground">
                      {selectedIndex + 1} / {filteredTemplates.length}
                    </span>
                  </div>
                )}
              </div>
            </DialogHeader>

            {/* Tab Content */}
            {activeTab === "templates" && (
              <TemplatesTab
                search={search}
                onSearchChange={setSearch}
                sourceFilter={sourceFilter}
                onSourceFilterChange={setSourceFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                sources={sources}
                categories={categories}
                filteredTemplates={filteredTemplates}
                selectedIndex={selectedIndex}
                onSelectIndex={setSelectedIndex}
                selected={selected}
                loading={loading}
                viewportWidth={viewportWidth}
                onInsert={handleInsert}
                onReplace={handleReplace}
              />
            )}

            {activeTab === "presets" && (
              <PresetsTab
                onApply={(blocks) => {
                  if (!confirm("Replace all blocks with this preset? This cannot be undone.")) return
                  setBlocks(blocks)
                  toast.success("Preset applied")
                  onOpenChange(false)
                }}
                onInsert={(blocks) => {
                  for (const block of blocks) addBlockRaw(block)
                  toast.success(`Inserted ${blocks.length} blocks`)
                }}
              />
            )}

            {activeTab === "design" && (
              <DesignTab
                theme={theme}
                onThemeChange={setTheme}
                previewCss={previewCss}
                onApply={handleApplyTheme}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Templates Tab ────────────────────────────────────────────────────

function TemplatesTab({
  search,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sources,
  categories,
  filteredTemplates,
  selectedIndex,
  onSelectIndex,
  selected,
  loading,
  viewportWidth,
  onInsert,
  onReplace,
}: {
  search: string
  onSearchChange: (v: string) => void
  sourceFilter: string
  onSourceFilterChange: (v: string) => void
  categoryFilter: string
  onCategoryFilterChange: (v: string) => void
  sources: string[]
  categories: string[]
  filteredTemplates: UnifiedTemplate[]
  selectedIndex: number
  onSelectIndex: (i: number) => void
  selected: UnifiedTemplate | null
  loading: boolean
  viewportWidth: string
  onInsert: () => void
  onReplace: () => void
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Template list */}
      <div className="w-[320px] flex flex-col border-r border-border shrink-0">
        {/* Filters */}
        <div className="p-3 space-y-2 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search templates..."
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            <select
              value={sourceFilter}
              onChange={(e) => onSourceFilterChange(e.target.value)}
              className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs"
            >
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Sources" : s}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
              <p>No templates found</p>
            </div>
          )}
          {!loading &&
            filteredTemplates.map((t, i) => (
              <button
                key={t.id}
                onClick={() => onSelectIndex(i)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-border transition-colors",
                  i === selectedIndex
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{t.name}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2",
                      t.type === "builtin"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    )}
                  >
                    {t.source}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {t.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {t.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t.blocks.length} blocks
                  </span>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Right: Preview + Actions */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            {/* Preview area */}
            <div className="flex-1 overflow-auto bg-muted/20 p-4">
              <div className="flex justify-center">
                <div
                  className="bg-white transition-all duration-300"
                  style={{
                    maxWidth: viewportWidth === "100%" ? undefined : viewportWidth,
                    width: "100%",
                    boxShadow: "0 0 0 1px var(--border)",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <PreviewRenderer blocks={selected.blocks} />
                </div>
              </div>
            </div>

            {/* Bottom actions bar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex <= 0}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectIndex(Math.min(filteredTemplates.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex >= filteredTemplates.length - 1}
                >
                  <ChevronRight size={14} />
                </Button>
                <span className="text-xs text-muted-foreground ml-1">
                  Use arrow keys to browse
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onReplace} className="gap-1.5">
                  <Replace size={14} /> Replace Page
                </Button>
                <Button size="sm" onClick={onInsert} className="gap-1.5">
                  <Plus size={14} /> Insert into Page
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a template to preview
          </div>
        )}
      </div>
    </div>
  )
}

// ── Presets Tab ───────────────────────────────────────────────────────

function PresetsTab({
  onApply,
  onInsert,
}: {
  onApply: (blocks: Block[]) => void
  onInsert: (blocks: Block[]) => void
}) {
  const [selectedPreset, setSelectedPreset] = useState<PageTemplate | null>(null)
  const [previewBlocks, setPreviewBlocks] = useState<Block[]>([])

  const handleSelectPreset = useCallback((preset: PageTemplate) => {
    setSelectedPreset(preset)
    setPreviewBlocks(preset.blocks())
  }, [])

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Preset grid */}
      <div className="w-[320px] flex flex-col border-r border-border shrink-0 overflow-y-auto p-3 gap-2">
        <p className="text-xs text-muted-foreground mb-1">
          Built-in page templates to start from
        </p>
        {PAGE_TEMPLATES.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset)}
            className={cn(
              "w-full text-left rounded-lg border p-3 transition-colors",
              selectedPreset?.id === preset.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                <LayoutTemplate size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{preset.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{preset.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {preset.category}
              </span>
            </div>
          </button>
        ))}

        {/* Feature presets section */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-foreground mb-2">Vertical Presets</p>
          <p className="text-[11px] text-muted-foreground mb-3">
            Pre-configured feature bundles for different business types
          </p>
          {FEATURE_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3 mb-2"
            >
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                {PRESET_ICONS[preset.icon] || <LayersIcon size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{preset.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPreset && previewBlocks.length > 0 ? (
          <>
            <div className="flex-1 overflow-auto bg-muted/20 p-4">
              <div
                className="bg-white mx-auto"
                style={{
                  boxShadow: "0 0 0 1px var(--border)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <PreviewRenderer blocks={previewBlocks} />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background shrink-0">
              <span className="text-sm font-medium">{selectedPreset.name}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onApply(previewBlocks)} className="gap-1.5">
                  <Replace size={14} /> Apply as Page
                </Button>
                <Button size="sm" onClick={() => onInsert(previewBlocks)} className="gap-1.5">
                  <Plus size={14} /> Insert
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a preset to preview
          </div>
        )}
      </div>
    </div>
  )
}

// ── Design Tab ───────────────────────────────────────────────────────

function DesignTab({
  theme,
  onThemeChange,
  previewCss,
  onApply,
}: {
  theme: DashboardTheme
  onThemeChange: (theme: DashboardTheme) => void
  previewCss: string
  onApply: () => void
}) {
  const updateField = <K extends keyof DashboardTheme>(key: K, value: DashboardTheme[K]) => {
    onThemeChange({ ...theme, [key]: value })
  }

  const radiusOptions: DashboardTheme["borderRadius"][] = ["none", "sm", "md", "lg", "xl"]
  const cardStyles: DashboardTheme["cardStyle"][] = ["flat", "bordered", "elevated", "glass"]

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Controls */}
      <div className="w-[320px] flex flex-col border-r border-border shrink-0 overflow-y-auto p-4 gap-5">
        {/* Colors */}
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Colors</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={theme.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="h-8 text-xs font-mono flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={theme.accentColor}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="h-8 text-xs font-mono flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => updateField("backgroundColor", e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={theme.backgroundColor}
                  onChange={(e) => updateField("backgroundColor", e.target.value)}
                  className="h-8 text-xs font-mono flex-1"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Typography</h4>
          <select
            value={theme.fontFamily || ""}
            onChange={(e) => updateField("fontFamily", e.target.value || undefined)}
            className="w-full h-8 rounded-md border border-border bg-background px-2 text-sm"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Border Radius */}
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Border Radius</h4>
          <div className="flex gap-1">
            {radiusOptions.map((r) => (
              <button
                key={r}
                onClick={() => updateField("borderRadius", r)}
                className={cn(
                  "flex-1 h-8 rounded-md text-xs font-medium transition-colors border",
                  theme.borderRadius === r
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Card Style */}
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Card Style</h4>
          <div className="grid grid-cols-2 gap-2">
            {cardStyles.map((s) => (
              <button
                key={s}
                onClick={() => updateField("cardStyle", s)}
                className={cn(
                  "h-16 rounded-lg text-xs font-medium transition-colors border flex flex-col items-center justify-center gap-1",
                  theme.cardStyle === s
                    ? "bg-primary/10 text-primary border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                )}
              >
                <div
                  className="w-8 h-5 rounded"
                  style={{
                    background:
                      s === "glass"
                        ? "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3))"
                        : s === "elevated"
                        ? "#fff"
                        : s === "flat"
                        ? "#f3f4f6"
                        : "#fff",
                    border: s === "bordered" ? "1px solid #e5e7eb" : "none",
                    boxShadow: s === "elevated" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                />
                <span className="capitalize">{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Dark Mode</span>
          <button
            onClick={() => updateField("darkMode", !theme.darkMode)}
            className={cn(
              "w-10 h-5 rounded-full transition-colors relative",
              theme.darkMode ? "bg-primary" : "bg-muted"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform",
                theme.darkMode ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        {/* Apply button */}
        <Button onClick={onApply} className="w-full gap-1.5 mt-2">
          Apply to Site
        </Button>
      </div>

      {/* Right: Preview */}
      <div className="flex-1 overflow-auto bg-muted/20 p-6">
        {/* Inject preview CSS */}
        {previewCss && <style dangerouslySetInnerHTML={{ __html: previewCss }} />}

        <div className="max-w-md mx-auto space-y-4">
          {/* Preview card */}
          <div
            className="rounded-lg p-6"
            style={{
              background: theme.backgroundColor,
              fontFamily: theme.fontFamily || "inherit",
            }}
          >
            <h3 className="text-lg font-semibold mb-1" style={{ color: theme.primaryColor }}>
              Preview Card
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This is how your design tokens look in context.
            </p>
            <div
              className="p-4 mb-4"
              style={{
                borderRadius:
                  theme.borderRadius === "none" ? "0" :
                  theme.borderRadius === "sm" ? "0.25rem" :
                  theme.borderRadius === "md" ? "0.5rem" :
                  theme.borderRadius === "lg" ? "0.75rem" : "1rem",
                border: theme.cardStyle === "bordered" ? "1px solid #e5e7eb" : "none",
                boxShadow: theme.cardStyle === "elevated" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                background:
                  theme.cardStyle === "glass"
                    ? "rgba(255,255,255,0.7)"
                    : theme.cardStyle === "flat"
                    ? "#f9fafb"
                    : "#fff",
                backdropFilter: theme.cardStyle === "glass" ? "blur(8px)" : "none",
              }}
            >
              <p className="text-sm font-medium mb-2">Nested Card Element</p>
              <p className="text-xs text-gray-500">Shows card style, radius, and shadow.</p>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                style={{ background: theme.primaryColor }}
              >
                Primary Action
              </button>
              <button
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: theme.accentColor,
                  color: "#fff",
                }}
              >
                Accent Action
              </button>
            </div>
          </div>

          {/* Color swatches */}
          <div className="flex gap-3">
            <div className="flex-1 text-center">
              <div
                className="h-12 rounded-lg mb-1"
                style={{ background: theme.primaryColor }}
              />
              <span className="text-[10px] text-muted-foreground">Primary</span>
            </div>
            <div className="flex-1 text-center">
              <div
                className="h-12 rounded-lg mb-1"
                style={{ background: theme.accentColor }}
              />
              <span className="text-[10px] text-muted-foreground">Accent</span>
            </div>
            <div className="flex-1 text-center">
              <div
                className="h-12 rounded-lg mb-1 border border-border"
                style={{ background: theme.backgroundColor }}
              />
              <span className="text-[10px] text-muted-foreground">Background</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
