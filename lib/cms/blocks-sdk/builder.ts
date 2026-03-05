/**
 * Block SDK - Fluent Builder API
 *
 * Provides a clean, chainable API for building block trees programmatically.
 *
 * @example
 * ```ts
 * const hero = section({ className: 'py-20 bg-gradient-to-b from-pink-50' })
 *   .add(
 *     flex({ direction: 'col', align: 'center', gap: 8 })
 *       .add(heading(1, 'Welcome'))
 *       .add(text('Your journey starts here'))
 *   )
 *   .build()
 * ```
 */

import type { Block, BlockTag, BlockAnimation, BlockBackground } from "./types"
import { CONTAINER_TAGS } from "./types"
import { generateId } from "./utils"

// ============================================================
// Block Builder Class
// ============================================================

export class BlockBuilder {
  private _block: Block

  constructor(tag: BlockTag, options: BlockBuilderInput = {}) {
    this._block = {
      id: options.id || generateId(),
      tag,
      className: options.className || "",
      textContent: options.textContent,
      attrs: options.attrs,
      children: CONTAINER_TAGS.includes(tag) ? [] : undefined,
      animation: options.animation,
      background: options.background,
      label: options.label,
      hidden: options.hidden,
      locked: options.locked,
    }
  }

  /**
   * Add a child block (or BlockBuilder)
   */
  add(child: Block | BlockBuilder | (Block | BlockBuilder)[]): this {
    if (!this._block.children) {
      this._block.children = []
    }

    const children = Array.isArray(child) ? child : [child]
    for (const c of children) {
      const block = c instanceof BlockBuilder ? c.build() : c
      this._block.children.push(block)
    }

    return this
  }

  /**
   * Set className (replaces existing)
   */
  className(className: string): this {
    this._block.className = className
    return this
  }

  /**
   * Add classes to existing className
   */
  addClass(...classes: string[]): this {
    const existing = this._block.className.split(/\s+/).filter(Boolean)
    const newClasses = classes.filter(c => !existing.includes(c))
    this._block.className = [...existing, ...newClasses].join(" ")
    return this
  }

  /**
   * Set text content
   */
  text(content: string): this {
    this._block.textContent = content
    return this
  }

  /**
   * Set an attribute
   */
  attr(key: string, value: string): this {
    if (!this._block.attrs) this._block.attrs = {}
    this._block.attrs[key] = value
    return this
  }

  /**
   * Set multiple attributes
   */
  attrs(attrs: Record<string, string>): this {
    this._block.attrs = { ...this._block.attrs, ...attrs }
    return this
  }

  /**
   * Set animation
   */
  animate(animation: BlockAnimation): this {
    this._block.animation = animation
    return this
  }

  /**
   * Set background
   */
  bg(background: BlockBackground): this {
    this._block.background = background
    return this
  }

  /**
   * Set label (for editor outline)
   */
  label(label: string): this {
    this._block.label = label
    return this
  }

  /**
   * Mark as hidden
   */
  hidden(hidden = true): this {
    this._block.hidden = hidden
    return this
  }

  /**
   * Mark as locked
   */
  locked(locked = true): this {
    this._block.locked = locked
    return this
  }

  /**
   * Build and return the final Block
   */
  build(): Block {
    return this._block
  }
}

// ============================================================
// Builder Input Types
// ============================================================

interface BlockBuilderInput {
  id?: string
  className?: string
  textContent?: string
  attrs?: Record<string, string>
  animation?: BlockAnimation
  background?: BlockBackground
  label?: string
  hidden?: boolean
  locked?: boolean
}

interface FlexInput extends BlockBuilderInput {
  direction?: "row" | "col" | "row-reverse" | "col-reverse"
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly"
  align?: "start" | "end" | "center" | "stretch" | "baseline"
  wrap?: boolean
  gap?: number | string
}

interface GridInput extends BlockBuilderInput {
  cols?: number | string
  rows?: number | string
  gap?: number | string
}

// ============================================================
// Simple Block Factory Function
// ============================================================

/**
 * Create a block with tag, options, and optional children
 *
 * @example
 * ```ts
 * block('div', { className: 'container' }, [
 *   block('h1', { className: 'text-4xl' }, 'Hello'),
 *   block('p', {}, 'World'),
 * ])
 * ```
 */
