"use client"

import { useCallback, useRef, useState } from "react"
import type { Block } from "@/lib/cms/block-editor/types"
import { isContainerTag, isInteractiveAnimation } from "@/lib/cms/block-editor/types"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { BlockRenderer } from "./block-renderer"
import { generateId } from "@/lib/cms/block-editor/tree-utils"
import { BlockContextMenu } from "./block-context-menu"
import { SpotlightRing, useBlockSpotlight } from "./block-spotlight"
import { getSmartBlock } from "@/lib/cms/block-editor/smart-blocks/registry"
import { usePartial } from "@/lib/cms/api/domains/partials/hooks"
import {
  GripVertical,
  Copy,
  Trash2,
  ChevronRight,
  Play,
  Plus,
  Move,
  Component,
  Layers,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  MousePointerClick,
} from "lucide-react"
import { cn } from "@/lib/cms/utils"
import { toast } from "sonner"

const MAX_NESTING_DEPTH = 15

/**
 * Neutralize classes that break out of the canvas container.
 * `fixed` positioning escapes the editor layout, so convert to `absolute`.
 * Also cap z-index to prevent blocks from covering editor UI.
 */
function sanitizeClassForCanvas(className: string | undefined): string {
  if (!className) return ""
  return className
    .replace(/\bfixed\b/g, "absolute")
    .replace(/\bz-\[?\d{3,}\]?/g, "z-10") // cap huge z-indexes
    .replace(/\bz-50\b/g, "z-10")
}

// Tags that support inline text editing
const EDITABLE_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "button", "label", "figcaption"]

interface CanvasBlockProps {
  block: Block
  index: number
  parentId: string | null
  depth?: number
  /** Parent's layout direction for horizontal DnD */
  parentIsHorizontal?: boolean
}

/**
 * Detect if a className indicates horizontal layout (flex-row, grid with cols)
 */
function isHorizontalLayout(className: string): boolean {
  if (!className) return false
  const classes = className.split(/\s+/)

  // Check for flex without flex-col (default flex is row)
  const hasFlex = classes.some(c => c === "flex" || c === "inline-flex")
  const hasFlexCol = classes.some(c => c === "flex-col" || c === "flex-column")
  const hasFlexRow = classes.some(c => c === "flex-row")

  if (hasFlex && (hasFlexRow || !hasFlexCol)) return true

  // Check for grid with multiple columns
  const hasGridCols = classes.some(c => /^grid-cols-[2-9]|^grid-cols-1[0-2]/.test(c))
  if (hasGridCols) return true

  return false
}

