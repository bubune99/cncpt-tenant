/**
 * Save Template Tool
 *
 * Saves the converted Block template to the database.
 * Updated to use Block format instead of Puck.
 */

import type { Block } from "@/lib/cms/block-editor/types"
import { CONTAINER_TAGS, LEAF_TAGS } from "@/lib/cms/block-editor/types"
import type { AgentToolResult, BlockTemplate } from "../types"

interface SaveTemplateInput {
  name: string
  description: string
  category: string
  tags?: string[]
  blocks: Block[]
  sourceUrl?: string
  thumbnail?: string
}

interface SaveTemplateOutput {
  id: string
  name: string
  slug: string
  url: string
}

interface UpdateTemplateInput {
  id: string
  updates: Partial<SaveTemplateInput>
}

const ALL_TAGS = [...CONTAINER_TAGS, ...LEAF_TAGS]

/**
 * Tool to save a new Block template
 */
export const saveTemplateTool = {
  name: "save_template",
  description: `Saves the converted component as a Block template in the database.
The template can then be used in the page builder.

IMPORTANT: This expects Block format (tag, className, children), NOT Puck format (type, props, slots).

Example input:
{
  "name": "Hero Section",
  "description": "A hero section with title and CTA",
  "category": "Hero",
  "blocks": [
    {
      "id": "sec-001",
      "tag": "section",
      "className": "py-20 px-4 bg-slate-950",
      "children": [
        { "id": "h1-001", "tag": "h1", "className": "text-5xl font-bold text-white", "textContent": "Welcome" }
      ]
    }
  ]
}`,

  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Template name (e.g., 'Pricing Card', 'Hero Section')",
      },
      description: {
        type: "string",
        description: "Brief description of what the template is for",
      },
      category: {
        type: "string",
        description: "Template category (e.g., 'Hero', 'Cards', 'Pricing', 'Testimonials')",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for search/filtering",
      },
      blocks: {
        type: "array",
        description: "Array of Block objects (the template content)",
      },
      sourceUrl: {
        type: "string",
        description: "Original v0.dev URL if applicable",
      },
      thumbnail: {
        type: "string",
        description: "Optional thumbnail image URL",
      },
    },
    required: ["name", "description", "category", "blocks"],
  },

  async execute(input: SaveTemplateInput): Promise<AgentToolResult<SaveTemplateOutput>> {
    try {
      // Validate the blocks
      const validationResult = validateBlocks(input.blocks)
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Invalid blocks: ${validationResult.errors.join(", ")}`,
        }
      }

      // Extract metadata from the blocks
      const tagsUsed = extractTagsUsed(input.blocks)
      const assetCount = countAssets(input.blocks)

      // Generate slug
      const slug = generateSlug(input.name)

      // Save to database via API
      const response = await fetch("/api/cms/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: input.name,
          slug,
          description: input.description,
          category: input.category,
          tags: input.tags || [],
          content: {
            version: "2.0",
            blocks: input.blocks,
          },
          sourceUrl: input.sourceUrl,
          thumbnail: input.thumbnail,
          metadata: {
            tagsUsed,
            assetCount,
            source: "v0-import",
            format: "block", // Mark as new Block format
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: `Failed to save template: ${error.message || response.statusText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: {
          id: result.id,
          name: result.name,
          slug: result.slug,
          url: `/admin/templates/${result.id}`,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to save template: ${(error as Error).message}`,
      }
    }
  },
}

/**
 * Tool to update an existing template
 */
export const updateTemplateTool = {
  name: "update_template",
  description: `Updates an existing Block template in the database.
Use this to fix or improve a previously saved template.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "string",
        description: "The template ID to update",
      },
      updates: {
        type: "object",
        description: "Fields to update (name, description, category, tags, blocks)",
      },
    },
    required: ["id", "updates"],
  },

  async execute(input: UpdateTemplateInput): Promise<AgentToolResult<SaveTemplateOutput>> {
    try {
      // Validate if blocks are being updated
      if (input.updates.blocks) {
        const validationResult = validateBlocks(input.updates.blocks)
        if (!validationResult.valid) {
          return {
            success: false,
            error: `Invalid blocks: ${validationResult.errors.join(", ")}`,
          }
        }
      }

      // Prepare update payload
      const updatePayload: Record<string, unknown> = { ...input.updates }
      if (input.updates.blocks) {
        updatePayload.content = {
          version: "2.0",
          blocks: input.updates.blocks,
        }
        delete updatePayload.blocks
      }

      // Update via API
      const response = await fetch(`/api/cms/templates/${input.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: `Failed to update template: ${error.message || response.statusText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: {
          id: result.id,
          name: result.name,
          slug: result.slug,
          url: `/admin/templates/${result.id}`,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update template: ${(error as Error).message}`,
      }
    }
  },
}

/**
 * Helper functions
 */

interface ValidationResult {
  valid: boolean
  errors: string[]
}

function validateBlocks(blocks: Block[]): ValidationResult {
  const errors: string[] = []

  function validate(block: Block, path: string) {
    // Check required fields
    if (!block.id) {
      errors.push(`Missing id at ${path}`)
    }

    if (!block.tag) {
      errors.push(`Missing tag at ${path}`)
    } else if (!ALL_TAGS.includes(block.tag)) {
      errors.push(`Invalid tag "${block.tag}" at ${path}`)
    }

    if (typeof block.className !== "string") {
      errors.push(`Missing className at ${path}`)
    }

    // Check leaf tags don't have children
    if (LEAF_TAGS.includes(block.tag) && block.children?.length) {
      errors.push(`Leaf tag "${block.tag}" cannot have children at ${path}`)
    }

    // Validate children recursively
    if (block.children) {
      block.children.forEach((child, index) => {
        validate(child, `${path}.children[${index}]`)
      })
    }
  }

  blocks.forEach((block, i) => validate(block, `blocks[${i}]`))

  return {
    valid: errors.length === 0,
    errors,
  }
}

function extractTagsUsed(blocks: Block[]): string[] {
  const tags = new Set<string>()

  function collect(block: Block) {
    tags.add(block.tag)
    if (block.children) {
      block.children.forEach(collect)
    }
  }

  blocks.forEach(collect)
  return Array.from(tags)
}

function countAssets(blocks: Block[]): number {
  let count = 0

  function traverse(block: Block) {
    // Check for asset in attrs
    if (block.attrs?.src) {
      count++
    }
    // Check for background image
    if (block.background?.url) {
      count++
    }
    // Recurse
    if (block.children) {
      block.children.forEach(traverse)
    }
  }

  blocks.forEach(traverse)
  return count
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50)
}

export default { saveTemplateTool, updateTemplateTool }