export function block(
  tag: BlockTag,
  options: BlockBuilderInput | string = {},
  children?: string | Block | Block[]
): Block {
  // Allow shorthand: block('p', 'Hello') for text content
  if (typeof options === "string") {
    return {
      id: generateId(),
      tag,
      className: "",
      textContent: options,
    }
  }

  const b: Block = {
    id: options.id || generateId(),
    tag,
    className: options.className || "",
    textContent: options.textContent,
    attrs: options.attrs,
    animation: options.animation,
    background: options.background,
    label: options.label,
    hidden: options.hidden,
    locked: options.locked,
  }

  // Handle children parameter
  if (typeof children === "string") {
    b.textContent = children
  } else if (Array.isArray(children)) {
    b.children = children
  } else if (children) {
    b.children = [children]
  } else if (CONTAINER_TAGS.includes(tag)) {
    b.children = []
  }

  return b
}

// ============================================================
// Layout Builders
// ============================================================

/**
 * Create a section block
 */
export function section(options: BlockBuilderInput = {}): BlockBuilder {
  return new BlockBuilder("section", options)
}

/**
 * Create a div block
 */
export function div(options: BlockBuilderInput = {}): BlockBuilder {
  return new BlockBuilder("div", options)
}

/**
 * Create a header block
 */
export function header(options: BlockBuilderInput = {}): BlockBuilder {
  return new BlockBuilder("header", options)
}

/**
 * Create a footer block
 */
export function footer(options: BlockBuilderInput = {}): BlockBuilder {
  return new BlockBuilder("footer", options)
}

/**
 * Create a nav block
 */
export function nav(options: BlockBuilderInput = {}): BlockBuilder {
  return new BlockBuilder("nav", options)
}

/**
 * Create a main block
 */
export function main(options: BlockBuilderInput = {}): BlockBuilder {
  return new BlockBuilder("main", options)
}

/**
 * Create an aside block
 */
export function aside(options: BlockBuilderInput = {}): BlockBuilder {
  return new BlockBuilder("aside", options)
}

/**
 * Create an article block
 */
export function article(options: BlockBuilderInput = {}): BlockBuilder {
  return new BlockBuilder("article", options)
}

// ============================================================
// Flex & Grid Builders
// ============================================================

/**
 * Create a flex container
 */
export function flex(options: FlexInput = {}): BlockBuilder {
  const classes: string[] = ["flex"]

  if (options.direction === "col") classes.push("flex-col")
  else if (options.direction === "row-reverse") classes.push("flex-row-reverse")
  else if (options.direction === "col-reverse") classes.push("flex-col-reverse")

  if (options.justify === "center") classes.push("justify-center")
  else if (options.justify === "end") classes.push("justify-end")
  else if (options.justify === "between") classes.push("justify-between")
  else if (options.justify === "around") classes.push("justify-around")
  else if (options.justify === "evenly") classes.push("justify-evenly")

  if (options.align === "center") classes.push("items-center")
  else if (options.align === "start") classes.push("items-start")
  else if (options.align === "end") classes.push("items-end")
  else if (options.align === "stretch") classes.push("items-stretch")
  else if (options.align === "baseline") classes.push("items-baseline")

  if (options.wrap) classes.push("flex-wrap")

  if (options.gap !== undefined) {
    classes.push(typeof options.gap === "number" ? `gap-${options.gap}` : options.gap)
  }

  if (options.className) classes.push(options.className)

  return new BlockBuilder("div", { ...options, className: classes.join(" ") })
}

/**
 * Create a grid container
 */
export function grid(options: GridInput = {}): BlockBuilder {
  const classes: string[] = ["grid"]

  if (options.cols !== undefined) {
    classes.push(typeof options.cols === "number" ? `grid-cols-${options.cols}` : options.cols)
  }

  if (options.rows !== undefined) {
    classes.push(typeof options.rows === "number" ? `grid-rows-${options.rows}` : options.rows)
  }

  if (options.gap !== undefined) {
    classes.push(typeof options.gap === "number" ? `gap-${options.gap}` : options.gap)
  }

  if (options.className) classes.push(options.className)

  return new BlockBuilder("div", { ...options, className: classes.join(" ") })
}

/**
 * Create a vertical stack (flex-col with gap)
 */
export function stack(options: Omit<FlexInput, "direction"> = {}): BlockBuilder {
  return flex({ ...options, direction: "col" })
}

