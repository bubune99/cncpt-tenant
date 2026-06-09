"use client"

/**
 * Interaction Preview Wrapper
 *
 * Wraps blocks that have `block.interaction` data with the actual
 * overlay component (Sheet, Dialog, Popover, etc.) for preview mode.
 *
 * In editor mode, blocks render normally with an orange badge.
 * In preview mode, this wrapper adds the overlay behavior:
 *   - The block itself becomes the trigger (clickable/hoverable)
 *   - The overlay content (block.interaction.content) renders inside
 *     the appropriate shadcn overlay component
 *
 * Based on Puck editor's pattern: edit content in properties panel,
 * test interactivity in preview mode.
 */

import { useState, type ReactNode } from "react"
import type { Block, BlockInteraction } from "@/lib/cms/block-editor/types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/cms/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/cms/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/cms/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/cms/ui/tooltip"

interface InteractionPreviewProps {
  interaction: BlockInteraction
  trigger: ReactNode
  renderBlocks: (blocks: Block[]) => ReactNode
}

/**
 * Wraps a trigger element with the appropriate overlay component.
 * Only used in preview mode — editor canvas renders triggers without overlays.
 */
export function InteractionPreview({
  interaction,
  trigger,
  renderBlocks,
}: InteractionPreviewProps) {
  const { type, content, config } = interaction
  const overlayContent = content.length > 0 ? renderBlocks(content) : null

  switch (type) {
    case "sheet":
      return (
        <Sheet>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent side={(config?.side as "left" | "right" | "top" | "bottom") || "right"}>
            {(config?.title || config?.description) && (
              <SheetHeader>
                {config?.title && <SheetTitle>{config.title}</SheetTitle>}
                {config?.description && <SheetDescription>{config.description}</SheetDescription>}
              </SheetHeader>
            )}
            <div className="mt-4">{overlayContent}</div>
          </SheetContent>
        </Sheet>
      )

    case "dialog":
    case "alert-dialog":
      return (
        <Dialog>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent>
            {(config?.title || config?.description) && (
              <DialogHeader>
                {config?.title && <DialogTitle>{config.title}</DialogTitle>}
                {config?.description && <DialogDescription>{config.description}</DialogDescription>}
              </DialogHeader>
            )}
            {overlayContent}
          </DialogContent>
        </Dialog>
      )

    case "popover":
    case "dropdown":
      return (
        <Popover>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent align={(config?.align as "start" | "center" | "end") || "center"}>
            {overlayContent}
          </PopoverContent>
        </Popover>
      )

    case "tooltip":
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent>{overlayContent}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

    case "collapsible": {
      // For collapsible, use a simple expand/collapse pattern
      const [open, setOpen] = useState(false)
      return (
        <div>
          <div onClick={() => setOpen(!open)} role="button" tabIndex={0} style={{ cursor: "pointer" }}>
            {trigger}
          </div>
          {open && (
            <div className="animate-in slide-in-from-top-1 duration-200">
              {overlayContent}
            </div>
          )}
        </div>
      )
    }

    default:
      // Fallback: just render the trigger
      return <>{trigger}</>
  }
}
