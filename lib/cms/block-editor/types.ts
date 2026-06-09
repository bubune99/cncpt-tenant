/* ------------------------------------------------------------------ */
/*  Block Types – className-driven architecture                        */
/*  Each block = an HTML element with Tailwind classes.                */
/*  The AI writes JSX naturally; the user manipulates classes in the   */
/*  properties panel. No more fixed property schema.                   */
/* ------------------------------------------------------------------ */

/** Known HTML tags with full editor support (palette, properties panel, etc.) */
export const KNOWN_TAGS = [
  "div", "section", "header", "footer", "main", "nav", "aside", "article",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "span", "a", "img", "button",
  "ul", "ol", "li", "hr",
  "blockquote", "figure", "figcaption",
  "form", "input", "textarea", "label",
  "video", "svg",
  "iframe", "select", "option",
  "pre", "code", "table", "details", "summary",
] as const

export type KnownTag = typeof KNOWN_TAGS[number]

/**
 * Block tag — any string is valid (supports custom components like "MyButton",
 * "motion.div", etc.), but known HTML tags get full editor features.
 */
export type BlockTag = KnownTag | (string & {})

/**
 * A block in the new className-driven system.
 *
 * - `tag`         – the HTML element to render
 * - `className`   – full Tailwind class string (the AI writes these natively)
 * - `textContent` – the inner text for leaf nodes (headings, paragraphs, buttons, etc.)
 * - `attrs`       – any HTML attributes (src, href, alt, placeholder, type, etc.)
 * - `children`    – nested blocks (container blocks)
 * - `parentId`    – internal reference for tree management
 */
/** Framer-motion animation data preserved during import/export */
export interface BlockAnimation {
  type?:
    // Simple presets (direct motion props)
    | "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scale"
    // Interactive — Cursor
    | "tilt3d" | "mouseGlow" | "magnetic" | "spotlight" | "parallaxDepth"
    // Interactive — Autonomous
    | "floatIdle" | "morphBlob" | "marquee"
    // Interactive — Text/Scroll
    | "textReveal" | "countUp" | "textPath"
    // Escape hatch
    | "custom"
  trigger?: "onMount" | "inView" | "hover"
  duration?: number
  delay?: number
  custom?: {
    initial?: Record<string, unknown>
    animate?: Record<string, unknown>
    whileInView?: Record<string, unknown>
    whileHover?: Record<string, unknown>
    transition?: Record<string, unknown>
  }
  /** Config specific to interactive presets */
  interactiveConfig?: Record<string, unknown>
}

/** Set of animation types that use wrapper components instead of direct motion props */
export const INTERACTIVE_ANIMATION_TYPES = new Set([
  "tilt3d", "mouseGlow", "magnetic", "spotlight", "parallaxDepth",
  "floatIdle", "morphBlob", "marquee",
  "textReveal", "countUp", "textPath",
])

export function isInteractiveAnimation(type: string | undefined): boolean {
  return !!type && INTERACTIVE_ANIMATION_TYPES.has(type)
}

/** Device visibility configuration for responsive design */
export interface BlockResponsive {
  hidden?: {
    desktop?: boolean
    tablet?: boolean
    mobile?: boolean
  }
}

/** Background image configuration for container blocks */
export interface BlockBackground {
  url: string
  size?: "cover" | "contain" | "auto"
  position?: "center" | "top" | "bottom" | "left" | "right"
  attachment?: "scroll" | "fixed" // fixed = parallax effect
  overlay?: string // e.g. "rgba(0,0,0,0.5)" or "linear-gradient(to bottom, transparent, black)"
}

export interface Block {
  id: string
  tag: BlockTag
  className: string
  textContent?: string
  attrs?: Record<string, string>
  children?: Block[]
  parentId?: string | null
  /** Framer-motion animation data (preserved for import/export round-trip) */
  animation?: BlockAnimation
  /** Background image configuration for containers */
  background?: BlockBackground
  /** Human-readable label for the outline panel (editor-only metadata) */
  label?: string
  /** Hidden from canvas rendering (for design iteration) */
  hidden?: boolean
  /** Locked from editing (prevents accidental changes) */
  locked?: boolean
  /** Device visibility — hide block on specific breakpoints */
  responsive?: BlockResponsive
  /** Commerce-specific binding (for Hydrogen export) */
  commerce?: CommerceBinding
  /** The component name this block maps to (e.g., "ProductCard", "CartButton") */
  componentName?: string
  /** Framework requirement - if set, block only exports to this framework */
  frameworkRequirement?: ExportFramework
  /** ID of the shared Partial record this block references */
  partialId?: string
  /** Per-block overrides applied on top of the partial's blocks (keyed by block ID) */
  partialOverrides?: Record<string, Partial<Pick<Block, 'textContent' | 'className' | 'attrs'>>>
  /** Data bindings — maps block fields to runtime expressions.
   *  Keys are field paths: "textContent", "attrs.src", "attrs.href", "className", etc.
   *  Values are expression strings: "product.title", "collection.image.url", etc.
   *  When bindings are present, the static field value serves as the editor placeholder. */
  bindings?: Record<string, string>
  /** Interactive overlay/popup configuration.
   *  When present, this block is a trigger that opens overlay content on click/hover.
   *  The overlay content is stored as Block[] and rendered with JS state management. */
  interaction?: BlockInteraction
}