/**
 * Create a horizontal row (flex-row with gap)
 */
export function row(options: Omit<FlexInput, "direction"> = {}): BlockBuilder {
  return flex({ ...options, direction: "row" })
}

// ============================================================
// Typography Builders
// ============================================================

/**
 * Create a heading block
 */
export function heading(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  text: string,
  options: BlockBuilderInput = {}
): Block {
  const tag = `h${level}` as BlockTag
  return {
    id: options.id || generateId(),
    tag,
    className: options.className || "",
    textContent: text,
    attrs: options.attrs,
    animation: options.animation,
    label: options.label,
    hidden: options.hidden,
    locked: options.locked,
  }
}

/** Shorthand for h1 */
export function h1(text: string, options: BlockBuilderInput = {}): Block {
  return heading(1, text, options)
}

/** Shorthand for h2 */
export function h2(text: string, options: BlockBuilderInput = {}): Block {
  return heading(2, text, options)
}

/** Shorthand for h3 */
export function h3(text: string, options: BlockBuilderInput = {}): Block {
  return heading(3, text, options)
}

/** Shorthand for h4 */
export function h4(text: string, options: BlockBuilderInput = {}): Block {
  return heading(4, text, options)
}

/** Shorthand for h5 */
export function h5(text: string, options: BlockBuilderInput = {}): Block {
  return heading(5, text, options)
}

/** Shorthand for h6 */
export function h6(text: string, options: BlockBuilderInput = {}): Block {
  return heading(6, text, options)
}

/**
 * Create a paragraph block
 */
export function text(content: string, options: BlockBuilderInput = {}): Block {
  return {
    id: options.id || generateId(),
    tag: "p",
    className: options.className || "",
    textContent: content,
    attrs: options.attrs,
    animation: options.animation,
    label: options.label,
    hidden: options.hidden,
    locked: options.locked,
  }
}

/** Alias for text() */
export const p = text

/**
 * Create a span block
 */
export function span(content: string, options: BlockBuilderInput = {}): Block {
  return {
    id: options.id || generateId(),
    tag: "span",
    className: options.className || "",
    textContent: content,
    attrs: options.attrs,
    animation: options.animation,
    label: options.label,
  }
}

// ============================================================
// Interactive Builders
// ============================================================

/**
 * Create a link block
 */
export function link(
  href: string,
  text: string,
  options: BlockBuilderInput = {}
): Block {
  return {
    id: options.id || generateId(),
    tag: "a",
    className: options.className || "",
    textContent: text,
    attrs: { href, ...options.attrs },
    animation: options.animation,
    label: options.label,
    hidden: options.hidden,
    locked: options.locked,
  }
}

/** Alias for link() */
export const a = link

/**
 * Create a button block
 */
export function button(
  text: string,
  options: BlockBuilderInput = {}
): Block {
  return {
    id: options.id || generateId(),
    tag: "button",
    className: options.className || "",
    textContent: text,
    attrs: { type: "button", ...options.attrs },
    animation: options.animation,
    label: options.label,
    hidden: options.hidden,
    locked: options.locked,
  }
}

// ============================================================
// Media Builders
// ============================================================

/**
 * Create an image block
 */
export function image(
  src: string,
  alt: string,
  options: BlockBuilderInput = {}
): Block {
  return {
    id: options.id || generateId(),
    tag: "img",
    className: options.className || "",
    attrs: { src, alt, ...options.attrs },
    animation: options.animation,
    label: options.label,
    hidden: options.hidden,
    locked: options.locked,
  }
}

/** Alias for image() */
export const img = image

/**
 * Create a video block
 */
export function video(
  src: string,
  options: BlockBuilderInput & { poster?: string; autoplay?: boolean; loop?: boolean; muted?: boolean } = {}
): Block {
  const attrs: Record<string, string> = { src, ...options.attrs }
  if (options.poster) attrs.poster = options.poster
  if (options.autoplay) attrs.autoplay = "true"
  if (options.loop) attrs.loop = "true"
  if (options.muted) attrs.muted = "true"

  return {
    id: options.id || generateId(),
    tag: "video",
    className: options.className || "",
    attrs,
    animation: options.animation,
    label: options.label,
    hidden: options.hidden,
    locked: options.locked,
  }
}

// ============================================================
// List Builders
// ============================================================

/**
 * Create an unordered list
 */
