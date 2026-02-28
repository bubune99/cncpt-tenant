"use client"

import { useCallback } from "react"
import { cn } from "@/lib/cms/utils"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import type { BlockSpotlight, SpotlightColor } from "@/lib/cms/block-editor/workflow-types"
import { SPOTLIGHT_COLOR_MAP, SPOTLIGHT_COLORS } from "@/lib/cms/block-editor/workflow-types"

/* ------------------------------------------------------------------ */
/*  Spotlight Ring Overlay — rendered around a canvas block             */
/* ------------------------------------------------------------------ */

interface SpotlightRingProps {
  spotlight: BlockSpotlight
  pulse?: boolean
}

export function SpotlightRing({ spotlight, pulse }: SpotlightRingProps) {
  const colors = SPOTLIGHT_COLOR_MAP[spotlight.color]

  return (
    <>
      {/* Colored ring overlay */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 rounded-md ring-2",
          colors.ring,
          colors.bg,
          pulse && "animate-pulse"
        )}
      />

      {/* Annotation tooltip */}
      {spotlight.annotation && (
        <div
          className={cn(
            "absolute -bottom-8 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-medium shadow-lg",
            colors.bg,
            colors.text,
            colors.border,
            "border"
          )}
        >
          {spotlight.annotation}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Spotlight Badge — clickable pill for chat messages                  */
/* ------------------------------------------------------------------ */

interface SpotlightBadgeProps {
  blockId: string
  annotation: string
  color: SpotlightColor
  index: number
  onClick?: (blockId: string) => void
}

export function SpotlightBadge({ blockId, annotation, color, index, onClick }: SpotlightBadgeProps) {
  const colors = SPOTLIGHT_COLOR_MAP[color]

  return (
    <button
      onClick={() => onClick?.(blockId)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all hover:scale-105",
        colors.bg,
        colors.text,
        colors.border,
        "border cursor-pointer"
      )}
      title={`Jump to block: ${blockId}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      <span className="max-w-[120px] truncate">
        {annotation || blockId}
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Hook: useBlockSpotlight                                             */
/* ------------------------------------------------------------------ */

/** Assigns colors round-robin and provides spotlight management */
export function useBlockSpotlight() {
  const editor = useEditor()

  const getSpotlightForBlock = useCallback(
    (blockId: string): BlockSpotlight | undefined => {
      return editor.state.activeSpotlights.find((s) => s.blockId === blockId)
    },
    [editor.state.activeSpotlights]
  )

  const activateSpotlight = useCallback(
    (blockId: string) => {
      editor.scrollToBlock(blockId)
    },
    [editor]
  )

  /** Assign colors to an array of spotlight outputs (round-robin) */
  const assignColors = useCallback(
    (spotlights: Array<{ blockId: string; annotation: string; color?: SpotlightColor }>): BlockSpotlight[] => {
      return spotlights.map((s, idx) => ({
        blockId: s.blockId,
        annotation: s.annotation,
        color: s.color || SPOTLIGHT_COLORS[idx % SPOTLIGHT_COLORS.length],
      }))
    },
    []
  )

  return {
    activeSpotlights: editor.state.activeSpotlights,
    getSpotlightForBlock,
    setSpotlights: editor.setSpotlights,
    clearSpotlights: editor.clearSpotlights,
    activateSpotlight,
    assignColors,
  }
}
