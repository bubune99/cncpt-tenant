"use client"

import type { Block, BlockAnimation, BlockBackground } from "@/lib/cms/block-editor/types"
import { isContainerTag } from "@/lib/cms/block-editor/types"
import { createElement } from "react"
import { motion } from "framer-motion"

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
 * Convert a CSS string like "color: red; font-size: 14px" to a React style object.
 * React's createElement requires style to be an object, not a string.
 */
function parseCssString(css: string): React.CSSProperties {
  const style: Record<string, string> = {}
  for (const decl of css.split(";")) {
    const colon = decl.indexOf(":")
    if (colon < 1) continue
    const prop = decl.slice(0, colon).trim()
    const val = decl.slice(colon + 1).trim()
    if (!prop || !val) continue
    // Convert kebab-case to camelCase (e.g. font-size → fontSize)
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    style[camel] = val
  }
  return style as React.CSSProperties
}

/**
 * Build framer-motion props from BlockAnimation data.
 * Returns props to spread onto a motion component (initial, animate/whileInView/whileHover, transition, viewport).
 */
function buildAnimationProps(anim: BlockAnimation): Record<string, unknown> {
  const { type = "fadeIn", trigger = "onMount", duration = 0.5, delay = 0 } = anim

  // Custom animation — pass through raw motion props
  if (type === "custom" && anim.custom) {
    const props: Record<string, unknown> = {}
    if (anim.custom.initial) props.initial = anim.custom.initial
    if (anim.custom.animate) props.animate = anim.custom.animate
    if (anim.custom.whileInView) props.whileInView = anim.custom.whileInView
    if (anim.custom.whileHover) props.whileHover = anim.custom.whileHover
    if (anim.custom.transition) props.transition = anim.custom.transition
    return props
  }

  // Preset initial states
  const presets: Record<string, Record<string, number>> = {
    fadeIn:     { opacity: 0 },
    slideUp:    { opacity: 0, y: 30 },
    slideDown:  { opacity: 0, y: -30 },
    slideLeft:  { opacity: 0, x: -30 },
    slideRight: { opacity: 0, x: 30 },
    scale:      { opacity: 0, scale: 0.9 },
  }

  const initial = presets[type] || presets.fadeIn
  const animate = Object.fromEntries(Object.keys(initial).map((k) => [k, k === "scale" ? 1 : k === "opacity" ? 1 : 0]))
  const transition = { duration, delay, ease: "easeOut" as const }

  if (trigger === "inView") {
    return {
      initial,
      whileInView: animate,
      viewport: { once: true, margin: "-50px" },
      transition,
    }
  }

  if (trigger === "hover") {
    return { whileHover: animate, transition }
  }

  // onMount
  return { initial, animate, transition }
}

/**
 * Renders a block as its native HTML tag with its Tailwind className.
 * The new architecture means every block is just: <tag className={...}>content</tag>
 * When block.animation is present, renders as a framer-motion component.
 */
export function BlockRenderer({ block, renderChildren, isPreview = false }: BlockRendererProps) {
  // Skip rendering hidden blocks in preview/export
  if (block.hidden) {
    return null
  }

  // Use motion component when animation is present, plain tag otherwise
  const hasAnimation = !!block.animation
  const Tag = hasAnimation
    ? ((motion as Record<string, unknown>)[block.tag] || block.tag)
    : block.tag
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
        // React requires style to be an object, not a CSS string
        if (key === "style" && typeof val === "string") {
          const parsed = parseCssString(val)
          htmlAttrs.style = htmlAttrs.style
            ? { ...(htmlAttrs.style as Record<string, string>), ...parsed }
            : parsed
        } else {
          htmlAttrs[key] = val
        }
      }
    }
  }

  // Special: images need crossOrigin
  if (block.tag === "img") {
    htmlAttrs.crossOrigin = "anonymous"
  }

  // Apply framer-motion animation props
  if (hasAnimation && block.animation) {
    Object.assign(htmlAttrs, buildAnimationProps(block.animation))
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