export function ul(items: (string | Block)[], options: BlockBuilderInput = {}): Block {
  return {
    id: options.id || generateId(),
    tag: "ul",
    className: options.className || "",
    children: items.map(item =>
      typeof item === "string"
        ? { id: generateId(), tag: "li" as BlockTag, className: "", textContent: item }
        : item
    ),
    attrs: options.attrs,
    animation: options.animation,
    label: options.label,
  }
}

/**
 * Create an ordered list
 */
export function ol(items: (string | Block)[], options: BlockBuilderInput = {}): Block {
  return {
    id: options.id || generateId(),
    tag: "ol",
    className: options.className || "",
    children: items.map(item =>
      typeof item === "string"
        ? { id: generateId(), tag: "li" as BlockTag, className: "", textContent: item }
        : item
    ),
    attrs: options.attrs,
    animation: options.animation,
    label: options.label,
  }
}

/**
 * Create a list item
 */
export function li(content: string | Block, options: BlockBuilderInput = {}): Block {
  if (typeof content === "string") {
    return {
      id: options.id || generateId(),
      tag: "li",
      className: options.className || "",
      textContent: content,
      attrs: options.attrs,
    }
  }
  return {
    id: options.id || generateId(),
    tag: "li",
    className: options.className || "",
    children: [content],
    attrs: options.attrs,
  }
}

// ============================================================
// Form Builders
// ============================================================

/**
 * Create a form block
 */
export function form(options: BlockBuilderInput = {}): BlockBuilder {
  return new BlockBuilder("form", options)
}

/**
 * Create an input block
 */
export function input(
  type: string = "text",
  options: BlockBuilderInput & { placeholder?: string; name?: string; required?: boolean } = {}
): Block {
  const attrs: Record<string, string> = { type, ...options.attrs }
  if (options.placeholder) attrs.placeholder = options.placeholder
  if (options.name) attrs.name = options.name
  if (options.required) attrs.required = "true"

  return {
    id: options.id || generateId(),
    tag: "input",
    className: options.className || "",
    attrs,
    label: options.label,
  }
}

/**
 * Create a textarea block
 */
export function textarea(
  options: BlockBuilderInput & { placeholder?: string; name?: string; rows?: number } = {}
): Block {
  const attrs: Record<string, string> = { ...options.attrs }
  if (options.placeholder) attrs.placeholder = options.placeholder
  if (options.name) attrs.name = options.name
  if (options.rows) attrs.rows = String(options.rows)

  return {
    id: options.id || generateId(),
    tag: "textarea",
    className: options.className || "",
    attrs,
    label: options.label,
  }
}

/**
 * Create a label block
 */
export function label(
  text: string,
  options: BlockBuilderInput & { htmlFor?: string } = {}
): Block {
  const attrs: Record<string, string> = { ...options.attrs }
  if (options.htmlFor) attrs.for = options.htmlFor

  return {
    id: options.id || generateId(),
    tag: "label",
    className: options.className || "",
    textContent: text,
    attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
    label: options.label,
  }
}

// ============================================================
// Misc Builders
// ============================================================

/**
 * Create a horizontal rule
 */
export function hr(options: BlockBuilderInput = {}): Block {
  return {
    id: options.id || generateId(),
    tag: "hr",
    className: options.className || "",
    attrs: options.attrs,
  }
}

/**
 * Create a blockquote
 */
export function blockquote(
  content: string | Block[],
  options: BlockBuilderInput = {}
): Block {
  if (typeof content === "string") {
    return {
      id: options.id || generateId(),
      tag: "blockquote",
      className: options.className || "",
      textContent: content,
      attrs: options.attrs,
      animation: options.animation,
      label: options.label,
    }
  }
  return {
    id: options.id || generateId(),
    tag: "blockquote",
    className: options.className || "",
    children: content,
    attrs: options.attrs,
    animation: options.animation,
    label: options.label,
  }
}

/**
 * Create a figure with optional caption
 */
export function figure(
  content: Block,
  caption?: string,
  options: BlockBuilderInput = {}
): Block {
  const children: Block[] = [content]
  if (caption) {
    children.push({
      id: generateId(),
      tag: "figcaption",
      className: "",
      textContent: caption,
    })
  }

  return {
    id: options.id || generateId(),
    tag: "figure",
    className: options.className || "",
    children,
    attrs: options.attrs,
    animation: options.animation,
    label: options.label,
  }
}
