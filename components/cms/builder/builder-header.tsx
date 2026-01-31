"use client"

import { Button } from '@/components/cms/ui/button"
import { Monitor, Tablet, Smartphone, Eye, Undo2, Redo2, Layers, ZoomIn, ZoomOut, Play, ArrowLeft } from "lucide-react"
import { Slider } from '@/components/cms/ui/slider"
import { cn } from '@/lib/cms/utils"
import type { PageType } from "./page-builder"

interface BuilderHeaderProps {
  viewport: "desktop" | "tablet" | "mobile"
  setViewport: (viewport: "desktop" | "tablet" | "mobile") => void
  zoom: number
  setZoom: (zoom: number) => void
  showLayers: boolean
  setShowLayers: (show: boolean) => void
  currentPage: PageType
  onOpenSiteSettings: () => void
}

export function BuilderHeader({
  viewport,
  setViewport,
  zoom,
  setZoom,
  showLayers,
  setShowLayers,
  currentPage,
  onOpenSiteSettings,
}: BuilderHeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-sidebar flex items-center justify-between px-4 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={onOpenSiteSettings}
        >
          <ArrowLeft className="h-4 w-4" />
          Site Settings
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-foreground">Builder</span>
        </div>
        <div className="h-6 w-px bg-border mx-2" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Editing:</span>
          <span className="text-sm font-medium text-foreground">{currentPage.name}</span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{currentPage.slug}</span>
        </div>
      </div>

      {/* Center section - Viewport & Zoom */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-secondary rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", viewport === "desktop" && "bg-background text-foreground")}
            onClick={() => setViewport("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", viewport === "tablet" && "bg-background text-foreground")}
            onClick={() => setViewport("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", viewport === "mobile" && "bg-background text-foreground")}
            onClick={() => setViewport("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom(Math.max(50, zoom - 10))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="w-24 flex items-center gap-2">
            <Slider
              value={[zoom]}
              min={50}
              max={150}
              step={10}
              onValueChange={([value]) => setZoom(value)}
              className="w-full"
            />
          </div>
          <span className="text-xs text-muted-foreground w-10">{zoom}%</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom(Math.min(150, zoom + 10))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", showLayers && "bg-secondary")}
          onClick={() => setShowLayers(!showLayers)}
        >
          <Layers className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button variant="ghost" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </Button>
        <Button variant="default" size="sm" className="gap-2">
          <Play className="h-4 w-4" />
          Publish
        </Button>
      </div>
    </header>
  )
}
