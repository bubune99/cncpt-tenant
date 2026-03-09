"use client"

import type { Block, BlockAnimation, BlockBackground, BlockResponsive } from "@/lib/cms/block-editor/types"
import { isContainerTag, isInteractiveAnimation, isKnownTag } from "@/lib/cms/block-editor/types"
import { createElement } from "react"
import { motion } from "framer-motion"
import { getMotionWrapper } from "@/lib/cms/block-editor/motion-wrappers/registry"
import "@/components/cms/block-editor/motion-wrappers"

interface BlockRendererProps {
  block: Block
  renderChildren?: (children: Block[]) => React.ReactNode
  /** When true, hides editor-only artifacts like empty container placeholders */
  isPreview?: boolean
}

// ── Expression helpers ────────────────────────────────────────────────

/** Check if a string is a preserved JSX expression like "{product.title}" */
function isExpression(val: string): boolean {
  return val.startsWith("{") && val.endsWith("}")
}

/** Strip braces from an expression for display: "{product.title}" → "product.title" */
function expressionLabel(val: string): string {
  return val.slice(1, -1)
}

// ── Attr filtering ────────────────────────────────────────────────────

/** Attrs that are React-internal and must never be spread onto DOM elements */
const SKIP_ATTRS = new Set([
  "ref", "key", "children", "dangerouslySetInnerHTML",
])

/** Attrs that came from preprocessing markers — not real HTML */
const NOISE_ATTRS = new Set([
  "data-had-onclick", "data-had-onmouseenter", "data-had-onmouseleave",
  "data-had-onsubmit", "data-had-onchange", "data-had-onfocus",
  "data-had-onblur", "data-had-onkeydown", "data-had-onkeyup",
  "data-icon", "data-original-component",
  "layoutId",  // framer-motion only
  "menuKey", "sections", "rating", // component props, not HTML
  "defaultValue",  // Radix primitives
])

/** Attrs that are UI component props (not real HTML attributes) */
const COMPONENT_PROP_ATTRS = new Set([
  "variant", "size", "mode", "asChild", "collapsible",
])

/** Boolean HTML attributes that React expects as `true` rather than `""` */
const BOOLEAN_ATTRS = new Set([
  "controls", "autoplay", "muted", "loop", "playsinline",
  "disabled", "checked", "readonly", "required", "multiple",
  "hidden", "novalidate", "formnovalidate", "allowfullscreen",
])

/** Real HTML attributes that are valid on DOM elements */
const VALID_HTML_ATTRS = new Set([
  "src", "href", "alt", "title", "target", "rel", "type", "name",
  "placeholder", "value", "id", "role", "tabIndex", "width", "height",
  "action", "method", "encType", "htmlFor", "aria-label", "aria-hidden",
  "aria-expanded", "aria-controls", "aria-describedby", "aria-labelledby",
  "crossOrigin", "loading", "decoding", "fetchPriority", "sizes",
  "srcSet", "media", "poster", "preload", "controls",
  "min", "max", "step", "pattern", "maxLength", "minLength",
  "rows", "cols", "wrap", "spellCheck", "autoComplete", "autoFocus",
  "download", "ping", "referrerPolicy", "sandbox",
  "allow", "allowFullScreen", "frameBorder",
  "open", "cite", "dateTime", "form", "list",
  "accept", "capture", "inputMode", "is",
])

/**
 * Check if an attr key is a valid data-* attribute (not a noise marker).
 */
function isValidDataAttr(key: string): boolean {
  if (!key.startsWith("data-")) return false
  if (NOISE_ATTRS.has(key)) return false
  return true
}

// ── Custom tag resolution ─────────────────────────────────────────────

/**
 * Map a custom component tag to the closest real HTML tag for rendering.
 * Handles: Image→img, Link→a, Button→button, icons→span, containers→div.
 */
function resolveCustomTag(block: Block): string {
  const tag = block.tag
  const lower = tag.toLowerCase()

  // Image/media components
  if (lower === "image" || lower === "img" || lower === "avatar") return "img"
  if (lower === "video") return "video"

  // Link/navigation components
  if (lower === "link" || lower === "navlink" || lower === "routerlink") return "a"

  // Button-like components
  if (lower === "button" || lower === "iconbutton") return "button"

  // Form components
  if (lower === "input" || lower === "textfield") return "input"
  if (lower === "textarea") return "textarea"
  if (lower === "select") return "select"
  if (lower === "label") return "label"
  if (lower === "form") return "form"

  // Text components
  if (lower === "text" || lower === "heading") return "span"

  // Self-closing with no children and no text → inline placeholder
  if (!block.children?.length && !block.textContent) return "span"

  // Has children → container
  if (block.children?.length) return "div"

  // Has text content → inline
  return "span"
}

