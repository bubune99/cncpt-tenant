"use client";

import { Button } from "@/components/ui/button";
import {
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Save,
  ArrowLeft,
  MoreHorizontal,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { usePuck } from "@measured/puck";
import type { Viewport, BuilderPage } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BuilderHeaderProps {
  viewport: Viewport;
  setViewport: (viewport: Viewport) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  page?: BuilderPage;
  onBack?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
  headerActions?: React.ReactNode;
}

export function BuilderHeader({
  viewport,
  setViewport,
  zoom,
  setZoom,
  page,
  onBack,
  onPreview,
  onPublish,
  headerActions,
}: BuilderHeaderProps) {
  const { appState, dispatch, history } = usePuck();

  const canUndo = history.hasPast;
  const canRedo = history.hasFuture;

  const handleUndo = () => {
    if (canUndo) {
      history.back();
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      history.forward();
    }
  };

  return (
    <header className="h-14 border-b border-border bg-sidebar flex items-center justify-between px-4 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {onBack && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
          </>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-foreground">Page Builder</span>
        </div>
        {page && (
          <>
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Editing:</span>
              <span className="text-sm font-medium text-foreground">{page.name}</span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                {page.slug}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Center section - Viewport & Zoom */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-secondary rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              viewport === "desktop" && "bg-background text-foreground"
            )}
            onClick={() => setViewport("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              viewport === "tablet" && "bg-background text-foreground"
            )}
            onClick={() => setViewport("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              viewport === "mobile" && "bg-background text-foreground"
            )}
            onClick={() => setViewport("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setZoom(Math.min(150, zoom + 10))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-6 w-px bg-border mx-1" />

        {headerActions}

        {onPreview && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={onPreview}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        )}
        {onPublish && (
          <Button variant="default" size="sm" className="gap-2" onClick={onPublish}>
            <Save className="h-4 w-4" />
            Publish
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Export JSON</DropdownMenuItem>
            <DropdownMenuItem>Import JSON</DropdownMenuItem>
            <DropdownMenuItem>Reset to default</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