export function CanvasBlock({ block, index, parentId, depth = 0, parentIsHorizontal = false }: CanvasBlockProps) {
  const {
    state,
    selectBlock,
    setHoveredBlock,
    removeBlock,
    duplicateBlock,
    moveBlock,
    addBlockFromTemplate,
    addBlockRaw,
    setDragState,
    updateBlock,
  } = useEditor()

  const blockRef = useRef<HTMLDivElement>(null)
  const editableRef = useRef<HTMLDivElement>(null)
  const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState("")

  // AI spotlight state (Kofi)
  const { getSpotlightForBlock } = useBlockSpotlight()
  const spotlight = getSpotlightForBlock(block.id)

  const isSelected = state.selectedBlockId === block.id
  const isHovered = state.hoveredBlockId === block.id
  const isContainer = isContainerTag(block.tag) || !!block.children
  const isEditable = EDITABLE_TAGS.includes(block.tag) && !isContainer
  const isHidden = block.hidden === true
  const isLocked = block.locked === true
  const hasResponsiveHidden = !!(block.responsive?.hidden?.desktop || block.responsive?.hidden?.tablet || block.responsive?.hidden?.mobile)

  // Determine if THIS block's children should use horizontal drop zones
  const thisBlockIsHorizontal = isHorizontalLayout(block.className)

  // Inline editing handlers
  const startEditing = useCallback(() => {
    if (!isEditable) return
    setEditText(block.textContent || "")
    setIsEditing(true)
    // Focus the contentEditable after render
    setTimeout(() => {
      editableRef.current?.focus()
      // Select all text
      const range = document.createRange()
      range.selectNodeContents(editableRef.current!)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }, 0)
  }, [isEditable, block.textContent])

  const saveEdit = useCallback(() => {
    if (!isEditing) return
    updateBlock(block.id, { textContent: editText })
    setIsEditing(false)
  }, [isEditing, block.id, editText, updateBlock])

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditText(block.textContent || "")
  }, [block.textContent])

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEdit()
    }
  }, [saveEdit, cancelEdit])

  // ---- DRAG SOURCE ----
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation()
      setIsDragging(true)
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", block.id)
      e.dataTransfer.setData("application/block-id", block.id)
      setDragState({
        blockId: block.id,
        sourceParentId: parentId,
        targetParentId: null,
        targetIndex: -1,
        isPaletteItem: false,
      })
    },
    [block.id, parentId, setDragState]
  )

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation()
      setIsDragging(false)
      setDropPosition(null)
      setDragState(null)
    },
    [setDragState]
  )

  // ---- DROP TARGET ----
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const rect = blockRef.current?.getBoundingClientRect()
      if (!rect) return

      // Use X-axis for horizontal layouts, Y-axis for vertical
      if (parentIsHorizontal) {
        // Horizontal layout: use X position
        const x = e.clientX - rect.left
        const width = rect.width
        const threshold = width * 0.25

        if (isContainer && x > threshold && x < width - threshold) {
          setDropPosition("inside")
          e.dataTransfer.dropEffect = "move"
          return
        }

        if (x < width / 2) {
          setDropPosition("before")
        } else {
          setDropPosition("after")
        }
      } else {
        // Vertical layout: use Y position
        const y = e.clientY - rect.top
        const height = rect.height
        const threshold = height * 0.25

        if (isContainer && y > threshold && y < height - threshold) {
          setDropPosition("inside")
          e.dataTransfer.dropEffect = "move"
          return
        }

        if (y < height / 2) {
          setDropPosition("before")
        } else {
          setDropPosition("after")
        }
      }
      e.dataTransfer.dropEffect = "move"
    },
    [isContainer, parentIsHorizontal]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (blockRef.current && relatedTarget && blockRef.current.contains(relatedTarget)) {
      return
    }
    setDropPosition(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDropPosition(null)

      const draggedBlockId = e.dataTransfer.getData("application/block-id")
      const paletteLabel = e.dataTransfer.getData("application/palette-label")
      const partialIdDrop = e.dataTransfer.getData("application/partial-id")

      if (draggedBlockId === block.id) return

      const insertPartialRef = (targetParent: string | null, targetIndex?: number) => {
        addBlockRaw({
          id: generateId(),
          tag: "div",
          className: "",
          componentName: "PartialReference",
          partialId: partialIdDrop,
        }, targetParent, targetIndex)
      }

      if (dropPosition === "inside" && isContainer) {
        if (depth >= MAX_NESTING_DEPTH) {
          toast.warning("Maximum nesting depth reached (15 levels)")
          return
        }
        if (draggedBlockId) {
          moveBlock(draggedBlockId, block.id, block.children?.length || 0)
        } else if (partialIdDrop) {
          insertPartialRef(block.id, block.children?.length || 0)
        } else if (paletteLabel) {
          addBlockFromTemplate(paletteLabel, block.id)
        }
      } else if (dropPosition === "before") {
        if (draggedBlockId) {
          moveBlock(draggedBlockId, parentId, index)
        } else if (partialIdDrop) {
          insertPartialRef(parentId, index)
        } else if (paletteLabel) {
          addBlockFromTemplate(paletteLabel, parentId, index)
        }
      } else if (dropPosition === "after") {
        if (draggedBlockId) {
          moveBlock(draggedBlockId, parentId, index + 1)
        } else if (partialIdDrop) {
          insertPartialRef(parentId, index + 1)
        } else if (paletteLabel) {
          addBlockFromTemplate(paletteLabel, parentId, index + 1)
        }
      }
    },
    [block.id, block.children, dropPosition, isContainer, parentId, index, moveBlock, addBlockFromTemplate, addBlockRaw]
  )

  // ---- CHILDREN RENDERING (recursive) ----
  const renderChildren = useCallback(
    (children: Block[]) => {
      return children.map((child, i) => (
        <CanvasBlock
          key={child.id}
          block={child}
          index={i}
          parentId={block.id}
          depth={depth + 1}
          parentIsHorizontal={thisBlockIsHorizontal}
        />
      ))
    },
    [block.id, depth, thisBlockIsHorizontal]
  )

  const tagLabel = block.tag

  // Determine if the block should be draggable (when selected or hovered)
  const canDrag = (isSelected || isHovered) && !isEditing && !isLocked

  return (
    <BlockContextMenu block={block} parentId={parentId} index={index}>
      <div className={cn("relative", parentIsHorizontal && "inline-block")} data-block-id={block.id}>
        {/* Drop indicator BEFORE */}
        {dropPosition === "before" && (
          <div className={cn(
            "absolute z-20 flex items-center justify-center transition-all",
            parentIsHorizontal
              ? "w-6 h-6 -left-3 top-1/2 -translate-y-1/2"
              : "w-6 h-6 left-1/2 -translate-x-1/2 -top-3"
          )}>
            <div className="w-5 h-5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center">
              <Plus size={10} className="text-primary/70" />
            </div>
          </div>
        )}

        <div
          ref={blockRef}
          draggable={canDrag}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={cn(
            "group relative rounded-md transition-all duration-150",
            isDragging && "opacity-40 scale-[0.98]",
            isSelected && "ring-2 ring-primary shadow-sm",
            isHovered && !isSelected && "ring-1 ring-primary/40",
            dropPosition === "inside" && "ring-2 ring-primary ring-dashed bg-primary/5",
            isEditable && !isEditing && "cursor-text",
            isHidden && "opacity-30 pointer-events-auto",
            isLocked && "pointer-events-none",
            canDrag && "cursor-grab active:cursor-grabbing"
          )}
          onClick={(e) => {
            e.stopPropagation()
            if (!isEditing) selectBlock(block.id)
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            if (isEditable && !isEditing) startEditing()
          }}
          onMouseEnter={(e) => {
            e.stopPropagation()
            setHoveredBlock(block.id)
          }}
          onMouseLeave={(e) => {
            e.stopPropagation()
            setHoveredBlock(null)
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* AI Spotlight ring (Kofi) */}
          {spotlight && <SpotlightRing spotlight={spotlight} />}

          {/* Floating toolbar */}
          {(isSelected || isHovered) && !isEditing && (
            <div
              className="absolute -top-8 left-1 z-20 flex items-center gap-0.5 rounded-md px-1 py-0.5 shadow-lg bg-card border border-border cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                // Allow toolbar to initiate drag on the parent block
                if (canDrag && blockRef.current) {
                  // The parent div is already draggable
                }
              }}
            >
              {/* Drag handle indicator */}
              <div className="p-1 text-muted-foreground">
                <Move size={12} />
              </div>

              {/* Tag label */}
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-muted-foreground bg-accent">
                {"<"}{tagLabel}{">"}
              </span>

              {block.animation?.type && (
                <span className={cn(
                  "flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded",
                  isInteractiveAnimation(block.animation.type)
                    ? "bg-violet-500/15 text-violet-400"
                    : "bg-primary/15 text-primary"
                )} title={`Animation: ${block.animation.type}`}>
                  {isInteractiveAnimation(block.animation.type) ? <Sparkles size={8} /> : <Play size={8} />}
                  {block.animation.type}
                </span>
              )}

              {block.interaction && (
                <span className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400"
                  title={`Interaction: ${block.interaction.type} (${block.interaction.content?.length || 0} blocks)`}>
                  <MousePointerClick size={8} />
                  {block.interaction.type}
                </span>
              )}

              {hasResponsiveHidden && (
                <span className="flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded bg-amber-500/15 text-amber-500" title="Hidden on some devices">
                  {block.responsive?.hidden?.desktop && <Monitor size={8} className="opacity-50 line-through" />}
                  {block.responsive?.hidden?.tablet && <Tablet size={8} className="opacity-50" />}
                  {block.responsive?.hidden?.mobile && <Smartphone size={8} className="opacity-50" />}
                </span>
              )}

              <div className="w-px h-3 mx-0.5 bg-border" />

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateBlock(block.id)
                }}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Duplicate block"
              >
                <Copy size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeBlock(block.id)
                }}
                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete block"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}

          {/* Inline editing overlay */}
          {isEditing && (
            <div className="absolute -top-8 left-1 z-20 flex items-center gap-1 rounded-md px-2 py-1 shadow-lg bg-primary/90 text-primary-foreground text-xs">
              <span>Editing text</span>
              <span className="opacity-60">- Enter to save, Esc to cancel</span>
            </div>
          )}

          {/* Nesting depth indicator */}
          {depth > 0 && isSelected && (
            <div
              className="absolute -left-1 top-0 bottom-0 w-0.5 rounded-full"
              style={{ backgroundColor: `hsl(${(depth * 60) % 360}, 60%, 55%)` }}
            />
          )}

          {/* Actual block content - or inline editor */}
          {isEditing ? (
            <div
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              className={`${sanitizeClassForCanvas(block.className)} outline-none ring-2 ring-primary/50 bg-primary/5`}
              onInput={(e) => setEditText(e.currentTarget.textContent || "")}
              onBlur={saveEdit}
              onKeyDown={handleEditKeyDown}
            >
              {editText}
            </div>
          ) : block.componentName === "PartialReference" && block.partialId ? (
            <PartialInlineRenderer block={block} />
          ) : block.componentName && getSmartBlock(block.componentName) ? (
            <SmartBlockPlaceholder block={block} />
          ) : (
            <BlockRenderer block={{ ...block, className: sanitizeClassForCanvas(block.className) }} renderChildren={renderChildren} />
          )}
        </div>

        {/* Drop indicator AFTER */}
        {dropPosition === "after" && (
          <div className={cn(
            "absolute z-20 flex items-center justify-center transition-all",
            parentIsHorizontal
              ? "w-6 h-6 -right-3 top-1/2 -translate-y-1/2"
              : "w-6 h-6 left-1/2 -translate-x-1/2 -bottom-3"
          )}>
            <div className="w-5 h-5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center">
              <Plus size={10} className="text-primary/70" />
            </div>
          </div>
        )}
      </div>
    </BlockContextMenu>
  )
}

