"use client"

import type { Block, BlockAnimation, BlockBackground, BlockResponsive } from "@/lib/cms/block-editor/types"
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
 * Build responsive visibility Tailwind classes from BlockResponsive data.
 * Returns classes that hide the block on the specified breakpoints.
 */
function buildResponsiveClasses(responsive: BlockResponsive): string {
  const classes: string[] = []
  const h = responsive.hidden
  if (!h) return ""

  if (h.mobile && h.tablet && h.desktop) {
    classes.push("hidden")
  } else if (h.mobile && h.tablet) {
    classes.push("hidden", "lg:block")
  } else if (h.tablet && h.desktop) {
    classes.push("md:hidden")
  } else if (h.mobile && h.desktop) {
    classes.push("hidden", "md:block", "lg:hidden")
  } else if (h.desktop) {
    classes.push("lg:hidden")
  } else if (h.tablet) {
    classes.push("max-md:block", "md:hidden", "lg:block")
  } else if (h.mobile) {
    classes.push("max-md:hidden")
  }

  return classes.join(" ")
}

/**
 * Animation presets matching the ones defined in serialization.ts.
 * `initial` = the starting state before animation.
 * `animate` = the final state after animation.
 * `hover` = the transform applied on hover (element stays visible, just transforms).
 */
const ANIMATION_PRESETS: Record<string, {
  initial: Record<string, number>
  animate: Record<string, number>
  hover: Record<string, number>
}> = {
  fadeIn:      { initial: { opacity: 0 },                animate: { opacity: 1 },             hover: { opacity: 0.7 } },
  slideUp:    { initial: { opacity: 0, y: 40 },         animate: { opacity: 1, y: 0 },       hover: { y: -5 } },
  slideDown:  { initial: { opacity: 0, y: -40 },        animate: { opacity: 1, y: 0 },       hover: { y: 5 } },
  slideLeft:  { initial: { opacity: 0, x: 40 },         animate: { opacity: 1, x: 0 },       hover: { x: -5 } },
  slideRight: { initial: { opacity: 0, x: -40 },        animate: { opacity: 1, x: 0 },       hover: { x: 5 } },
  scale:      { initial: { opacity: 0, scale: 0.85 },   animate: { opacity: 1, scale: 1 },   hover: { scale: 1.05 } },
}

/**
 * Build framer-motion props from BlockAnimation data.
 *
 * Trigger behavior:
 * - onMount: element starts at `initial`, immediately animates to `animate`
 * - inView:  element starts at `initial`, animates to target when scrolled into view
 * - hover:   element is fully visible, transforms on hover (no initial hiding)
 */
function buildMotionProps(anim: BlockAnimation): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  if (anim.type && anim.type !== "custom") {
    const preset = ANIMATION_PRESETS[anim.type]
    if (!preset) return props

    const transition: Record<string, number> = { duration: anim.duration ?? 0.5 }
    if (anim.delay && anim.delay > 0) transition.delay = anim.delay

    if (anim.trigger === "hover") {
      // Hover: element is visible, animates transform on hover.
      // No `initial` hiding — the block should be visible at all times.
      props.whileHover = preset.hover
      props.transition = transition
    } else if (anim.trigger === "inView") {
      // Scroll-triggered: starts hidden, animates in when scrolled into viewport
      props.initial = preset.initial
      props.whileInView = preset.animate
      props.viewport = { once: true, amount: 0.15 }
      props.transition = transition
    } else {
      // onMount (default): starts hidden, animates in immediately on mount
      props.initial = preset.initial
      props.animate = preset.animate
      props.transition = transition
    }
  } else if (anim.type === "custom" && anim.custom) {
    const c = anim.custom
    if (c.initial) props.initial = c.initial
    if (c.animate) props.animate = c.animate
    if (c.whileInView) {
      props.whileInView = c.whileInView
      props.viewport = { once: true, amount: 0.15 }
    }
    if (c.whileHover) props.whileHover = c.whileHover
    if (c.transition) props.transition = c.transition
  }

  return props
}

/**
 * Renders a block as its native HTML tag with its Tailwind className.
 * Uses framer-motion's motion components when animation data is present.
 * The new architecture means every block is just: <tag className={...}>content</tag>
 */
export function BlockRenderer({ block, renderChildren, isPreview = false }: BlockRendererProps) {
  // Skip rendering hidden blocks in preview/export
  if (block.hidden) {
    return null
  }

  const anim = block.animation
  const hasAnim = !!anim?.type

  // Use motion component when animation data exists, plain tag otherwise
  // motion["div"], motion["section"], etc. — framer-motion supports all HTML tags
  const Tag = hasAnim
    ? (motion as unknown as Record<string, React.ComponentType<Record<string, unknown>>>)[block.tag]
    : block.tag

  const isContainer = isContainerTag(block.tag) || !!block.children
  const isSelfClosing = ["img", "hr", "input"].includes(block.tag)
  const hasBackground = block.background?.url

  // Build responsive visibility classes
  const responsiveClasses = block.responsive ? buildResponsiveClasses(block.responsive) : ""
  const mergedClassName = [block.className, responsiveClasses].filter(Boolean).join(" ") || undefined

  // Build the HTML attributes object
  const htmlAttrs: Record<string, unknown> = {
    className: mergedClassName,
  }

  // Add background image styles if present
  if (hasBackground) {
    htmlAttrs.style = buildBackgroundStyle(block.background!)
  }

  // Add framer-motion props when animation data is present
  if (hasAnim && anim) {
    Object.assign(htmlAttrs, buildMotionProps(anim))
  }

  // Boolean HTML attributes that React expects as `true` rather than `""`
  const BOOLEAN_ATTRS = new Set([
    "controls", "autoplay", "muted", "loop", "playsinline",
    "disabled", "checked", "readonly", "required", "multiple",
    "hidden", "novalidate", "formnovalidate", "allowfullscreen",
  ])

  // Spread any extra attributes (src, href, alt, placeholder, type, etc.)
  if (block.attrs) {
    for (const [key, val] of Object.entries(block.attrs)) {
      if (val === undefined || val === null) continue
      if (BOOLEAN_ATTRS.has(key)) {
        // Boolean attrs: present = true (even if value is "")
        htmlAttrs[key] = true
      } else if (val !== "") {
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
