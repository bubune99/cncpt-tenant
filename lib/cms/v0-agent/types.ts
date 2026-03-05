/**
 * v0 Import Agent Types
 *
 * Updated to use Block format instead of Puck primitives.
 */

// Re-export Block types from block-editor
export type {
  Block,
  BlockTag,
  BlockAnimation,
  BlockBackground,
  PageDocument,
} from "@/lib/cms/block-editor/types"

// Parsed v0 component analysis
export interface V0ComponentAnalysis {
  name: string
  description: string
  blocks: Block[]
  assets: ExtractedAsset[]
  dependencies: string[]
  complexity: "simple" | "moderate" | "complex"
  warnings: string[]
}

// Asset extracted from component
export interface ExtractedAsset {
  originalUrl: string
  type: "image" | "svg" | "video" | "font"
  placeholder: string // Placeholder ID for replacement
  suggestedName: string
}

// Template output (Block format)
export interface BlockTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  thumbnail?: string

  // The actual Block content
  blocks: Block[]

  // Metadata
  sourceUrl?: string
  tagsUsed: string[]
  assetCount: number

  createdAt: Date
  updatedAt: Date
}

// Import request
export interface V0ImportRequest {
  url: string
  name?: string
  category?: string
  description?: string
}

// Import result
export interface V0ImportResult {
  success: boolean
  template?: BlockTemplate
  analysis?: V0ComponentAnalysis
  errors?: string[]
  warnings?: string[]
}

// Tool definitions for the agent
export interface AgentToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================
// Block Schema Information (for AI agent reference)
// ============================================================

export interface BlockSchemaInfo {
  containerTags: string[]
  leafTags: string[]
  allTags: string[]
  animationTypes: string[]
  animationTriggers: string[]
}

export const BLOCK_SCHEMA_INFO: BlockSchemaInfo = {
  containerTags: [
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
  ],
  leafTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "a",
    "img",
    "button",
    "hr",
    "input",
    "textarea",
    "label",
    "video",
    "svg",
    "figcaption",
  ],
  allTags: [
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
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "a",
    "img",
    "button",
    "hr",
    "input",
    "textarea",
    "label",
    "video",
    "svg",
    "figcaption",
  ],
  animationTypes: ["fadeIn", "slideUp", "slideDown", "slideLeft", "slideRight", "scale", "custom"],
  animationTriggers: ["onMount", "inView", "hover"],
}

// Import Block type for re-export
import type { Block } from "@/lib/cms/block-editor/types"
