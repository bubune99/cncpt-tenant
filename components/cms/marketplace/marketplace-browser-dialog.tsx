"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cms/ui/dialog"
import { Input } from "@/components/cms/ui/input"
import { Button } from "@/components/cms/ui/button"
import { Badge } from "@/components/cms/ui/badge"
import { ScrollArea } from "@/components/cms/ui/scroll-area"
import { Skeleton } from "@/components/cms/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cms/ui/select"
import {
  Search,
  X,
  Plus,
  Eye,
  Globe,
  Puzzle,
  TrendingUp,
  Store,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/cms/utils"
import type { MarketplaceTemplate, MarketplacePageData, TemplateType } from "./types"

interface MarketplaceBrowserDialogProps {
  children: React.ReactNode
  /** Called when user selects a template to insert into the current page */
  onInsertTemplate: (template: MarketplaceTemplate) => void
  /** Called to preview a template */
  onPreviewTemplate?: (template: MarketplaceTemplate) => void
}

/**
 * Lightweight marketplace browser dialog for the page editor.
 * Shows a compact grid of templates that can be inserted directly
 * into the currently editing page.
 */
export function MarketplaceBrowserDialog({
  children,
  onInsertTemplate,
  onPreviewTemplate,
}: MarketplaceBrowserDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [type, setType] = useState<TemplateType | "all">("all")
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [category, setCategory] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch templates
  useEffect(() => {
    if (!open) return

    const fetchTemplates = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (type !== "all") params.set("type", type)
        if (category) params.set("category", category)
        params.set("sort", "popular")
        params.set("page", "1")
        params.set("pageSize", "20")

        const res = await fetch(`/api/cms/marketplace?${params}`)
        if (!res.ok) {
          setTemplates([])
          return
        }
        const data: MarketplacePageData = await res.json()
        setTemplates(data.templates)
        if (data.categories.length > 0) setCategories(data.categories)
      } catch {
        setTemplates([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [open, debouncedSearch, type, category])

  const handleInsert = useCallback(
    (template: MarketplaceTemplate) => {
      onInsertTemplate(template)
      setOpen(false)
    },
    [onInsertTemplate]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-primary" />
            <DialogTitle>Browse Templates</DialogTitle>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-border space-y-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-8 pr-8 h-8 text-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="flex items-center rounded-md border border-border">
              {(
                [
                  { value: "all", label: "All" },
                  { value: "site", label: "Sites" },
                  { value: "component", label: "Components" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium transition-colors",
                    type === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Category select */}
            <Select
              value={category || "__all__"}
              onValueChange={(v) => setCategory(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__" className="text-xs">
                  All Categories
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Template grid */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border overflow-hidden">
                    <Skeleton className="aspect-[16/10] w-full" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Store size={32} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No templates found
                </p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Try a different search or filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {templates.map((template) => (
                  <CompactTemplateCard
                    key={template.id}
                    template={template}
                    onInsert={handleInsert}
                    onPreview={onPreviewTemplate}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with link to full marketplace */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {templates.length} template{templates.length !== 1 ? "s" : ""} shown
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => {
              setOpen(false)
              window.open("/admin/marketplace", "_blank")
            }}
          >
            <ExternalLink size={12} />
            Open Full Marketplace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CompactTemplateCard({
  template,
  onInsert,
  onPreview,
}: {
  template: MarketplaceTemplate
  onInsert: (t: MarketplaceTemplate) => void
  onPreview?: (t: MarketplaceTemplate) => void
}) {
  // Simple hash for gradient
  const hash = template.name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const gradients = [
    "from-blue-600/20 via-purple-600/20 to-pink-600/20",
    "from-emerald-600/20 via-teal-600/20 to-cyan-600/20",
    "from-orange-600/20 via-red-600/20 to-pink-600/20",
    "from-violet-600/20 via-indigo-600/20 to-blue-600/20",
    "from-amber-600/20 via-yellow-600/20 to-lime-600/20",
    "from-rose-600/20 via-pink-600/20 to-fuchsia-600/20",
  ]

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-sm">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="h-full w-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              gradients[hash % gradients.length]
            )}
          >
            {template.type === "site" ? (
              <Globe size={18} className="text-muted-foreground/40" />
            ) : (
              <Puzzle size={18} className="text-muted-foreground/40" />
            )}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
          {onPreview && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onPreview(template)}
              className="h-7 text-[10px] gap-1"
            >
              <Eye size={12} />
              Preview
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onInsert(template)}
            className="h-7 text-[10px] gap-1"
          >
            <Plus size={12} />
            Insert
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h4 className="text-xs font-medium text-foreground line-clamp-1">
          {template.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge variant="outline" className="text-[8px] px-1 py-0 capitalize">
            {template.category}
          </Badge>
          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
            <TrendingUp size={8} />
            {template.usageCount}
          </span>
        </div>
      </div>
    </div>
  )
}