// ── Background styles ─────────────────────────────────────────────────

function buildBackgroundStyle(bg: BlockBackground): React.CSSProperties {
  const style: React.CSSProperties = {}
  if (bg.url) {
    style.backgroundImage = `url('${bg.url}')`
    style.backgroundSize = bg.size || "cover"
    style.backgroundPosition = bg.position || "center"
    style.backgroundRepeat = "no-repeat"
    if (bg.attachment) style.backgroundAttachment = bg.attachment
  }
  return style
}

function containsHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text)
}

// ── Responsive ────────────────────────────────────────────────────────

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

// ── Animation ─────────────────────────────────────────────────────────

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

function buildMotionProps(anim: BlockAnimation): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  if (anim.type && anim.type !== "custom") {
    const preset = ANIMATION_PRESETS[anim.type]
    if (!preset) return props

    const transition: Record<string, number> = { duration: anim.duration ?? 0.5 }
    if (anim.delay && anim.delay > 0) transition.delay = anim.delay

    if (anim.trigger === "hover") {
      props.whileHover = preset.hover
      props.transition = transition
    } else if (anim.trigger === "inView") {
      props.initial = preset.initial
      props.whileInView = preset.animate
      props.viewport = { once: true, amount: 0.15 }
      props.transition = transition
    } else {
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

// ── Attr building ─────────────────────────────────────────────────────

/**
 * Build filtered HTML attrs from block.attrs.
 * Skips: React internals, noise markers, component props, expression values.
 * Handles: boolean attrs, style parsing, valid HTML attrs, data-* attrs.
 */
function buildFilteredAttrs(
  block: Block,
  resolvedTag: string,
  baseAttrs: Record<string, unknown>,
): Record<string, unknown> {
  const htmlAttrs = { ...baseAttrs }

  if (!block.attrs) return htmlAttrs

  for (const [key, val] of Object.entries(block.attrs)) {
    if (val === undefined || val === null) continue

    // Skip React internals
    if (SKIP_ATTRS.has(key)) continue

    // Skip preprocessor noise
    if (NOISE_ATTRS.has(key)) continue

    // Skip UI component props (variant, size, mode) — not valid HTML
    if (COMPONENT_PROP_ATTRS.has(key)) continue

    // Expression values — skip for rendering (they'd produce broken src/href/etc.)
    if (typeof val === "string" && isExpression(val)) continue

    // Boolean attrs
    if (BOOLEAN_ATTRS.has(key)) {
      // Skip expression booleans like disabled="{isLoading}"
      if (typeof val === "string" && val !== "" && val !== "true") continue
      htmlAttrs[key] = true
      continue
    }

    // Style — parse to CSSProperties
    if (key === "style") {
      if (typeof val === "string" && val.trim()) {
        // Skip expression styles like "{ opacity, background: ... }"
        if (val.trim().startsWith("{")) continue
        try {
          const parsed = JSON.parse(val.replace(/'/g, '"'))
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            htmlAttrs.style = { ...(htmlAttrs.style as Record<string, unknown> || {}), ...parsed }
          }
        } catch {
          const styleObj: Record<string, string> = {}
          val.split(";").forEach(rule => {
            const [prop, ...rest] = rule.split(":")
            if (prop && rest.length) {
              const camelProp = prop.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
              styleObj[camelProp] = rest.join(":").trim()
            }
          })
          if (Object.keys(styleObj).length > 0) {
            htmlAttrs.style = { ...(htmlAttrs.style as Record<string, unknown> || {}), ...styleObj }
          }
        }
      }
      continue
    }

    // Valid HTML attributes or data-* attributes
    if (VALID_HTML_ATTRS.has(key) || isValidDataAttr(key) || key.startsWith("aria-")) {
      if (val !== "") htmlAttrs[key] = val
    }
    // Skip anything else (unknown component props that leaked through)
  }

  // Images always need crossOrigin for canvas rendering
  if (resolvedTag === "img") {
    htmlAttrs.crossOrigin = "anonymous"
    // If no src (expression was skipped), use a placeholder
    if (!htmlAttrs.src) {
      htmlAttrs.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'%3EImage%3C/text%3E%3C/svg%3E"
      htmlAttrs.alt = block.attrs?.alt
        ? (isExpression(block.attrs.alt) ? expressionLabel(block.attrs.alt) : block.attrs.alt)
        : block.tag !== "img" ? block.tag : "Image"
    }
  }

  return htmlAttrs
}

// ── Content building ──────────────────────────────────────────────────

/**
 * Build the content for a block (children, text, or empty state).
 * Shared by both the standard rendering path and the interactive wrapper path.
 */
function buildBlockContent(
  block: Block,
  renderChildren?: (children: Block[]) => React.ReactNode,
  isPreview?: boolean,
): React.ReactNode {
  const resolved = isKnownTag(block.tag) ? block.tag : resolveCustomTag(block)
  const hasChildren = block.children && block.children.length > 0
  const isContainer = isContainerTag(block.tag) || hasChildren
  const isSelfClosing = ["img", "hr", "input"].includes(resolved)

  if (isSelfClosing) return null

  if (isContainer) {
    return hasChildren && renderChildren
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
  }

  // Leaf: expression text shows as-is (e.g. "{product.title}" renders as readable text)
  if (block.textContent && containsHtml(block.textContent)) {
    return createElement("span", { dangerouslySetInnerHTML: { __html: block.textContent } })
  }
  return block.textContent || null
}

// ── Main renderer ─────────────────────────────────────────────────────

/**
 * Renders a block as its native HTML tag with its Tailwind className.
 * Uses framer-motion's motion components when animation data is present.
 * Delegates to interactive motion wrappers for cursor/scroll/autonomous presets.
 * Custom component tags are resolved to the closest real HTML equivalent.
 */
export function BlockRenderer({ block, renderChildren, isPreview = false }: BlockRendererProps) {
  if (block.hidden) return null

  const anim = block.animation
  const hasAnim = !!anim?.type

  // Build responsive visibility classes
  const responsiveClasses = block.responsive ? buildResponsiveClasses(block.responsive) : ""
  const mergedClassName = [block.className, responsiveClasses].filter(Boolean).join(" ") || undefined

  // Build background style
  const hasBackground = block.background?.url
  const bgStyle: React.CSSProperties | undefined = hasBackground ? buildBackgroundStyle(block.background!) : undefined

  // Resolve custom component tags to real HTML equivalents
  const resolvedTag = isKnownTag(block.tag) ? block.tag : resolveCustomTag(block)

  // ---- Interactive animation path ----
  if (anim?.type && isInteractiveAnimation(anim.type)) {
    const wrapperConfig = getMotionWrapper(anim.type)
    if (wrapperConfig) {
      const Wrapper = wrapperConfig.component
      const config = { ...wrapperConfig.defaultConfig, ...(anim.interactiveConfig || {}) }
      const content = buildBlockContent(block, renderChildren, isPreview)

      const isSelfClosing = ["img", "hr", "input"].includes(resolvedTag)
      if (isSelfClosing) {
        const htmlAttrs = buildFilteredAttrs(block, resolvedTag, {})
        return (
          <Wrapper config={config} animation={anim} className={mergedClassName} style={bgStyle}>
            {createElement(resolvedTag, htmlAttrs)}
          </Wrapper>
        )
      }

      return (
        <Wrapper config={config} animation={anim} className={mergedClassName} style={bgStyle}>
          {content}
        </Wrapper>
      )
    }
  }

  // ---- Standard path ----

  const Tag = hasAnim
    ? (motion as unknown as Record<string, React.ComponentType<Record<string, unknown>>>)[resolvedTag]
    : resolvedTag

  const hasRealChildren = block.children && block.children.length > 0
  const isContainer = isContainerTag(block.tag) || hasRealChildren
  const isSelfClosing = ["img", "hr", "input"].includes(resolvedTag)

  // Build attrs with proper filtering
  const baseAttrs: Record<string, unknown> = { className: mergedClassName }
  if (bgStyle) baseAttrs.style = bgStyle
  if (hasAnim && anim) Object.assign(baseAttrs, buildMotionProps(anim))

  const htmlAttrs = buildFilteredAttrs(block, resolvedTag, baseAttrs)

  // Self-closing tags
  if (isSelfClosing) {
    return createElement(Tag, htmlAttrs)
  }

  // Container blocks
  if (isContainer) {
    const hasOverlay = block.background?.overlay

    const content = hasRealChildren && renderChildren
      ? renderChildren(block.children!)
      : !hasRealChildren && !isPreview
      ? createElement(
          "div",
          {
            className:
              "flex items-center justify-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-md bg-muted/30",
          },
          "Drop blocks here"
        )
      : null

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

  // Icon placeholder: data-icon blocks render an inline SVG square
  if (block.attrs?.["data-icon"] && !block.textContent && !hasRealChildren) {
    const iconName = block.attrs["data-icon"]
    return createElement(Tag, htmlAttrs,
      createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        width: "1em",
        height: "1em",
        className: "inline-block",
        "aria-label": iconName,
      },
        createElement("rect", { x: 3, y: 3, width: 18, height: 18, rx: 3 }),
        createElement("text", {
          x: 12, y: 16, textAnchor: "middle",
          fontSize: 8, fill: "currentColor", stroke: "none",
        }, iconName.charAt(0))
      )
    )
  }

  // Leaf blocks: render text content
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
  return isContainerTag(block.tag) || (block.children != null && block.children.length > 0)
}
