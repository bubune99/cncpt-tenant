"use client"

import { useState, useMemo, useCallback } from "react"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { Input } from "@/components/cms/ui/input"
import { Label } from "@/components/cms/ui/label"
import { Textarea } from "@/components/cms/ui/textarea"
import { Button } from "@/components/cms/ui/button"
import { Separator } from "@/components/cms/ui/separator"
import { Slider } from "@/components/cms/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cms/ui/select"
import {
  Settings2,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Code2,
  Play,
  ImageIcon,
  Palette,
  Square,
  BoxSelect,
  Type,
  Layers,
  Move,
  Sparkles,
  ShoppingCart,
  Database,
  Link2,
  Component,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
} from "lucide-react"
import type { Block, BlockTag, BlockAnimation, BlockBackground, BlockResponsive, CommerceBinding, CommerceProvider } from "@/lib/cms/block-editor/types"
import { usePartials, usePartial } from "@/lib/cms/api/domains/partials/hooks"
import { COMMERCE_PROVIDERS } from "@/lib/cms/block-editor/block-templates"
import { isContainerTag, CONTAINER_TAGS, LEAF_TAGS } from "@/lib/cms/block-editor/types"
import { getSmartBlock, type EditorField } from "@/lib/cms/block-editor/smart-blocks/registry"
import { cn } from "@/lib/cms/utils"
import { Switch } from "@/components/cms/ui/switch"
import { ColorPicker } from "./color-picker"
import { BackgroundModal } from "./background-modal"
import { ImagePickerModal } from "./image-picker-modal"
import { RichTextEditor } from "./rich-text-editor"

/* ------------------------------------------------------------------ */
/*  Tailwind Class Parser / Categorizer                                */
/* ------------------------------------------------------------------ */

type ClassCategory =
  | "layout" | "spacing" | "sizing" | "typography" | "colors"
  | "borders" | "effects" | "position" | "animation" | "other"

const CATEGORY_PATTERNS: Record<ClassCategory, RegExp> = {
  layout: /^(flex|grid|inline|block|hidden|items-|justify-|self-|place-|gap-|order-|col-|row-|flex-|grow|shrink|basis-)/,
  spacing: /^(p[xytblr]?-|m[xytblr]?-|space-)/,
  sizing: /^(w-|h-|min-w-|min-h-|max-w-|max-h-|size-|aspect-)/,
  typography: /^(text-[xsl2-9]|text-(xs|sm|base|lg|xl)|font-|leading-|tracking-|line-|truncate|break-|whitespace-|uppercase|lowercase|capitalize|normal-case|italic|not-italic|underline|overline|line-through|no-underline|decoration-|indent-)/,
  colors: /^(bg-|text-(?!xs|sm|base|lg|xl|[xsl2-9])|from-|via-|to-|accent-|caret-|fill-|stroke-)/,
  borders: /^(border|rounded|ring|outline|divide)/,
  effects: /^(shadow|opacity|blur|brightness|contrast|grayscale|hue|invert|saturate|sepia|backdrop-|mix-blend-)/,
  position: /^(relative|absolute|fixed|sticky|static|top-|right-|bottom-|left-|inset-|z-|overflow-|float-|clear-)/,
  animation: /^(animate-|transition|duration-|ease-|delay-|transform|scale-|rotate-|translate-|skew-|origin-|hover:|focus:|active:|group-)/,
  other: /^/,
}

const CATEGORY_LABELS: Record<ClassCategory, string> = {
  layout: "Layout", spacing: "Spacing", sizing: "Sizing",
  typography: "Typography", colors: "Colors", borders: "Borders",
  effects: "Effects", position: "Position",
  animation: "States & Animation", other: "Other",
}

function categorizeClass(cls: string): ClassCategory {
  const base = cls.replace(/^(sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|group-hover:|dark:)/, "")
  for (const [cat, pattern] of Object.entries(CATEGORY_PATTERNS) as [ClassCategory, RegExp][]) {
    if (pattern.test(base)) return cat
  }
  return "other"
}

function parseClasses(className: string): Map<ClassCategory, string[]> {
  const map = new Map<ClassCategory, string[]>()
  if (!className.trim()) return map
  const classes = className.split(/\s+/).filter(Boolean)
  for (const cls of classes) {
    const cat = categorizeClass(cls)
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(cls)
  }
  return map
}

/* ------------------------------------------------------------------ */
/*  Tailwind Scales                                                     */
/* ------------------------------------------------------------------ */

const SPACING_SCALE = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "8", label: "8" },
  { value: "10", label: "10" },
  { value: "12", label: "12" },
  { value: "16", label: "16" },
  { value: "20", label: "20" },
  { value: "24", label: "24" },
]

const RADIUS_SCALE = [
  { value: "none", label: "None", class: "rounded-none" },
  { value: "sm", label: "Sm", class: "rounded-sm" },
  { value: "md", label: "Md", class: "rounded-md" },
  { value: "lg", label: "Lg", class: "rounded-lg" },
  { value: "xl", label: "XL", class: "rounded-xl" },
  { value: "2xl", label: "2XL", class: "rounded-2xl" },
  { value: "3xl", label: "3XL", class: "rounded-3xl" },
  { value: "full", label: "Full", class: "rounded-full" },
]

const FONT_SIZES = [
  { value: "xs", label: "XS" },
  { value: "sm", label: "SM" },
  { value: "base", label: "Base" },
  { value: "lg", label: "LG" },
  { value: "xl", label: "XL" },
  { value: "2xl", label: "2XL" },
  { value: "3xl", label: "3XL" },
  { value: "4xl", label: "4XL" },
  { value: "5xl", label: "5XL" },
  { value: "6xl", label: "6XL" },
  { value: "7xl", label: "7XL" },
]

const FONT_WEIGHTS = [
  { value: "thin", label: "Thin" },
  { value: "extralight", label: "Extra Light" },
  { value: "light", label: "Light" },
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "semibold", label: "Semibold" },
  { value: "bold", label: "Bold" },
  { value: "extrabold", label: "Extra Bold" },
  { value: "black", label: "Black" },
]

