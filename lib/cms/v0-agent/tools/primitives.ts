/**
 * Block Schema Tool
 *
 * Provides information about the Block format and valid tags.
 * Replaces the old Puck primitives tool.
 *
 * The page builder uses native HTML tags + Tailwind classes,
 * NOT abstract primitives like "Container", "Heading", etc.
 */

import { CONTAINER_TAGS, LEAF_TAGS, type BlockTag } from "@/lib/cms/block-editor/types"
import type { AgentToolResult } from "../types"

// ============================================================
// Block Schema Types
// ============================================================

interface TagInfo {
  tag: BlockTag
  type: "container" | "leaf"
  description: string
  canHaveChildren: boolean
  commonAttributes?: string[]
  commonClasses?: string[]
}

interface BlockSchemaOutput {
  containerTags: TagInfo[]
  leafTags: TagInfo[]
  animationTypes: string[]
  animationTriggers: string[]
  example: string
}

interface GetTagInfoInput {
  tag: string
}

// ============================================================
// Tag Information
// ============================================================

const TAG_INFO: Record<BlockTag, Omit<TagInfo, "tag" | "type" | "canHaveChildren">> = {
  // Container tags
  div: {
    description: "Generic container for grouping and layout",
    commonClasses: ["flex", "grid", "p-4", "gap-4", "rounded-lg", "bg-white", "shadow"],
  },
  section: {
    description: "Semantic section of a page (hero, features, pricing, etc.)",
    commonClasses: ["py-20", "px-6", "min-h-screen", "bg-slate-950"],
  },
  header: {
    description: "Page or section header",
    commonClasses: ["fixed", "top-0", "z-50", "px-6", "py-4", "bg-white/80", "backdrop-blur"],
  },
  footer: {
    description: "Page footer",
    commonClasses: ["py-12", "px-6", "bg-slate-900", "text-white"],
  },
  main: {
    description: "Main content area of a page",
    commonClasses: ["min-h-screen", "pt-20"],
  },
  nav: {
    description: "Navigation container",
    commonClasses: ["flex", "items-center", "gap-8"],
  },
  aside: {
    description: "Sidebar or auxiliary content",
    commonClasses: ["w-64", "p-4", "border-r"],
  },
  article: {
    description: "Self-contained content (blog post, product card)",
    commonClasses: ["prose", "max-w-2xl"],
  },
  ul: {
    description: "Unordered list",
    commonClasses: ["space-y-2", "list-disc", "pl-5"],
  },
  ol: {
    description: "Ordered list",
    commonClasses: ["space-y-2", "list-decimal", "pl-5"],
  },
  li: {
    description: "List item",
    commonClasses: ["flex", "items-center", "gap-2"],
  },
  figure: {
    description: "Image with caption",
    commonClasses: ["max-w-2xl", "mx-auto"],
  },
  form: {
    description: "Form container",
    commonClasses: ["space-y-6", "max-w-md"],
    commonAttributes: ["action", "method"],
  },
  blockquote: {
    description: "Quoted content",
    commonClasses: ["border-l-4", "pl-4", "italic", "text-slate-600"],
  },

  // Leaf tags
  h1: {
    description: "Main page heading",
    commonClasses: ["text-5xl", "font-bold", "text-white"],
  },
  h2: {
    description: "Section heading",
    commonClasses: ["text-4xl", "font-bold", "text-slate-900"],
  },
  h3: {
    description: "Subsection heading",
    commonClasses: ["text-2xl", "font-semibold", "text-slate-900"],
  },
  h4: {
    description: "Minor heading",
    commonClasses: ["text-xl", "font-semibold", "text-slate-900"],
  },
  h5: {
    description: "Small heading",
    commonClasses: ["text-lg", "font-semibold", "text-slate-900"],
  },
  h6: {
    description: "Smallest heading",
    commonClasses: ["text-base", "font-semibold", "text-slate-900"],
  },
  p: {
    description: "Paragraph text",
    commonClasses: ["text-lg", "text-slate-600", "leading-relaxed"],
  },
  span: {
    description: "Inline text wrapper",
    commonClasses: ["text-sm", "font-medium"],
  },
  a: {
    description: "Link",
    commonClasses: ["text-blue-600", "hover:underline", "transition-colors"],
    commonAttributes: ["href", "target"],
  },
  img: {
    description: "Image",
    commonClasses: ["w-full", "h-auto", "rounded-lg", "object-cover"],
    commonAttributes: ["src", "alt", "width", "height"],
  },
  button: {
    description: "Clickable button",
    commonClasses: ["px-6", "py-3", "rounded-lg", "bg-blue-600", "text-white", "font-semibold", "hover:bg-blue-500"],
    commonAttributes: ["type", "disabled"],
  },
  hr: {
    description: "Horizontal rule/divider",
    commonClasses: ["border-slate-200", "my-8"],
  },
  input: {
    description: "Form input",
    commonClasses: ["w-full", "px-4", "py-3", "rounded-lg", "border", "border-slate-300"],
    commonAttributes: ["type", "name", "placeholder", "required"],
  },
  textarea: {
    description: "Multi-line text input",
    commonClasses: ["w-full", "px-4", "py-3", "rounded-lg", "border", "border-slate-300", "resize-none"],
    commonAttributes: ["name", "placeholder", "rows", "required"],
  },
  label: {
    description: "Form label",
    commonClasses: ["text-sm", "font-medium", "text-slate-700"],
    commonAttributes: ["for"],
  },
  video: {
    description: "Video element",
    commonClasses: ["w-full", "rounded-lg"],
    commonAttributes: ["src", "poster", "controls", "autoplay", "loop", "muted"],
  },
  svg: {
    description: "SVG graphic/icon",
    commonClasses: ["w-6", "h-6"],
    commonAttributes: ["viewBox", "fill", "stroke"],
  },
  figcaption: {
    description: "Figure caption",
    commonClasses: ["text-sm", "text-slate-500", "mt-2", "text-center"],
  },
}

