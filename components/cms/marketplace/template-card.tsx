"use client"

import { Card, CardContent, CardFooter } from "@/components/cms/ui/card"
import { Badge } from "@/components/cms/ui/badge"
import { Button } from "@/components/cms/ui/button"
import { Eye, Plus, Globe, Puzzle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/cms/utils"
import type { MarketplaceTemplate } from "./types"

interface TemplateCardProps {
  template: MarketplaceTemplate
  onPreview: (template: MarketplaceTemplate) => void
  onUse: (template: MarketplaceTemplate) => void
}

/**
 * Source badge color mapping.
 * Maps source names to tailwind color classes.
 */
const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  HyperUI: { bg: "bg-blue-500/10", text: "text-blue-500" },
  Tailblocks: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  Flowbite: { bg: "bg-cyan-500/10", text: "text-cyan-500" },
  DaisyUI: { bg: "bg-violet-500/10", text: "text-violet-500" },
  Community: { bg: "bg-amber-500/10", text: "text-amber-500" },
  Official: { bg: "bg-primary/10", text: "text-primary" },
}

function getSourceColors(source: string) {
  return SOURCE_COLORS[source] || { bg: "bg-muted", text: "text-muted-foreground" }
}

/**
 * Gradient placeholder for templates without thumbnails.
 * Generates a deterministic gradient based on the template name.
 */
function PlaceholderThumbnail({ name, type }: { name: string; type: string }) {
  // Simple hash to pick gradient
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const gradients = [
    "from-blue-600/20 via-purple-600/20 to-pink-600/20",
    "from-emerald-600/20 via-teal-600/20 to-cyan-600/20",
    "from-orange-600/20 via-red-600/20 to-pink-600/20",
    "from-violet-600/20 via-indigo-600/20 to-blue-600/20",
    "from-amber-600/20 via-yellow-600/20 to-lime-600/20",
    "from-rose-600/20 via-pink-600/20 to-fuchsia-600/20",
  ]
  const gradient = gradients[hash % gradients.length]

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br",
        gradient
      )}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        {type === "site" ? (
          <Globe size={24} className="opacity-40" />
        ) : (
          <Puzzle size={24} className="opacity-40" />
        )}
        <span className="text-[10px] font-medium uppercase tracking-widest opacity-50">
          {type === "site" ? "Full Site" : "Component"}
        </span>
      </div>
    </div>
  )
}

export function TemplateCard({ template, onPreview, onUse }: TemplateCardProps) {
  const sourceColors = getSourceColors(template.source)

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30">
      {/* Thumbnail / Preview area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted border-b border-border">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={`Preview of ${template.name}`}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <PlaceholderThumbnail name={template.name} type={template.type} />
        )}

        {/* Hover overlay with preview button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onPreview(template)}
            className="gap-1.5 shadow-lg"
          >
            <Eye size={14} />
            Preview
          </Button>
        </div>

        {/* Type badge in top-left */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className="text-[10px] gap-1 bg-background/80 backdrop-blur-sm border-0"
          >
            {template.type === "site" ? (
              <Globe size={10} />
            ) : (
              <Puzzle size={10} />
            )}
            {template.type === "site" ? "Site" : "Component"}
          </Badge>
        </div>
      </div>

      {/* Card body */}
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        {/* Template name */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
          {template.name}
        </h3>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2">
          {/* Category badge */}
          <Badge variant="outline" className="text-[10px] capitalize">
            {template.category}
          </Badge>

          {/* Source badge */}
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
              sourceColors.bg,
              sourceColors.text
            )}
          >
            {template.source}
          </span>
        </div>
      </CardContent>

      {/* Card footer */}
      <CardFooter className="flex items-center justify-between border-t border-border px-4 py-3">
        {/* Usage count */}
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <TrendingUp size={12} />
          Used {template.usageCount.toLocaleString()} time{template.usageCount !== 1 ? "s" : ""}
        </span>

        {/* Use button */}
        <Button
          size="sm"
          onClick={() => onUse(template)}
          className="gap-1.5 h-7 text-xs"
        >
          <Plus size={12} />
          Use
        </Button>
      </CardFooter>
    </Card>
  )
}