const COLOR_SWATCHES = [
  // Neutrals
  { label: "White", bg: "bg-white", text: "text-gray-900" },
  { label: "Gray 50", bg: "bg-gray-50", text: "text-gray-900" },
  { label: "Gray 100", bg: "bg-gray-100", text: "text-gray-800" },
  { label: "Gray 200", bg: "bg-gray-200", text: "text-gray-800" },
  { label: "Slate 800", bg: "bg-slate-800", text: "text-white" },
  { label: "Slate 900", bg: "bg-slate-900", text: "text-white" },
  { label: "Slate 950", bg: "bg-slate-950", text: "text-white" },
  // Brand Colors
  { label: "Blue", bg: "bg-blue-600", text: "text-white" },
  { label: "Green", bg: "bg-emerald-600", text: "text-white" },
  { label: "Red", bg: "bg-red-600", text: "text-white" },
  { label: "Purple", bg: "bg-purple-600", text: "text-white" },
  { label: "Amber", bg: "bg-amber-500", text: "text-black" },
  { label: "Pink", bg: "bg-pink-600", text: "text-white" },
  { label: "Cyan", bg: "bg-cyan-500", text: "text-black" },
  // Glass / Transparent
  { label: "Glass", bg: "bg-white/5", text: "text-white", extra: "backdrop-blur-sm" },
  { label: "Transparent", bg: "bg-transparent", text: "" },
]

const SHADOW_SCALE = [
  { value: "none", label: "None", class: "" },
  { value: "sm", label: "Sm", class: "shadow-sm" },
  { value: "md", label: "Md", class: "shadow-md" },
  { value: "lg", label: "Lg", class: "shadow-lg" },
  { value: "xl", label: "XL", class: "shadow-xl" },
  { value: "2xl", label: "2XL", class: "shadow-2xl" },
]

const LAYOUT_PRESETS = [
  { label: "Stack", classes: "flex flex-col gap-4" },
  { label: "Row", classes: "flex items-center gap-4" },
  { label: "Center", classes: "flex items-center justify-center" },
  { label: "Between", classes: "flex items-center justify-between" },
  { label: "2 Col", classes: "grid grid-cols-2 gap-6" },
  { label: "3 Col", classes: "grid grid-cols-3 gap-6" },
  { label: "4 Col", classes: "grid grid-cols-4 gap-6" },
]

const WIDTH_PRESETS = [
  { label: "Auto", class: "w-auto" },
  { label: "Full", class: "w-full" },
  { label: "Screen", class: "w-screen" },
  { label: "Max-sm", class: "max-w-sm" },
  { label: "Max-md", class: "max-w-md" },
  { label: "Max-lg", class: "max-w-lg" },
  { label: "Max-xl", class: "max-w-xl" },
  { label: "Max-2xl", class: "max-w-2xl" },
  { label: "Max-4xl", class: "max-w-4xl" },
  { label: "Max-6xl", class: "max-w-6xl" },
]

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function PropertyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lucide-react multi-version type conflict in pnpm
function PropertySection({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon?: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight size={10} className={cn("transition-transform", open && "rotate-90")} />
        {Icon && <Icon size={12} />}
        {title}
      </button>
      {open && <div className="flex flex-col gap-3 pt-2 pb-1">{children}</div>}
    </div>
  )
}

function ClassTagsEditor({
  category, classes, onRemove, onAdd,
}: {
  category: ClassCategory; classes: string[]
  onRemove: (cls: string) => void; onAdd: (cls: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState("")

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {CATEGORY_LABELS[category]}
        </span>
        <button onClick={() => setAdding(true)} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground" title={`Add ${CATEGORY_LABELS[category]} class`}>
          <Plus size={10} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {classes.map((cls) => (
          <span key={cls} className="flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[10px] font-mono text-accent-foreground">
            {cls}
            <button onClick={() => onRemove(cls)} className="text-muted-foreground hover:text-destructive"><X size={8} /></button>
          </span>
        ))}
      </div>
      {adding && (
        <div className="flex items-center gap-1">
          <input
            autoFocus value={value} onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) { onAdd(value.trim()); setValue(""); setAdding(false) }
              if (e.key === "Escape") setAdding(false)
            }}
            placeholder="e.g. p-4"
            className="h-6 flex-1 rounded border border-border bg-input px-2 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground p-0.5"><X size={10} /></button>
        </div>
      )}
    </div>
  )
}

function AttrsEditor({ attrs, onChange }: { attrs: Record<string, string>; onChange: (next: Record<string, string>) => void }) {
  const [newKey, setNewKey] = useState("")
  const entries = Object.entries(attrs)

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className="w-16 shrink-0 text-[10px] font-mono text-muted-foreground truncate" title={key}>{key}</span>
          <Input value={val} onChange={(e) => onChange({ ...attrs, [key]: e.target.value })} className="h-7 flex-1 text-xs font-mono bg-input text-foreground" />
          <button onClick={() => { const next = { ...attrs }; delete next[key]; onChange(next) }} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
            <Trash2 size={10} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-1">
        <input value={newKey} onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && newKey.trim() && !attrs[newKey.trim()]) { onChange({ ...attrs, [newKey.trim()]: "" }); setNewKey("") } }}
          placeholder="Add attribute..."
          className="h-6 flex-1 rounded border border-border bg-input px-2 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button onClick={() => { if (newKey.trim() && !attrs[newKey.trim()]) { onChange({ ...attrs, [newKey.trim()]: "" }); setNewKey("") } }} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
          <Plus size={10} />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Animation Editor                                                   */
/* ------------------------------------------------------------------ */

const ANIM_TYPES = [
  { value: "none", label: "None" },
  { value: "fadeIn", label: "Fade In" },
  { value: "slideUp", label: "Slide Up" },
  { value: "slideDown", label: "Slide Down" },
  { value: "slideLeft", label: "Slide Left" },
  { value: "slideRight", label: "Slide Right" },
  { value: "scale", label: "Scale" },
] as const