/* ---- Smart Block Placeholder ---- */
function SmartBlockPlaceholder({ block }: { block: Block }) {
  const def = getSmartBlock(block.componentName!)
  if (!def) return null

  // Build a config summary string from commerce data
  const parts: string[] = []
  if (block.commerce?.limit) parts.push(`${block.commerce.limit} items`)
  if (block.commerce?.sortKey) parts.push(block.commerce.sortKey.toLowerCase().replace("_", " "))
  if (block.commerce?.provider && block.commerce.provider !== "generic") parts.push(block.commerce.provider)

  const summary = parts.length > 0 ? parts.join(", ") : "default config"

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8",
      "bg-violet-500/5 border-violet-500/20 text-violet-300"
    )}>
      <div className="flex items-center gap-2">
        <Component size={18} className="text-violet-400" />
        <span className="text-sm font-semibold text-violet-200">{def.displayName}</span>
      </div>
      <span className="text-xs text-violet-400/70">{summary}</span>
      <span className="text-[10px] text-violet-500/50 mt-1">Smart block — renders with live data on the storefront</span>
    </div>
  )
}

/* ---- Partial Inline Renderer ---- */
function PartialInlineRenderer({ block }: { block: Block }) {
  const { data: partial, isLoading } = usePartial(block.partialId ?? null)

  const partialBlocks = extractPartialBlocks(partial?.content)
  const name = partial?.name ?? (isLoading ? "Loading..." : "Unknown Partial")

  // While loading or if no blocks, show a compact placeholder
  if (isLoading || !partialBlocks.length) {
    return (
      <div className={cn(
        "flex items-center gap-2 rounded-md border border-dashed px-4 py-3",
        "bg-cyan-500/5 border-cyan-500/20 text-cyan-300"
      )}>
        <Layers size={14} className="text-cyan-400" />
        <span className="text-xs text-cyan-200">{isLoading ? "Loading partial..." : name}</span>
      </div>
    )
  }

  // Render the partial's blocks inline with a subtle border + label
  return (
    <div className="relative">
      {/* Partial label badge */}
      <div className="absolute -top-2.5 left-3 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
        <Layers size={10} className="text-cyan-400" />
        <span className="text-[9px] font-medium text-cyan-400">{name}</span>
        <a
          href={`/admin/partials/${block.partialId}/editor`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-cyan-500 hover:text-cyan-300 ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          edit
        </a>
      </div>
      {/* Render partial blocks using BlockRenderer (read-only preview) */}
      <div className="border border-cyan-500/10 rounded-md overflow-hidden">
        {partialBlocks.map((b) => (
          <PartialBlockPreview key={b.id} block={b} />
        ))}
      </div>
    </div>
  )
}

/** Recursively renders blocks from a partial as a read-only preview */
function PartialBlockPreview({ block }: { block: Block }) {
  const renderChildren = useCallback(
    (children: Block[]) => children.map((child) => <PartialBlockPreview key={child.id} block={child} />),
    []
  )
  return (
    <BlockRenderer
      block={{ ...block, className: sanitizeClassForCanvas(block.className) }}
      renderChildren={renderChildren}
      isPreview
    />
  )
}

function extractPartialBlocks(content: unknown): Block[] {
  if (!content || typeof content !== "object") return []
  const doc = content as Record<string, unknown>
  const blocks = (doc.version === "2.0" && Array.isArray(doc.blocks))
    ? doc.blocks
    : Array.isArray(content) ? content : []
  return blocks as Block[]
}

/* ---- Empty canvas drop zone ---- */
export function EmptyCanvasDropZone() {
  const { addBlockFromTemplate, addBlockRaw } = useEditor()
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      className={`
        flex flex-col items-center justify-center py-20 mx-4 rounded-lg border-2 border-dashed transition-colors
        ${isOver ? "border-primary bg-primary/5" : "border-border"}
      `}
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const partialIdDrop = e.dataTransfer.getData("application/partial-id")
        if (partialIdDrop) {
          addBlockRaw({
            id: generateId(),
            tag: "div",
            className: "",
            componentName: "PartialReference",
            partialId: partialIdDrop,
          }, null)
          return
        }
        const paletteLabel = e.dataTransfer.getData("application/palette-label")
        if (paletteLabel) {
          addBlockFromTemplate(paletteLabel, null)
        }
      }}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <ChevronRight size={32} className="rotate-90 opacity-40" />
        <p className="text-sm font-medium">Drag blocks here to start building</p>
        <p className="text-xs opacity-60">Or click a block in the palette</p>
      </div>
    </div>
  )
}