/** Types of interactive overlay behaviors */
export type InteractionType = "sheet" | "dialog" | "popover" | "dropdown" | "tooltip" | "collapsible" | "alert-dialog"

/** Interactive overlay configuration — stores trigger + content as blocks */
export interface BlockInteraction {
  /** The type of overlay behavior */
  type: InteractionType
  /** How the overlay is activated */
  trigger: "click" | "hover"
  /** The overlay content blocks (what appears when triggered) */
  content: Block[]
  /** Overlay-specific config */
  config?: {
    /** Sheet side: "left" | "right" | "top" | "bottom" */
    side?: string
    /** Dialog/popover alignment */
    align?: string
    /** Whether to close on outside click */
    closeOnOutsideClick?: boolean
    /** Title for accessible overlays (Sheet, Dialog) */
    title?: string
    /** Description for accessible overlays */
    description?: string
  }
}

/** Categories for the block palette */
export type BlockCategory = "layout" | "typography" | "media" | "interactive" | "form" | "commerce" | "smart-commerce" | "smart-dashboard" | "partials"

/** Supported export frameworks */
export type ExportFramework = "react" | "hydrogen" | "nextjs"

/** Supported payment/commerce providers */
export type CommerceProvider =
  | "generic"      // No specific provider - uses CMS data bindings
  | "shopify"      // Shopify Storefront API (Hydrogen)
  | "stripe"       // Stripe Checkout / Payment Links
  | "paypal"       // PayPal Checkout
  | "snipcart"     // Snipcart (headless cart)
  | "medusa"       // Medusa.js
  | "saleor"       // Saleor

/** Commerce-specific data binding */
export interface CommerceBinding {
  /** The type of commerce element */
  type: "product" | "collection" | "cart" | "customer" | "checkout" | "price"
  /** Commerce provider (defaults to generic for CMS flexibility) */
  provider?: CommerceProvider
  /** Product/Collection handle or ID - can use CMS variable syntax like {{product.id}} */
  handle?: string
  /** GraphQL query fragment name (Shopify/Saleor) */
  queryFragment?: string
  /** Number of items to fetch (for grids) */
  limit?: number
  /** Sort key for collections */
  sortKey?: "BEST_SELLING" | "CREATED_AT" | "PRICE" | "TITLE"
  /** Reverse sort order */
  reverse?: boolean
  /** Price ID for Stripe */
  stripePriceId?: string
  /** Payment mode for Stripe */
  stripeMode?: "payment" | "subscription"
  /** CMS field binding - maps to dynamic content */
  cmsBinding?: {
    collection?: string  // e.g., "products", "pricing_plans"
    field?: string       // e.g., "price", "title", "image"
    filter?: string      // e.g., "featured=true"
  }
}

/** Template entry for the block palette */
export interface BlockTemplate {
  label: string
  tag: BlockTag
  icon: string
  category: BlockCategory
  defaultClassName: string
  defaultTextContent?: string
  defaultAttrs?: Record<string, string>
  /** If true, this block can contain children */
  isContainer: boolean
  /** Framework requirement - if set, block only available for this framework */
  frameworkRequirement?: ExportFramework
  /** Commerce provider requirement - if set, shows provider badge */
  commerceProvider?: CommerceProvider
  /** Default commerce binding for commerce blocks */
  defaultCommerce?: CommerceBinding
  /** Component name for framework-specific export */
  componentName?: string
  /** Description shown in palette tooltip */
  description?: string
}

export const KNOWN_TAGS_SET = new Set<string>(KNOWN_TAGS)

/** Check if a tag is a known HTML tag with full editor support */
export function isKnownTag(tag: string): tag is KnownTag {
  return KNOWN_TAGS_SET.has(tag)
}

/** Tags that are containers by default */
export const CONTAINER_TAGS: string[] = [
  "div",
  "section",
  "header",
  "footer",
  "main",
  "nav",
  "aside",
  "article",
  "ul",
  "ol",
  "li",
  "figure",
  "form",
  "blockquote",
  "select",
  "details",
  "table",
]

/** Tags that are always leaves (no nesting) */
export const LEAF_TAGS: string[] = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "span", "a", "img", "button",
  "hr", "input", "textarea", "label",
  "video", "svg", "figcaption",
  "iframe", "option",
]

/**
 * Determine if a tag is a container.
 * Known container tags return true. Unknown/custom component tags
 * are treated as containers (they likely wrap children).
 */
export function isContainerTag(tag: BlockTag): boolean {
  if (CONTAINER_TAGS.includes(tag)) return true
  // Custom component tags (e.g., "MyCard", "Section") are treated as containers
  if (!isKnownTag(tag)) return true
  return false
}

export interface DragState {
  blockId: string | null
  sourceParentId: string | null
  targetParentId: string | null
  targetIndex: number
  isPaletteItem: boolean
  paletteTag?: BlockTag
}

/** Global layout configuration for header/footer */
export interface PageLayout {
  header: "global" | "custom" | "none"
  footer: "global" | "custom" | "none"
  customHeader?: Block[]
  customFooter?: Block[]
}

export interface PageDocument {
  version: string
  blocks: Block[]
  layout?: PageLayout
  /** Global header blocks (shared across pages) */
  globalHeader?: Block[]
  /** Global footer blocks (shared across pages) */
  globalFooter?: Block[]
}
