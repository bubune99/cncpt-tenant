"use client"

import type { Block, BlockBackground } from "@/lib/cms/block-editor/types"
import { isContainerTag } from "@/lib/cms/block-editor/types"
import { createElement } from "react"

interface BlockRendererProps {
  block: Block
  renderChildren?: (children: Block[]) => React.ReactNode
  /** When true, hides editor-only artifacts like empty container placeholders */
  isPreview?: boolean
}

/**
 * Build inline style object for background image
 */
function buildBackgroundStyle(bg: BlockBackground): React.CSSProperties {
  const style: React.CSSProperties = {}

  if (bg.url) {
    style.backgroundImage = `url('${bg.url}')`
    style.backgroundSize = bg.size || "cover"
    style.backgroundPosition = bg.position || "center"
    style.backgroundRepeat = "no-repeat"
    if (bg.attachment) {
      style.backgroundAttachment = bg.attachment
    }
  }

  return style
}

/**
 * Check if textContent contains HTML tags
 */
function containsHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text)
}

/**
 * Renders a block as its native HTML tag with its Tailwind className.
 * The new architecture means every block is just: <tag className={...}>content</tag>
 */
export function BlockRenderer({ block, renderChildren, isPreview = false }: BlockRendererProps) {
  // Skip rendering hidden blocks in preview/export
  if (block.hidden) {
    return null
  }

  const Tag = block.tag
  const isContainer = isContainerTag(block.tag) || !!block.children
  const isSelfClosing = ["img", "hr", "input"].includes(block.tag)
  const hasBackground = block.background?.url

  // Build the HTML attributes object
  const htmlAttrs: Record<string, unknown> = {
    className: block.className || undefined,
  }

  // Add background image styles if present
  if (hasBackground) {
    htmlAttrs.style = buildBackgroundStyle(block.background!)
  }

  // Spread any extra attributes (src, href, alt, placeholder, type, etc.)
  if (block.attrs) {
    for (const [key, val] of Object.entries(block.attrs)) {
      if (val !== undefined && val !== null && val !== "") {
        htmlAttrs[key] = val
      }
    }
  }

  // Special: images need crossOrigin
  if (block.tag === "img") {
    htmlAttrs.crossOrigin = "anonymous"
  }

  // Self-closing tags
  if (isSelfClosing) {
    return createElement(Tag, htmlAttrs)
  }

  // Container blocks: render children or empty state
  if (isContainer) {
    const hasChildren = block.children && block.children.length > 0
    const hasOverlay = block.background?.overlay

    // In preview mode, don't show the "Drop blocks here" placeholder
    const content = hasChildren && renderChildren
      ? renderChildren(block.children!)
      : !hasChildren && !isPreview
      ? createElement(
          "div",
          {
            className:
              "flex items-center justify-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-md bg-muted/30",
          },
          "Drop blocks here"
        )
      : null

    // Add overlay layer if specified
    if (hasOverlay && hasBackground) {
      return createElement(
        Tag,
        { ...htmlAttrs, className: `${block.className || ""} relative`.trim() },
        createElement("div", {
          className: "absolute inset-0 z-0",
          style: { background: block.background!.overlay },
        }),
        createElement("div", { className: "relative z-10" }, content)
      )
    }

    return createElement(Tag, htmlAttrs, content)
  }

  // Leaf blocks: render text content
  // Support HTML content in textContent (for rich text editing)
  if (block.textContent && containsHtml(block.textContent)) {
    return createElement(Tag, {
      ...htmlAttrs,
      dangerouslySetInnerHTML: { __html: block.textContent }
    })
  }

  return createElement(Tag, htmlAttrs, block.textContent || null)
}

/**
 * Returns true if a block can contain children.
 */
export function blockRendersChildren(block: Block): boolean {
  return isContainerTag(block.tag) || !!block.children
}