const ANIM_TRIGGERS = [
  { value: "onMount", label: "On Mount" },
  { value: "inView", label: "In View" },
  { value: "hover", label: "On Hover" },
] as const

function AnimationEditor({ animation, onChange }: { animation?: BlockAnimation; onChange: (a: BlockAnimation | undefined) => void }) {
  const type = animation?.type ?? "none"
  const trigger = animation?.trigger ?? "onMount"
  const duration = animation?.duration ?? 0.5
  const delay = animation?.delay ?? 0

  return (
    <div className="flex flex-col gap-3">
      <PropertyField label="Effect">
        <Select value={type} onValueChange={(v) => {
          if (v === "none") { onChange(undefined); return }
          onChange({ ...animation, type: v as BlockAnimation["type"], trigger, duration, delay })
        }}>
          <SelectTrigger className="h-8 bg-input text-foreground text-xs"><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            {ANIM_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PropertyField>

      {type !== "none" && (
        <>
          <PropertyField label="Trigger">
            <Select value={trigger} onValueChange={(v) => onChange({ ...animation, type: type as BlockAnimation["type"], trigger: v as BlockAnimation["trigger"], duration, delay })}>
              <SelectTrigger className="h-8 bg-input text-foreground text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANIM_TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </PropertyField>
          <div className="grid grid-cols-2 gap-3">
            <PropertyField label={`Duration (${duration}s)`}>
              <input type="range" min={0.1} max={2} step={0.1} value={duration}
                onChange={(e) => onChange({ ...animation, type: type as BlockAnimation["type"], trigger, duration: parseFloat(e.target.value), delay })}
                className="w-full accent-primary"
              />
            </PropertyField>
            <PropertyField label={`Delay (${delay}s)`}>
              <input type="range" min={0} max={2} step={0.1} value={delay}
                onChange={(e) => onChange({ ...animation, type: type as BlockAnimation["type"], trigger, duration, delay: parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
            </PropertyField>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Background Image Editor                                            */
/* ------------------------------------------------------------------ */

function BackgroundEditor({ background, onChange }: { background?: BlockBackground; onChange: (bg: BlockBackground | undefined) => void }) {
  const hasBackground = !!background?.url

  return (
    <div className="flex flex-col gap-3">
      {/* Preview if background is set */}
      {hasBackground && (
        <div 
          className="h-20 rounded-md border border-border bg-cover bg-center relative overflow-hidden"
          style={{ 
            backgroundImage: `url(${background.url})`,
            backgroundSize: background.size || "cover",
            backgroundPosition: background.position || "center",
          }}
        >
          {background.overlay && (
            <div className="absolute inset-0" style={{ background: background.overlay }} />
          )}
        </div>
      )}

      {/* Open modal button */}
      <BackgroundModal
        background={background}
        onChange={onChange}
        trigger={
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
            <ImageIcon size={14} />
            {hasBackground ? "Edit Background" : "Add Background Image"}
          </Button>
        }
      />

      {/* Quick clear button */}
      {hasBackground && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onChange(undefined)}
          className="w-full text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={12} className="mr-1.5" />
          Remove Background
        </Button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Smart Quick Styles Controls                                        */
/* ------------------------------------------------------------------ */

function ColorSwatchPicker({ onSelect }: { onSelect: (bg: string, text: string, extra?: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1">
      {COLOR_SWATCHES.map((swatch) => (
        <button
          key={swatch.label}
          onClick={() => onSelect(swatch.bg, swatch.text, swatch.extra)}
          className={cn(
            "w-6 h-6 rounded-md border border-border hover:ring-2 hover:ring-primary hover:ring-offset-1 transition-all",
            swatch.bg,
            swatch.bg === "bg-white" && "border-gray-200"
          )}
          title={swatch.label}
        />
      ))}
    </div>
  )
}

function SpacingControl({
  label,
  prefix,
  value,
  onChange,
}: {
  label: string
  prefix: string
  value: number
  onChange: (value: number) => void
}) {
  const displayValue = SPACING_SCALE[value]?.value || "0"
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-mono text-muted-foreground">{prefix}-{displayValue}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        max={SPACING_SCALE.length - 1}
        step={1}
        className="w-full"
      />
    </div>
  )
}

function RadiusControl({
  value,
  onChange,
}: {
  value: string
  onChange: (cls: string) => void
}) {
  return (
    <div className="flex gap-1">
      {RADIUS_SCALE.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.class)}
          className={cn(
            "flex-1 h-8 rounded-md border text-[10px] font-medium transition-colors",
            value === r.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-accent/50 text-muted-foreground hover:bg-accent"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

function ShadowControl({
  value,
  onChange,
}: {
  value: string
  onChange: (cls: string) => void
}) {
  return (
    <div className="flex gap-1">
      {SHADOW_SCALE.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.class)}
          className={cn(
            "flex-1 h-8 rounded-md border text-[10px] font-medium transition-colors",
            value === s.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-accent/50 text-muted-foreground hover:bg-accent"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers: Extract current values from className                     */
/* ------------------------------------------------------------------ */

function extractSpacingValue(className: string, prefix: string): number {
  const classes = className.split(/\s+/)
  for (const cls of classes) {
    if (cls.startsWith(`${prefix}-`)) {
      const val = cls.replace(`${prefix}-`, "")
      const idx = SPACING_SCALE.findIndex((s) => s.value === val)
      if (idx >= 0) return idx
    }
  }
  return 0
}

function extractColorValue(className: string, prefix: string): string | undefined {
  const classes = className.split(/\s+/)
  for (const cls of classes) {
    // Match arbitrary values like bg-[#ff0000] or text-[#123456]
    const match = cls.match(new RegExp(`^${prefix}\\[#([a-fA-F0-9]{3,8})\\]$`))
    if (match) return `#${match[1]}`
  }
  return undefined
}

function extractTailwindColorClass(className: string, prefix: string): string | undefined {
  const classes = className.split(/\s+/)
  for (const cls of classes) {
    // Match bg-* or text-* color classes (arbitrary or named)
    if (cls.startsWith(`${prefix}-`)) {
      // Skip typography text-* classes
      if (prefix === "text" && /^text-(xs|sm|base|lg|xl|[2-7]xl|left|right|center|justify|wrap|nowrap|balance|pretty)$/.test(cls)) {
        continue
      }
      return cls
    }
  }
  return undefined
}

function extractRadiusValue(className: string): string {
  const classes = className.split(/\s+/)
  for (const r of RADIUS_SCALE) {
    if (r.class && classes.includes(r.class)) return r.value
    if (r.value === "none" && !classes.some((cls) => cls.startsWith("rounded"))) return "none"
  }
  return "none"
}

function extractShadowValue(className: string): string {
  const classes = className.split(/\s+/)
  for (const s of SHADOW_SCALE) {
    if (s.class && classes.includes(s.class)) return s.value
  }
  return "none"
}

function extractFontSize(className: string): string {
  const classes = className.split(/\s+/)
  for (const cls of classes) {
    const match = cls.match(/^text-(xs|sm|base|lg|xl|[2-7]xl)$/)
    if (match) return match[1]
  }
  return "base"
}

function extractFontWeight(className: string): string {
  const classes = className.split(/\s+/)
  for (const cls of classes) {
    const match = cls.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/)
    if (match) return match[1]
  }
  return "normal"
}

/* ------------------------------------------------------------------ */
/*  Smart Block Field Renderer                                         */
/* ------------------------------------------------------------------ */

function SmartBlockField({ field, block, onUpdate }: {
  field: EditorField
  block: Block
  onUpdate: (value: unknown) => void
}) {
  // Read current value from the correct target
  const target = field.target || "attrs"
  let currentValue: unknown = field.defaultValue
  if (target === "commerce" && block.commerce) {
    currentValue = (block.commerce as Record<string, unknown>)[field.key] ?? field.defaultValue
  } else if (target === "attrs" && block.attrs) {
    currentValue = block.attrs[field.key] ?? field.defaultValue
  } else if (target === "root") {
    currentValue = (block as Record<string, unknown>)[field.key] ?? field.defaultValue
  }

  switch (field.type) {
    case "text":
      return (
        <PropertyField label={field.label}>
          <Input
            value={String(currentValue ?? "")}
            onChange={(e) => onUpdate(e.target.value)}
            className="h-8 bg-input text-foreground text-xs"
          />
        </PropertyField>
      )
    case "number":
      return (
        <PropertyField label={field.label}>
          <Input
            type="number"
            value={Number(currentValue ?? 0)}
            onChange={(e) => onUpdate(parseInt(e.target.value) || 0)}
            min={field.min}
            max={field.max}
            step={field.step}
            className="h-8 bg-input text-foreground text-xs"
          />
        </PropertyField>
      )
    case "select":
      return (
        <PropertyField label={field.label}>
          <Select value={String(currentValue ?? "")} onValueChange={onUpdate}>
            <SelectTrigger className="h-8 bg-input text-foreground text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)} className="text-xs">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyField>
      )
    case "toggle":
      return (
        <PropertyField label={field.label}>
          <Switch
            checked={Boolean(currentValue)}
            onCheckedChange={onUpdate}
          />
        </PropertyField>
      )
    case "slider":
      return (
        <PropertyField label={field.label}>
          <div className="flex items-center gap-2">
            <Slider
              value={[Number(currentValue ?? field.min ?? 0)]}
              onValueChange={([v]) => onUpdate(v)}
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground w-8 text-right">{String(currentValue ?? 0)}</span>
          </div>
        </PropertyField>
      )
    case "color":
      return (
        <PropertyField label={field.label}>
          <Input
            value={String(currentValue ?? "")}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder="#hex or Tailwind class"
            className="h-8 bg-input text-foreground text-xs font-mono"
          />
        </PropertyField>
      )
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/*  Main Properties Panel                                              */
/* ------------------------------------------------------------------ */

export function PropertiesPanel() {
  const { state, getSelectedBlock, updateBlock, selectBlock, getBlockBreadcrumb } = useEditor()
  const block = getSelectedBlock()
  const [classEditMode, setClassEditMode] = useState(false)

  const categorized = useMemo(
    () => (block ? parseClasses(block.className) : new Map()),
    [block?.className]
  )

  const updateClassName = useCallback(
    (fn: (prev: string) => string) => {
      if (!block) return
      updateBlock(block.id, { className: fn(block.className) })
    },
    [block, updateBlock]
  )

  const removeClass = useCallback(
    (cls: string) => updateClassName((prev) => prev.split(/\s+/).filter((c) => c !== cls).join(" ")),
    [updateClassName]
  )

  const addClass = useCallback(
    (cls: string) => updateClassName((prev) => {
      const existing = prev.split(/\s+/).filter(Boolean)
      if (existing.includes(cls)) return prev
      return [...existing, cls].join(" ")
    }),
    [updateClassName]
  )

  const replaceClassByPattern = useCallback(
    (pattern: RegExp, newClass: string) => {
      updateClassName((prev) => {
        const kept = prev.split(/\s+/).filter((c) => !pattern.test(c))
        if (newClass) kept.push(newClass)
        return kept.join(" ")
      })
    },
    [updateClassName]
  )

  const applyColor = useCallback(
    (bg: string, text: string, extra?: string) => {
      updateClassName((prev) => {
        const kept = prev.split(/\s+/).filter((c) =>
          !c.startsWith("bg-") && !c.startsWith("text-") && c !== "backdrop-blur-sm" && c !== "backdrop-blur-md" && c !== "backdrop-blur-lg"
        )
        const adding = [bg, text, extra].filter(Boolean) as string[]
        return [...kept, ...adding].join(" ")
      })
    },
    [updateClassName]
  )

  const applyLayout = useCallback(
    (classes: string) => {
      updateClassName((prev) => {
        const kept = prev.split(/\s+/).filter((c) =>
          !c.startsWith("flex") && !c.startsWith("grid") && !c.startsWith("inline") &&
          !c.startsWith("items-") && !c.startsWith("justify-") && !c.startsWith("gap-") &&
          !c.startsWith("grid-cols-")
        )
        return [...kept, ...classes.split(/\s+/)].join(" ")
      })
    },
    [updateClassName]
  )

  const applyWidth = useCallback(
    (cls: string) => {
      updateClassName((prev) => {
        const kept = prev.split(/\s+/).filter((c) =>
          !c.startsWith("w-") && !c.startsWith("max-w-")
        )
        return [...kept, cls].join(" ")
      })
    },
    [updateClassName]
  )

  const applySpacing = useCallback(
    (prefix: string, index: number) => {
      const val = SPACING_SCALE[index]?.value || "0"
      replaceClassByPattern(new RegExp(`^${prefix}-\\d+$`), val === "0" ? "" : `${prefix}-${val}`)
    },
    [replaceClassByPattern]
  )

  if (!block) {
    return (
      <aside className="flex w-72 flex-col border-l border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-card-foreground">Properties</h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Select a block to edit its properties</p>
        </div>
      </aside>
    )
  }

  const allTags = [...CONTAINER_TAGS, ...LEAF_TAGS]
  const isLeaf = !block.children
  const isContainer = isContainerTag(block.tag) || !!block.children
  const currentFontSize = extractFontSize(block.className)
  const currentFontWeight = extractFontWeight(block.className)
  const currentRadius = extractRadiusValue(block.className)
  const currentShadow = extractShadowValue(block.className)
  const currentPadding = extractSpacingValue(block.className, "p")

  return (
    <aside className="flex w-72 flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-card-foreground">Properties</h2>
        </div>
        <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-mono text-accent-foreground">
          {"<"}{block.tag}{">"}
        </span>
      </div>

      {/* Breadcrumb */}
      {(() => {
        const breadcrumb = getBlockBreadcrumb(block.id)
        if (breadcrumb.length <= 1) return null
        return (
          <div className="flex items-center gap-1 border-b border-border px-4 py-2 flex-wrap">
            {breadcrumb.map((b, i) => (
              <span key={b.id} className="flex items-center gap-0.5">
                {i > 0 && <ChevronRight size={8} className="text-muted-foreground" />}
                <button
                  onClick={() => selectBlock(b.id)}
                  className={cn("text-[10px] font-mono transition-colors",
                    b.id === block.id ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >{b.tag}</button>
              </span>
            ))}
          </div>
        )
      })()}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-5">
          {/* Element Tag */}
          <PropertySection title="Element" icon={BoxSelect}>
            <PropertyField label="HTML Tag">
              <Select value={block.tag} onValueChange={(v) => updateBlock(block.id, { tag: v as BlockTag })}>
                <SelectTrigger className="h-8 bg-input text-foreground font-mono text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag} className="font-mono text-xs">{"<"}{tag}{">"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropertyField>
          </PropertySection>

          <Separator />

          {/* Device Visibility */}
          <PropertySection
            title="Visibility"
            icon={Eye}
            defaultOpen={!!(block.responsive?.hidden?.desktop || block.responsive?.hidden?.tablet || block.responsive?.hidden?.mobile)}
          >
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] text-muted-foreground">Hide this block on specific devices</span>
              {([
                { key: "desktop" as const, label: "Desktop", description: "Large screens (1024px+)", Icon: Monitor },
                { key: "tablet" as const, label: "Tablet", description: "Medium screens (768-1023px)", Icon: Tablet },
                { key: "mobile" as const, label: "Mobile", description: "Small screens (<768px)", Icon: Smartphone },
              ] as const).map(({ key, label, description, Icon }) => (
                <div key={key} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={cn(
                      "transition-colors",
                      block.responsive?.hidden?.[key] ? "text-destructive" : "text-muted-foreground"
                    )} />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{label}</span>
                      <span className="text-[10px] text-muted-foreground">{description}</span>
                    </div>
                  </div>
                  <Switch
                    checked={!(block.responsive?.hidden?.[key] ?? false)}
                    onCheckedChange={(visible) => {
                      const current = block.responsive ?? {}
                      const currentHidden = current.hidden ?? {}
                      const newHidden = { ...currentHidden, [key]: !visible }
                      // Clean up: remove false values
                      if (!newHidden.desktop) delete newHidden.desktop
                      if (!newHidden.tablet) delete newHidden.tablet
                      if (!newHidden.mobile) delete newHidden.mobile
                      const hasAny = Object.keys(newHidden).length > 0
                      updateBlock(block.id, {
                        responsive: hasAny ? { hidden: newHidden } : undefined,
                      })
                    }}
                  />
                </div>
              ))}
            </div>
          </PropertySection>

          <Separator />

          {/* Text Content (for leaf elements that are not images) */}
          {isLeaf && block.tag !== "img" && (
            <>
              <PropertySection title="Content" icon={Type}>
                <div className="flex flex-col gap-3">
                  {/* Rich text editor for p, span, etc. */}
                  {["p", "span", "figcaption", "blockquote"].includes(block.tag) ? (
                    <RichTextEditor
                      content={block.textContent ?? ""}
                      onChange={(html) => updateBlock(block.id, { textContent: html })}
                      placeholder="Enter text content..."
                      minHeight="100px"
                    />
                  ) : (
                    /* Simple textarea for headings, buttons, etc. */
                    <PropertyField label="Text">
                      <Textarea 
                        value={block.textContent ?? ""} 
                        onChange={(e) => updateBlock(block.id, { textContent: e.target.value })} 
                        className="min-h-[80px] resize-none bg-input text-foreground text-xs" 
                        rows={3} 
                      />
                    </PropertyField>
                  )}
                </div>
              </PropertySection>
              <Separator />
            </>
          )}

          {/* Image Controls (for img tags) */}
          {block.tag === "img" && (
            <>
              <PropertySection title="Image" icon={ImageIcon} defaultOpen={true}>
                <div className="flex flex-col gap-3">
                  {/* Image Preview */}
                  {block.attrs?.src && (
                    <div className="relative h-32 rounded-md border border-border overflow-hidden bg-muted">
                      <img 
                        src={block.attrs.src} 
                        alt={block.attrs?.alt || "Image preview"}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Image Picker Button */}
                  <ImagePickerModal
                    currentUrl={block.attrs?.src || ""}
                    onSelect={(url: string) => updateBlock(block.id, { attrs: { ...block.attrs, src: url } })}
                  />

                  {/* Alt Text */}
                  <PropertyField label="Alt Text">
                    <Input 
                      value={block.attrs?.alt ?? ""} 
                      onChange={(e) => updateBlock(block.id, { attrs: { ...block.attrs, alt: e.target.value } })}
                      placeholder="Describe the image..."
                      className="h-8 bg-input text-foreground text-xs"
                    />
                  </PropertyField>

                  {/* Object Fit */}
                  <PropertyField label="Object Fit">
                    <div className="flex gap-1">
                      {["cover", "contain", "fill", "none"].map((fit) => (
                        <button
                          key={fit}
                          onClick={() => replaceClassByPattern(/^object-(cover|contain|fill|none|scale-down)$/, `object-${fit}`)}
                          className={cn(
                            "flex-1 py-1.5 text-[10px] font-medium rounded-md border transition-colors capitalize",
                            block.className.includes(`object-${fit}`)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-accent/50 text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {fit}
                        </button>
                      ))}
                    </div>
                  </PropertyField>

                  {/* Object Position */}
                  <PropertyField label="Object Position">
                    <Select 
                      value={block.className.match(/object-(center|top|bottom|left|right|left-top|left-bottom|right-top|right-bottom)/)?.[1] || "center"}
                      onValueChange={(v) => replaceClassByPattern(/^object-(center|top|bottom|left|right|left-top|left-bottom|right-top|right-bottom)$/, `object-${v}`)}
                    >
                      <SelectTrigger className="h-8 bg-input text-foreground text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["center", "top", "bottom", "left", "right", "left-top", "left-bottom", "right-top", "right-bottom"].map((pos) => (
                          <SelectItem key={pos} value={pos} className="text-xs capitalize">{pos.replace("-", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PropertyField>
                </div>
              </PropertySection>
              <Separator />
            </>
          )}

          {/* Smart Block Settings (for registered smart blocks) */}
          {block.componentName && getSmartBlock(block.componentName) && (() => {
            const smartDef = getSmartBlock(block.componentName!)!
            return (
              <>
                <PropertySection title="Smart Block Settings" icon={Component} defaultOpen={true}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-violet-500/10">
                      <Component size={14} className="text-violet-400" />
                      <span className="text-xs font-medium text-violet-300">{smartDef.displayName}</span>
                    </div>
                    {smartDef.editorConfig.fields.map((field) => (
                      <SmartBlockField
                        key={field.key}
                        field={field}
                        block={block}
                        onUpdate={(val) => {
                          const target = field.target || "attrs"
                          if (target === "commerce") {
                            updateBlock(block.id, {
                              commerce: { ...block.commerce!, [field.key]: val }
                            })
                          } else if (target === "attrs") {
                            updateBlock(block.id, {
                              attrs: { ...block.attrs, [field.key]: String(val) }
                            })
                          } else {
                            updateBlock(block.id, { [field.key]: val } as Partial<Block>)
                          }
                        }}
                      />
                    ))}
                  </div>
                </PropertySection>
                <Separator />
              </>
            )
          })()}

          {/* Partial Reference Settings */}
          {block.componentName === "PartialReference" && block.partialId && (
            <>
              <PartialReferenceSection block={block} updateBlock={updateBlock} />
              <Separator />
            </>
          )}

          {/* Commerce / CMS Binding (for commerce blocks) */}
          {block.commerce && (
            <>
              <PropertySection title="Commerce Settings" icon={ShoppingCart} defaultOpen={true}>
                <div className="flex flex-col gap-3">
                  {/* Provider display */}
                  <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                    <span className="text-[10px] font-medium text-muted-foreground">Provider:</span>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-medium rounded",
                      block.commerce.provider === "shopify" && "bg-green-500/10 text-green-400",
                      block.commerce.provider === "stripe" && "bg-purple-500/10 text-purple-400",
                      block.commerce.provider === "paypal" && "bg-blue-500/10 text-blue-400",
                      (!block.commerce.provider || block.commerce.provider === "generic") && "bg-gray-500/10 text-gray-400"
                    )}>
                      {block.commerce.provider ? COMMERCE_PROVIDERS[block.commerce.provider]?.label : "Generic"}
                    </span>
                  </div>

                  {/* CMS Collection Binding */}
                  <PropertyField label="CMS Collection">
                    <Input
                      value={block.commerce.cmsBinding?.collection ?? ""}
                      onChange={(e) => updateBlock(block.id, {
                        commerce: {
                          ...block.commerce!,
                          cmsBinding: { ...block.commerce?.cmsBinding, collection: e.target.value }
                        }
                      })}
                      placeholder="e.g., products, pricing_plans"
                      className="h-8 bg-input text-foreground text-xs font-mono"
                    />
                  </PropertyField>

                  {/* CMS Field Binding */}
                  <PropertyField label="CMS Field">
                    <Input
                      value={block.commerce.cmsBinding?.field ?? ""}
                      onChange={(e) => updateBlock(block.id, {
                        commerce: {
                          ...block.commerce!,
                          cmsBinding: { ...block.commerce?.cmsBinding, field: e.target.value }
                        }
                      })}
                      placeholder="e.g., price, title, image"
                      className="h-8 bg-input text-foreground text-xs font-mono"
                    />
                  </PropertyField>

                  {/* Handle / ID */}
                  {(block.commerce.type === "product" || block.commerce.type === "collection") && (
                    <PropertyField label="Handle / ID">
                      <Input
                        value={block.commerce.handle ?? ""}
                        onChange={(e) => updateBlock(block.id, {
                          commerce: { ...block.commerce!, handle: e.target.value }
                        })}
                        placeholder="product-handle or {{variable}}"
                        className="h-8 bg-input text-foreground text-xs font-mono"
                      />
                    </PropertyField>
                  )}

                  {/* Limit for grids */}
                  {block.commerce.type === "collection" && (
                    <PropertyField label="Items Limit">
                      <Input
                        type="number"
                        value={block.commerce.limit ?? 8}
                        onChange={(e) => updateBlock(block.id, {
                          commerce: { ...block.commerce!, limit: parseInt(e.target.value) || 8 }
                        })}
                        min={1}
                        max={50}
                        className="h-8 bg-input text-foreground text-xs"
                      />
                    </PropertyField>
                  )}

                  {/* Stripe-specific: Price ID */}
                  {block.commerce.provider === "stripe" && (
                    <PropertyField label="Stripe Price ID">
                      <Input
                        value={block.commerce.stripePriceId ?? ""}
                        onChange={(e) => updateBlock(block.id, {
                          commerce: { ...block.commerce!, stripePriceId: e.target.value }
                        })}
                        placeholder="price_xxxxx"
                        className="h-8 bg-input text-foreground text-xs font-mono"
                      />
                    </PropertyField>
                  )}

                  {/* CMS Filter */}
                  <PropertyField label="Filter (optional)">
                    <Input
                      value={block.commerce.cmsBinding?.filter ?? ""}
                      onChange={(e) => updateBlock(block.id, {
                        commerce: {
                          ...block.commerce!,
                          cmsBinding: { ...block.commerce?.cmsBinding, filter: e.target.value }
                        }
                      })}
                      placeholder="featured=true"
                      className="h-8 bg-input text-foreground text-xs font-mono"
                    />
                  </PropertyField>
                </div>
              </PropertySection>
              <Separator />
            </>
          )}

          {/* Background Image (containers only) */}
          {isContainer && (
            <>
              <PropertySection title="Background Image" icon={ImageIcon} defaultOpen={!!block.background?.url}>
                <BackgroundEditor
                  background={block.background}
                  onChange={(bg) => updateBlock(block.id, { background: bg })}
                />
              </PropertySection>
              <Separator />
            </>
          )}

          {/* Quick Styles - Smarter Controls */}
          <PropertySection title="Quick Styles" icon={Sparkles} defaultOpen={true}>
            <div className="flex flex-col gap-4">
              {/* Colors */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <Palette size={10} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Colors</span>
                </div>
                <ColorSwatchPicker onSelect={applyColor} />
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <ColorPicker
                    label="Background"
                    value={extractTailwindColorClass(block.className, "bg") || ""}
                    onChange={(twClass) => {
                      if (twClass) {
                        replaceClassByPattern(/^bg-(?:\[[^\]]+\]|[a-z]+-\d{2,3}|white|black|transparent)$/, twClass)
                      }
                    }}
                    prefix="bg"
                  />
                  <ColorPicker
                    label="Text"
                    value={extractTailwindColorClass(block.className, "text") || ""}
                    onChange={(twClass) => {
                      if (twClass) {
                        replaceClassByPattern(/^text-(?:\[[^\]]+\]|[a-z]+-\d{2,3}|white|black|transparent)$/, twClass)
                      }
                    }}
                    prefix="text"
                  />
                </div>
              </div>

              {/* Typography */}
              {isLeaf && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Type size={10} className="text-muted-foreground" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Typography</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={currentFontSize} onValueChange={(v) => replaceClassByPattern(/^text-(xs|sm|base|lg|xl|[2-7]xl)$/, `text-${v}`)}>
                      <SelectTrigger className="h-7 bg-input text-foreground text-xs"><SelectValue placeholder="Size" /></SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map((s) => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={currentFontWeight} onValueChange={(v) => replaceClassByPattern(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/, `font-${v}`)}>
                      <SelectTrigger className="h-7 bg-input text-foreground text-xs"><SelectValue placeholder="Weight" /></SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHTS.map((w) => <SelectItem key={w.value} value={w.value} className="text-xs">{w.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Spacing (slider) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Move size={10} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Spacing</span>
                </div>
                <SpacingControl label="Padding" prefix="p" value={currentPadding} onChange={(v) => applySpacing("p", v)} />
              </div>

              {/* Layout (containers only) */}
              {isContainer && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Layers size={10} className="text-muted-foreground" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Layout</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {LAYOUT_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyLayout(preset.classes)}
                        className="rounded-md border border-border bg-accent/50 px-2 py-1 text-[10px] font-medium text-accent-foreground hover:bg-accent transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Width */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Width</span>
                <div className="flex flex-wrap gap-1">
                  {WIDTH_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => applyWidth(preset.class)}
                      className="rounded-md border border-border bg-accent/50 px-2 py-1 text-[10px] font-medium text-accent-foreground hover:bg-accent transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corners (visual) */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Corners</span>
                <RadiusControl value={currentRadius} onChange={(cls) => replaceClassByPattern(/^rounded(-\w+)?$/, cls)} />
              </div>

              {/* Shadow */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shadow</span>
                <ShadowControl value={currentShadow} onChange={(cls) => replaceClassByPattern(/^shadow(-\w+)?$/, cls)} />
              </div>
            </div>
          </PropertySection>

          <Separator />

          {/* Attributes */}
          <PropertySection title="Attributes" icon={Code2} defaultOpen={!!(block.attrs && Object.keys(block.attrs).length > 0)}>
            <AttrsEditor attrs={block.attrs ?? {}} onChange={(next) => updateBlock(block.id, { attrs: next })} />
          </PropertySection>

          <Separator />

          {/* Animation */}
          <PropertySection title="Animation" icon={Play} defaultOpen={!!block.animation?.type}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-muted-foreground">Exports as framer-motion code</span>
            </div>
            <AnimationEditor
              animation={block.animation}
              onChange={(anim) => updateBlock(block.id, { animation: anim })}
            />
          </PropertySection>

          <Separator />

          {/* Tailwind Classes (Raw Editor) */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Classes</span>
            <button
              onClick={() => setClassEditMode(!classEditMode)}
              className={cn("flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                classEditMode ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"
              )}
            >
              <Code2 size={10} /> {classEditMode ? "Visual" : "Raw"}
            </button>
          </div>

          {classEditMode ? (
            <Textarea value={block.className} onChange={(e) => updateBlock(block.id, { className: e.target.value })} className="min-h-[120px] resize-none bg-input text-foreground font-mono text-xs leading-relaxed" rows={6} placeholder="Enter Tailwind classes..." />
          ) : (
            <div className="flex flex-col gap-4">
              {(["layout","spacing","sizing","typography","colors","borders","effects","position","animation","other"] as ClassCategory[]).map((cat) => {
                const classes = categorized.get(cat)
                if (!classes || classes.length === 0) return null
                return <ClassTagsEditor key={cat} category={cat} classes={classes} onRemove={removeClass} onAdd={addClass} />
              })}

              <div className="flex flex-col gap-1 pt-2 border-t border-border">
                <span className="text-[10px] text-muted-foreground mb-1">Quick add class</span>
                <input
                  placeholder="e.g. hover:scale-105 z-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val) { val.split(/\s+/).forEach(addClass); (e.target as HTMLInputElement).value = "" }
                    }
                  }}
                  className="h-7 w-full rounded border border-border bg-input px-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

/* ---- Partial Reference Section ---- */

function PartialReferenceSection({ block, updateBlock }: { block: Block; updateBlock: (id: string, updates: Partial<Block>) => void }) {
  const { data: partials } = usePartials({ status: "PUBLISHED" as any })
  const { data: currentPartial } = usePartial(block.partialId ?? null)

  const overrides = block.partialOverrides ?? {}
  const overrideCount = Object.keys(overrides).length

  return (
    <PropertySection title="Partial Reference" icon={Layers} defaultOpen={true}>
      <div className="flex flex-col gap-3">
        {/* Current partial info */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-cyan-500/10">
          <Layers size={14} className="text-cyan-400" />
          <span className="text-xs font-medium text-cyan-300">
            {currentPartial?.name ?? "Loading..."}
          </span>
          {currentPartial?.category && (
            <span className="px-1.5 py-0.5 text-[8px] font-medium rounded bg-cyan-500/20 text-cyan-400 uppercase">
              {currentPartial.category}
            </span>
          )}
        </div>

        {/* Partial selector */}
        <PropertyField label="Partial">
          <Select
            value={block.partialId ?? ""}
            onValueChange={(v) => updateBlock(block.id, { partialId: v, partialOverrides: {} })}
          >
            <SelectTrigger className="h-8 bg-input text-foreground text-xs">
              <SelectValue placeholder="Select a partial" />
            </SelectTrigger>
            <SelectContent>
              {(partials ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name} ({p.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyField>

        {/* Edit partial link */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => window.open(`/admin/partials/${block.partialId}/editor`, "_blank")}
        >
          <ExternalLink size={12} />
          Edit Partial
        </Button>

        {/* Overrides summary */}
        {overrideCount > 0 && (
          <div className="flex items-center justify-between p-2 rounded-md bg-accent/50">
            <span className="text-[10px] text-muted-foreground">
              {overrideCount} override{overrideCount !== 1 ? "s" : ""} active
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px] text-destructive hover:text-destructive"
              onClick={() => updateBlock(block.id, { partialOverrides: {} })}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Per-block overrides editor */}
        {currentPartial?.content && (
          <PartialOverridesEditor
            content={currentPartial.content}
            overrides={overrides}
            onChange={(newOverrides) => updateBlock(block.id, { partialOverrides: newOverrides })}
          />
        )}
      </div>
    </PropertySection>
  )
}

/* ---- Partial Overrides Editor ---- */

function PartialOverridesEditor({
  content,
  overrides,
  onChange,
}: {
  content: unknown
  overrides: Record<string, Partial<Pick<Block, 'textContent' | 'className' | 'attrs'>>>
  onChange: (overrides: Record<string, Partial<Pick<Block, 'textContent' | 'className' | 'attrs'>>>) => void
}) {
  // Parse the partial's blocks and collect leaf nodes with overridable fields
  const leafNodes = useMemo(() => {
    const doc = content as Record<string, unknown>
    const blocks: Block[] = (doc?.version === '2.0' && Array.isArray(doc.blocks))
      ? doc.blocks as Block[]
      : Array.isArray(content) ? content as Block[] : []

    const leaves: Block[] = []
    const walk = (items: Block[]) => {
      for (const b of items) {
        if (b.textContent || (b.attrs && Object.keys(b.attrs).length > 0)) {
          leaves.push(b)
        }
        if (b.children) walk(b.children)
      }
    }
    walk(blocks)
    return leaves
  }, [content])

  if (leafNodes.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mt-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Overridable Content
      </span>
      {leafNodes.map((node) => {
        const override = overrides[node.id] ?? {}
        const nodeLabel = node.label || node.textContent?.slice(0, 20) || node.tag
        return (
          <div key={node.id} className="flex flex-col gap-1 p-2 rounded border border-border/50 bg-accent/30">
            <span className="text-[10px] font-mono text-muted-foreground truncate" title={node.id}>
              {nodeLabel}
            </span>
            {node.textContent !== undefined && (
              <Input
                value={override.textContent ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  const newOverrides = { ...overrides }
                  if (val) {
                    newOverrides[node.id] = { ...override, textContent: val }
                  } else {
                    const { textContent: _, ...rest } = override
                    if (Object.keys(rest).length > 0) {
                      newOverrides[node.id] = rest
                    } else {
                      delete newOverrides[node.id]
                    }
                  }
                  onChange(newOverrides)
                }}
                placeholder={node.textContent?.slice(0, 40) || "Text override..."}
                className="h-7 bg-input text-foreground text-xs"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
