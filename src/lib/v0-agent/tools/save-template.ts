/**
 * Save Template Tool
 *
 * Saves the converted Puck template to the database
 */

import { AgentToolResult, PuckTemplate, ComponentNode } from "../types";

interface SaveTemplateInput {
  name: string;
  description: string;
  category: string;
  tags?: string[];
  root: ComponentNode;
  sourceUrl?: string;
  thumbnail?: string;
}

interface SaveTemplateOutput {
  id: string;
  name: string;
  slug: string;
  url: string;
}

interface UpdateTemplateInput {
  id: string;
  updates: Partial<SaveTemplateInput>;
}

/**
 * Tool to save a new template
 */
export const saveTemplateTool = {
  name: "save_puck_template",
  description: `Saves the converted component as a Puck template in the database.
The template can then be used in the page builder.
Returns the template ID and URL for accessing it.`,

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
        description:
          "Template category (e.g., 'Hero', 'Cards', 'Pricing', 'Testimonials')",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for search/filtering",
      },
      root: {
        type: "object",
        description: "The root ComponentNode of the template",
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
    required: ["name", "description", "category", "root"],
  },

  async execute(
    input: SaveTemplateInput
  ): Promise<AgentToolResult<SaveTemplateOutput>> {
    try {
      // Validate the component tree
      const validationResult = validateComponentTree(input.root);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Invalid component tree: ${validationResult.errors.join(", ")}`,
        };
      }

      // Extract metadata from the tree
      const primitivesUsed = extractPrimitivesUsed(input.root);
      const assetCount = countAssets(input.root);

      // Generate slug
      const slug = generateSlug(input.name);

      // Save to database via API
      const response = await fetch("/api/templates", {
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
          content: input.root,
          sourceUrl: input.sourceUrl,
          thumbnail: input.thumbnail,
          metadata: {
            primitivesUsed,
            assetCount,
            source: "v0-import",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: `Failed to save template: ${error.message || response.statusText}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          id: result.id,
          name: result.name,
          slug: result.slug,
          url: `/admin/templates/${result.id}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save template: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * Tool to update an existing template
 */
export const updateTemplateTool = {
  name: "update_puck_template",
  description: `Updates an existing Puck template in the database.
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
        description: "Fields to update (name, description, category, tags, root)",
      },
    },
    required: ["id", "updates"],
  },

  async execute(
    input: UpdateTemplateInput
  ): Promise<AgentToolResult<SaveTemplateOutput>> {
    try {
      // Validate if root is being updated
      if (input.updates.root) {
        const validationResult = validateComponentTree(input.updates.root);
        if (!validationResult.valid) {
          return {
            success: false,
            error: `Invalid component tree: ${validationResult.errors.join(", ")}`,
          };
        }
      }

      // Update via API
      const response = await fetch(`/api/templates/${input.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input.updates),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: `Failed to update template: ${error.message || response.statusText}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          id: result.id,
          name: result.name,
          slug: result.slug,
          url: `/admin/templates/${result.id}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update template: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * Helper functions
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateComponentTree(node: ComponentNode): ValidationResult {
  const errors: string[] = [];

  function validate(n: ComponentNode, path: string) {
    // Check required fields
    if (!n.type) {
      errors.push(`Missing type at ${path}`);
    }

    if (!n.props) {
      errors.push(`Missing props at ${path}`);
    }

    // Validate slots recursively
    if (n.slots) {
      for (const [slotName, children] of Object.entries(n.slots)) {
        if (Array.isArray(children)) {
          children.forEach((child, index) => {
            validate(child, `${path}.slots.${slotName}[${index}]`);
          });
        }
      }
    }
  }

  validate(node, "root");

  return {
    valid: errors.length === 0,
    errors,
  };
}

function extractPrimitivesUsed(node: ComponentNode): string[] {
  const primitives = new Set<string>();

  function collect(n: ComponentNode) {
    primitives.add(n.type);

    if (n.slots) {
      for (const children of Object.values(n.slots)) {
        if (Array.isArray(children)) {
          children.forEach(collect);
        }
      }
    }
  }

  collect(node);
  return Array.from(primitives);
}

function countAssets(node: ComponentNode): number {
  let count = 0;

  function traverse(n: ComponentNode) {
    // Check for asset props
    if (n.props) {
      if (n.props.src && typeof n.props.src === "string") {
        count++;
      }
      if (n.props.backgroundImage && typeof n.props.backgroundImage === "string") {
        count++;
      }
    }

    if (n.slots) {
      for (const children of Object.values(n.slots)) {
        if (Array.isArray(children)) {
          children.forEach(traverse);
        }
      }
    }
  }

  traverse(node);
  return count;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

export default { saveTemplateTool, updateTemplateTool };
