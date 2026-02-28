"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import type { Block } from "@/lib/cms/block-editor/types"
import { isContainerTag } from "@/lib/cms/block-editor/types"
import { countBlocks } from "@/lib/cms/block-editor/tree-utils"
import { BlockContextMenu } from "./block-context-menu"
import { cn } from "@/lib/cms/utils"
import {
  ChevronRight,
  ChevronDown,
  Type,
  Image,
  Square,
  Heading1,
  Heading2,
  Heading3,
  List,
  Link,
  Layout,
  LayoutGrid,
  Menu,
  FileText,
  FormInput,
  Play,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Pencil,
  Layers,
} from "lucide-react"

// Human-friendly labels for block tags
const TAG_LABELS: Record<string, string> = {
  div: "Container",
  section: "Section",
  header: "Header",
  footer: "Footer",
  main: "Main",
  nav: "Navigation",
  aside: "Sidebar",
  article: "Article",
  ul: "List",
  ol: "Numbered List",
  li: "List Item",
  figure: "Figure",
  form: "Form",
  blockquote: "Quote",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  p: "Paragraph",
  span: "Text",
  a: "Link",
  button: "Button",
  img: "Image",
  hr: "Divider",
  input: "Input",
  textarea: "Text Area",
  label: "Label",
  video: "Video",
  svg: "SVG",
  figcaption: "Caption",
}

// Icons for different block types
function getBlockIcon(tag: string, size = 14) {
  switch (tag) {
    case "h1":
      return <Heading1 size={size} />
    case "h2":
      return <Heading2 size={size} />
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return <Heading3 size={size} />
    case "p":
    case "span":
      return <Type size={size} />
    case "img":
      return <Image size={size} />
    case "a":
      return <Link size={size} />
    case "ul":
    case "ol":
      return <List size={size} />
    case "nav":
      return <Menu size={size} />
    case "section":
    case "article":
      return <FileText size={size} />
    case "header":
    case "footer":
      return <Layout size={size} />
    case "form":
    case "input":
    case "textarea":
      return <FormInput size={size} />
    case "div":
      return <LayoutGrid size={size} />
    default:
      return <Square size={size} />
  }
}

// Get display name for a block
function getBlockDisplayName(block: Block): string {
  if (block.label) return block.label
  if (block.textContent) {
    const preview = block.textContent.slice(0, 20)
    return preview + (block.textContent.length > 20 ? "..." : "")
  }
  return TAG_LABELS[block.tag] || block.tag
}

interface OutlineRowProps {
  block: Block
  index: number
  parentId: string | null
  depth: number
  expandedIds: Set<string>
  toggleExpanded: (id: string) => void
}

function OutlineRow({
  block,
  index,
  parentId,
  depth,
  expandedIds,
  toggleExpanded,
}: OutlineRowProps) {
  const { state, selectBlock, setHoveredBlock, updateBlock } = useEditor()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const isContainer = isContainerTag(block.tag) || !!block.children
  const hasChildren = isContainer && block.children && block.children.length > 0
  const isExpanded = expandedIds.has(block.id)
  const isSelected = state.selectedBlockId === block.id
  const isHovered = state.hoveredBlockId === block.id

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const startRenaming = useCallback(() => {
    setRenameValue(block.label || "")
    setIsRenaming(true)
  }, [block.label])

  const saveRename = useCallback(() => {
    const trimmed = renameValue.trim()
    updateBlock(block.id, { label: trimmed || undefined })
    setIsRenaming(false)
  }, [block.id, renameValue, updateBlock])

  const cancelRename = useCallback(() => {
    setIsRenaming(false)
    setRenameValue("")
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveRename()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelRename()
    }
  }, [saveRename, cancelRename])

  const toggleVisibility = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateBlock(block.id, { hidden: !block.hidden })
  }, [block.id, block.hidden, updateBlock])

  const toggleLock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateBlock(block.id, { locked: !block.locked })
  }, [block.id, block.locked, updateBlock])

  return (
    <>
      <BlockContextMenu block={block} parentId={parentId} index={index}>
        <div
          className={cn(
            "group flex items-center gap-1 py-1 px-2 cursor-pointer transition-colors rounded-sm text-sm",
            isSelected && "bg-primary/15 text-primary",
            isHovered && !isSelected && "bg-accent/50",
            !isSelected && !isHovered && "hover:bg-accent/30",
            block.hidden && "opacity-50"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => selectBlock(block.id)}
          onMouseEnter={() => setHoveredBlock(block.id)}
          onMouseLeave={() => setHoveredBlock(null)}
          onDoubleClick={(e) => {
            e.stopPropagation()
            startRenaming()
          }}
        >
          {/* Expand/collapse chevron */}
          {isContainer ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(block.id)
              }}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Icon */}
          <span className={cn(
            "flex-shrink-0",
            isSelected ? "text-primary" : "text-muted-foreground"
          )}>
            {getBlockIcon(block.tag)}
          </span>

          {/* Name */}
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={saveRename}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 px-1 py-0 text-xs bg-input border border-primary rounded outline-none"
              placeholder={TAG_LABELS[block.tag] || block.tag}
            />
          ) : (
            <span className="flex-1 min-w-0 truncate text-xs">
              {getBlockDisplayName(block)}
            </span>
          )}

          {/* Animation indicator */}
          {block.animation?.type && (
            <Play size={10} className="text-primary flex-shrink-0" />
          )}

          {/* Lock indicator (always visible if locked) */}
          {block.locked && (
            <Lock size={10} className="text-muted-foreground flex-shrink-0" />
          )}

          {/* Quick action buttons (visible on hover) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={toggleVisibility}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title={block.hidden ? "Show" : "Hide"}
            >
              {block.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button
              onClick={toggleLock}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title={block.locked ? "Unlock" : "Lock"}
            >
              {block.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                startRenaming()
              }}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Rename"
            >
              <Pencil size={12} />
            </button>
          </div>
        </div>
      </BlockContextMenu>

      {/* Children */}
      {isExpanded && hasChildren && block.children!.map((child, i) => (
        <OutlineRow
          key={child.id}
          block={child}
          index={i}
          parentId={block.id}
          depth={depth + 1}
          expandedIds={expandedIds}
          toggleExpanded={toggleExpanded}
        />
      ))}
    </>
  )
}

export function OutlinePanel() {
  const { state } = useEditor()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()
    const collectContainers = (blocks: Block[]) => {
      for (const block of blocks) {
        if (isContainerTag(block.tag) || block.children) {
          ids.add(block.id)
          if (block.children) collectContainers(block.children)
        }
      }
    }
    collectContainers(state.blocks)
    return ids
  })

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const totalBlocks = countBlocks(state.blocks)

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-card-foreground">Outline</h2>
        </div>
        <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {totalBlocks} block{totalBlocks !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {state.blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Layers className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No blocks yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Add blocks from the palette or use AI
            </p>
          </div>
        ) : (
          state.blocks.map((block, i) => (
            <OutlineRow
              key={block.id}
              block={block}
              index={i}
              parentId={null}
              depth={0}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
            />
          ))
        )}
      </div>

      {/* Tips footer */}
      <div className="border-t border-border p-3 text-[10px] text-muted-foreground">
        <p className="font-medium mb-1">Tips:</p>
        <ul className="space-y-0.5 text-muted-foreground/70">
          <li>Double-click to rename</li>
          <li>Right-click for more options</li>
        </ul>
      </div>
    </aside>
  )
}
