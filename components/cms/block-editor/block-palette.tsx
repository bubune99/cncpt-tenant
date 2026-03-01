"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import {
  Type,
  AlignLeft,
  Image,
  ImageIcon,
  MousePointerClick,
  MoveVertical,
  Minus,
  Columns3,
  LayoutGrid,
  Square,
  PanelTop,
  PanelBottom,
  Tag,
  CircleUser,
  TextCursorInput,
  FileText,
  ChevronRight,
  FormInput,
  Search,
  X,
  Menu,
  Link,
  Quote,
  Sparkles,
  List,
  ListOrdered,
  RectangleHorizontal,
  Rows3,
  Code,
  Plus,
  GripVertical,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Grid3X3,
  Palette,
  Package,
  Wallet,
  RefreshCw,
  Table,
  PlusCircle,
  Zap,
  Store,
} from "lucide-react"
import { BLOCK_TEMPLATES, BLOCK_CATEGORIES, COMMERCE_PROVIDERS } from "@/lib/cms/block-editor/block-templates"
import type { Block, CommerceProvider } from "@/lib/cms/block-editor/types"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { cn } from "@/lib/cms/utils"
import { usePartials } from "@/lib/cms/api/domains/partials/hooks"
import type { PartialDto } from "@/lib/cms/api/domains/partials/types"
import { generateId } from "@/lib/cms/block-editor/tree-utils"
import { Layers } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lucide-react multi-version type conflict in pnpm
const iconMap: Record<string, any> = {
  Type, AlignLeft, Image, ImageIcon, MousePointerClick, MoveVertical, Minus,
  Columns3, LayoutGrid, Square, PanelTop, PanelBottom, Tag,
  CircleUser, TextCursorInput, FileText, FormInput,
  Menu, Link, Quote, Sparkles, List, ListOrdered,
  RectangleHorizontal, Rows3, Code,
  // Commerce icons
  ShoppingBag, ShoppingCart, CreditCard, DollarSign, Grid3X3, Palette, Search,
  Package, Wallet, RefreshCw, Table, PlusCircle, Zap, Store,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lucide-react multi-version type conflict in pnpm
const categoryIconMap: Record<string, any> = {
  LayoutGrid, Type, Image, MousePointerClick, FormInput, ShoppingCart,
}

// Provider badge styling
const providerStyles: Record<CommerceProvider, { bg: string; text: string; label: string }> = {
  generic: { bg: "bg-gray-500/10", text: "text-gray-400", label: "CMS" },
  shopify: { bg: "bg-green-500/10", text: "text-green-400", label: "Shopify" },
  stripe: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Stripe" },
  paypal: { bg: "bg-blue-500/10", text: "text-blue-400", label: "PayPal" },
  snipcart: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Snipcart" },
  medusa: { bg: "bg-violet-500/10", text: "text-violet-400", label: "Medusa" },
  saleor: { bg: "bg-indigo-500/10", text: "text-indigo-400", label: "Saleor" },
}

export function BlockPalette({
  enabledCategories,
}: {
  enabledCategories?: Set<string> | null
} = {}) {
  const { addBlockFromTemplate, addBlockRaw, state } = useEditor()
  const { data: partialsList } = usePartials({ status: "PUBLISHED" as any })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(BLOCK_CATEGORIES.map((c) => c.id))
  )
  const [search, setSearch] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const dragGhostRef = useRef<HTMLDivElement>(null)

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return BLOCK_TEMPLATES.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    )
  }, [search])

  const handleDragStart = useCallback((e: React.DragEvent, template: typeof BLOCK_TEMPLATES[number]) => {
    e.dataTransfer.setData("application/palette-label", template.label)
    e.dataTransfer.effectAllowed = "copy"
    setIsDragging(true)
    
    // Create custom drag image
    if (dragGhostRef.current) {
      const Icon = iconMap[template.icon]
      const ghost = dragGhostRef.current
      ghost.innerHTML = `
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground shadow-lg border border-primary/20">
          <span class="text-xs font-medium">${template.label}</span>
        </div>
      `
      ghost.style.position = "fixed"
      ghost.style.top = "-1000px"
      ghost.style.left = "-1000px"
      document.body.appendChild(ghost)
      e.dataTransfer.setDragImage(ghost, 50, 20)
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Quick add: adds block after currently selected block, or at end
  const handleQuickAdd = useCallback((label: string) => {
    addBlockFromTemplate(label)
  }, [addBlockFromTemplate])

  const renderBlockButton = (template: (typeof BLOCK_TEMPLATES)[number]) => {
    const Icon = iconMap[template.icon]
    const provider = template.commerceProvider || template.defaultCommerce?.provider
    const providerStyle = provider ? providerStyles[provider] : null
    const isCommerce = template.category === "commerce"

    return (
      <div
        key={template.label}
        draggable
        onDragStart={(e) => handleDragStart(e, template)}
        onDragEnd={handleDragEnd}
        className={cn(
          "group flex items-center gap-2 rounded-md px-2 py-1.5",
          "text-sm text-card-foreground",
          "transition-all duration-150",
          "hover:bg-accent",
          "cursor-grab active:cursor-grabbing",
          "select-none"
        )}
        title={template.description || template.label}
      >
        {/* Drag grip indicator */}
        <div className="flex items-center text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
          <GripVertical size={12} />
        </div>

        {/* Icon */}
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md group-hover:bg-accent/80",
          providerStyle ? providerStyle.bg : "bg-accent"
        )}>
          {Icon ? (
            <Icon size={14} className={cn(
              providerStyle ? providerStyle.text : "text-muted-foreground"
            )} />
          ) : (
            <Square size={14} className="text-muted-foreground" />
          )}
        </div>

        {/* Label */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">{template.label}</span>
            {isCommerce && providerStyle && provider !== "generic" && (
              <span className={cn(
                "px-1 py-0.5 text-[8px] font-medium rounded",
                providerStyle.bg,
                providerStyle.text
              )}>
                {providerStyle.label}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {template.componentName ? `<${template.componentName}>` : `<${template.tag}>`}
          </span>
        </div>

        {/* Quick add button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleQuickAdd(template.label)
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all"
          title="Quick add to page"
        >
          <Plus size={12} />
        </button>
      </div>
    )
  }

  return (
    <aside className={cn(
      "flex w-64 flex-col border-r border-border bg-card transition-opacity",
      isDragging && "opacity-60"
    )}>
      {/* Hidden drag ghost element */}
      <div ref={dragGhostRef} aria-hidden="true" />
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <LayoutGrid className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-card-foreground">Blocks</h2>
          <p className="text-xs text-muted-foreground">Drag to canvas</p>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border px-3 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blocks..."
            className="h-8 w-full rounded-md border border-border bg-input pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col py-2">
          {/* Search results mode */}
          {filteredTemplates ? (
            <div className="flex flex-col gap-0.5 px-2">
              {filteredTemplates.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  No blocks match &ldquo;{search}&rdquo;
                </p>
              ) : (
                <>
                  <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {filteredTemplates.length} result{filteredTemplates.length !== 1 && "s"}
                  </p>
                  {filteredTemplates.map(renderBlockButton)}
                </>
              )}
            </div>
          ) : (
            /* Categories mode — filter by enabled modules */
            <>
              {(enabledCategories
                ? BLOCK_CATEGORIES.filter((c) => enabledCategories.has(c.id))
                : BLOCK_CATEGORIES
              ).map((category) => {
                const isExpanded = expandedCategories.has(category.id)
                const templates = BLOCK_TEMPLATES.filter((t) => t.category === category.id)
                const CategoryIcon = categoryIconMap[category.icon] || LayoutGrid

                return (
                  <div key={category.id}>
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ChevronRight
                        size={12}
                        className={cn(
                          "transition-transform duration-200",
                          isExpanded && "rotate-90"
                        )}
                      />
                      <CategoryIcon size={12} />
                      {category.label}
                      <span className="ml-auto text-[10px] font-normal opacity-60">
                        {templates.length}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="flex flex-col gap-0.5 px-2 pb-2">
                        {templates.map(renderBlockButton)}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Dynamic Partials section */}
              <PartialsPaletteSection
                partials={partialsList ?? []}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
                addBlockRaw={addBlockRaw}
                currentPageId={state.currentPage?.id}
              />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

/* ---- Partials Palette Section ---- */

interface PartialsPaletteSectionProps {
  partials: PartialDto[]
  expandedCategories: Set<string>
  toggleCategory: (id: string) => void
  addBlockRaw: (block: Block, parentId?: string | null, index?: number) => void
  currentPageId?: string
}

function PartialsPaletteSection({
  partials,
  expandedCategories,
  toggleCategory,
  addBlockRaw,
  currentPageId,
}: PartialsPaletteSectionProps) {
  // Filter out the partial being edited (prevent circular reference)
  const available = partials.filter((p) => p.id !== currentPageId)

  const isExpanded = expandedCategories.has("partials")

  const handleDragStart = useCallback((e: React.DragEvent, partial: PartialDto) => {
    e.dataTransfer.setData("application/partial-id", partial.id)
    e.dataTransfer.effectAllowed = "copy"
  }, [])

  const handleInsert = useCallback((partial: PartialDto) => {
    addBlockRaw({
      id: generateId(),
      tag: "div",
      className: "",
      componentName: "PartialReference",
      partialId: partial.id,
    })
  }, [addBlockRaw])

  return (
    <div>
      <button
        onClick={() => toggleCategory("partials")}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight
          size={12}
          className={cn(
            "transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
        <Layers size={12} />
        Partials
        <span className="ml-auto text-[10px] font-normal opacity-60">
          {available.length}
        </span>
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-0.5 px-2 pb-2">
          {available.length === 0 ? (
            <p className="px-2 py-4 text-center text-[10px] text-muted-foreground">
              No published partials.
              <br />
              Create one in Admin → Partials.
            </p>
          ) : (
            available.map((partial) => (
              <div
                key={partial.id}
                draggable
                onDragStart={(e) => handleDragStart(e, partial)}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5",
                  "text-sm text-card-foreground",
                  "transition-all duration-150",
                  "hover:bg-accent",
                  "cursor-grab active:cursor-grabbing",
                  "select-none"
                )}
                title={partial.description || partial.name}
              >
                <div className="flex items-center text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                  <GripVertical size={12} />
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-500/10">
                  <Layers size={14} className="text-cyan-400" />
                </div>

                <div className="flex flex-col items-start flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{partial.name}</span>
                    <span className="px-1 py-0.5 text-[8px] font-medium rounded bg-cyan-500/10 text-cyan-400 uppercase">
                      {partial.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    &lt;PartialRef&gt;
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleInsert(partial)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all"
                  title="Quick add to page"
                >
                  <Plus size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