// ============================================================
// Tool: List Block Schema
// ============================================================

export const listPrimitivesTool = {
  name: "list_block_schema",
  description: `Lists the Block schema - valid HTML tags and their usage.

The page builder uses native HTML tags + Tailwind classes, NOT abstract primitives.

CONTAINER TAGS (can have children): ${CONTAINER_TAGS.join(", ")}
LEAF TAGS (use textContent, no children): ${LEAF_TAGS.join(", ")}

Use this to understand what tags are available and how to use them.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        description: 'Filter by "container" or "leaf" tags',
        enum: ["container", "leaf"],
      },
    },
    required: [],
  },

  async execute(input: { category?: "container" | "leaf" }): Promise<AgentToolResult<BlockSchemaOutput>> {
    try {
      const containerTagInfo: TagInfo[] = CONTAINER_TAGS.map((tag) => ({
        tag,
        type: "container" as const,
        canHaveChildren: true,
        ...TAG_INFO[tag],
      }))

      const leafTagInfo: TagInfo[] = LEAF_TAGS.map((tag) => ({
        tag,
        type: "leaf" as const,
        canHaveChildren: false,
        ...TAG_INFO[tag],
      }))

      // Filter if category specified
      const filteredContainers = input.category === "leaf" ? [] : containerTagInfo
      const filteredLeaves = input.category === "container" ? [] : leafTagInfo

      return {
        success: true,
        data: {
          containerTags: filteredContainers,
          leafTags: filteredLeaves,
          animationTypes: ["fadeIn", "slideUp", "slideDown", "slideLeft", "slideRight", "scale"],
          animationTriggers: ["onMount", "inView", "hover"],
          example: `{
  "id": "sec-001",
  "tag": "section",
  "className": "py-20 px-6 bg-slate-950",
  "label": "Hero",
  "children": [
    {
      "id": "h1-001",
      "tag": "h1",
      "className": "text-5xl font-bold text-white text-center",
      "textContent": "Welcome to Our Platform"
    },
    {
      "id": "p-001",
      "tag": "p",
      "className": "text-xl text-white/60 mt-4 text-center",
      "textContent": "Build something amazing today."
    }
  ]
}`,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to list schema: ${(error as Error).message}`,
      }
    }
  },
}

// ============================================================
// Tool: Get Tag Info
// ============================================================

export const getPrimitiveTool = {
  name: "get_tag_info",
  description: `Gets detailed information about a specific HTML tag for the Block format.

Returns common Tailwind classes and attributes for the tag.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      tag: {
        type: "string",
        description: "The HTML tag to get info for (e.g., 'section', 'h1', 'button')",
      },
    },
    required: ["tag"],
  },

  async execute(input: GetTagInfoInput): Promise<AgentToolResult<TagInfo>> {
    try {
      const tag = input.tag.toLowerCase() as BlockTag
      const info = TAG_INFO[tag]

      if (!info) {
        return {
          success: false,
          error: `Unknown tag "${input.tag}". Valid tags: ${[...CONTAINER_TAGS, ...LEAF_TAGS].join(", ")}`,
        }
      }

      const isContainer = CONTAINER_TAGS.includes(tag)

      return {
        success: true,
        data: {
          tag,
          type: isContainer ? "container" : "leaf",
          canHaveChildren: isContainer,
          ...info,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to get tag info: ${(error as Error).message}`,
      }
    }
  },
}

export default { listPrimitivesTool, getPrimitiveTool }
