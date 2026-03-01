/* ------------------------------------------------------------------ */
/*  Block Types -- className-driven architecture                       */
/* ------------------------------------------------------------------ */

/** HTML tags the user or AI can pick for a block */
export type BlockTag =
  | "div"
  | "section"
  | "header"
  | "footer"
  | "main"
  | "nav"
  | "aside"
  | "article"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "a"
  | "img"
  | "button"
  | "ul"
  | "ol"
  | "li"
  | "hr"
  | "blockquote"
  | "figure"
  | "figcaption"
  | "form"
  | "input"
  | "textarea"
  | "label"
  | "video"
  | "svg"

/** Framer-motion animation data preserved during import/export */
export interface BlockAnimation {
  type?: "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scale" | "custom"
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
}

/** Background image configuration for container blocks */
export interface BlockBackground {
  url: string
  size?: "cover" | "contain" | "auto"
  position?: "center" | "top" | "bottom" | "left" | "right"
  attachment?: "scroll" | "fixed"
  overlay?: string
}

export interface Block {
  id: string
  tag: BlockTag
  className: string
  textContent?: string
  attrs?: Record<string, string>
  children?: Block[]
  parentId?: string | null
  animation?: BlockAnimation
  background?: BlockBackground
  label?: string
  hidden?: boolean
  locked?: boolean
  commerce?: CommerceBinding
  componentName?: string
  frameworkRequirement?: ExportFramework
  /** ID of the shared Partial record this block references */
  partialId?: string
  /** Per-block overrides applied on top of the partial's blocks (keyed by block ID) */
  partialOverrides?: Record<string, Partial<Pick<Block, 'textContent' | 'className' | 'attrs'>>>
}

/** Categories for the block palette */
export type BlockCategory = "layout" | "typography" | "media" | "interactive" | "form" | "commerce" | "smart-commerce" | "smart-dashboard" | "partials"

/** Supported export frameworks */
export type ExportFramework = "react" | "hydrogen" | "nextjs"

/** Supported payment/commerce providers */
export type CommerceProvider =
  | "generic"
  | "shopify"
  | "stripe"
  | "paypal"
  | "snipcart"
  | "medusa"
  | "saleor"

/** Commerce-specific data binding */
export interface CommerceBinding {
  type: "product" | "collection" | "cart" | "customer" | "checkout" | "price"
  provider?: CommerceProvider
  handle?: string
  queryFragment?: string
  limit?: number
  sortKey?: "BEST_SELLING" | "CREATED_AT" | "PRICE" | "TITLE"
  reverse?: boolean
  stripePriceId?: string
  stripeMode?: "payment" | "subscription"
  cmsBinding?: {
    collection?: string
    field?: string
    filter?: string
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
  isContainer: boolean
  frameworkRequirement?: ExportFramework
  commerceProvider?: CommerceProvider
  defaultCommerce?: CommerceBinding
  componentName?: string
  description?: string
}

/** Tags that are containers by default */
export const CONTAINER_TAGS: BlockTag[] = [
  "div", "section", "header", "footer", "main",
  "nav", "aside", "article", "ul", "ol", "li",
  "figure", "form", "blockquote",
]

/** Tags that are always leaves (no nesting) */
export const LEAF_TAGS: BlockTag[] = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "span", "a", "img", "button",
  "hr", "input", "textarea", "label",
  "video", "svg", "figcaption",
]

export function isContainerTag(tag: BlockTag): boolean {
  return CONTAINER_TAGS.includes(tag)
}
