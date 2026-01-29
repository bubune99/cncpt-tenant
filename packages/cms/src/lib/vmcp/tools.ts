/**
 * VMCP Management Tools
 *
 * Tools that allow the AI agent to create, edit, and manage its own tools.
 * Uses AI SDK v6 native needsApproval for human-in-the-loop approval.
 */

import { tool } from 'ai';
import { z } from 'zod';
import * as registry from './registry';
import { testTool } from './runtime';
import {
  isAutonomousMode,
  enableAutonomousMode,
  disableAutonomousMode,
  getVmcpSettings,
} from './permissions';
import type { JSONSchema } from './types';

// JSON Schema property type
interface JsonSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

// JSON Schema definition for tool inputs
const jsonSchemaPropertySchema: z.ZodType<JsonSchemaProperty> = z.lazy(() =>
  z.object({
    type: z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object']),
    description: z.string().optional(),
    default: z.unknown().optional(),
    enum: z.array(z.unknown()).optional(),
    items: jsonSchemaPropertySchema.optional(),
    properties: z.record(z.string(), jsonSchemaPropertySchema).optional(),
    required: z.array(z.string()).optional(),
  })
);

const jsonSchemaSchema = z.object({
  type: z.literal('object'),
  properties: z.record(z.string(), jsonSchemaPropertySchema),
  required: z.array(z.string()).optional(),
});

/**
 * Create a new dynamic tool
 * Uses native AI SDK v6 needsApproval for human-in-the-loop
 */
export const vmcp_create_tool = tool({
  description: `Create a new dynamic tool that can be used by the AI.

The handler is JavaScript code that receives 'input' and 'context' objects.
context.db provides: products, orders, customers, pages, blogPosts
context.utils provides: formatCurrency, formatDate, generateId, sendEmail

Example handler:
const product = await context.db.products.findUnique({ where: { sku: input.sku } });
return { success: true, product };`,

  inputSchema: z.object({
    name: z
      .string()
      .regex(/^[a-z][a-z0-9_]*$/)
      .describe('Tool name in snake_case (e.g., "get_product_details")'),
    description: z.string().describe('Clear description of what the tool does'),
    inputSchema: jsonSchemaSchema.describe('JSON Schema defining the input parameters'),
    handler: z.string().describe('JavaScript code to execute (async supported)'),
    category: z
      .enum(['data', 'content', 'commerce', 'email', 'analytics', 'utility'])
      .optional()
      .describe('Tool category'),
    tags: z.array(z.string()).optional().describe('Tags for searchability'),
  }),

  // Dynamic approval based on autonomous mode setting
  needsApproval: async () => !(await isAutonomousMode()),

  execute: async ({ name, description, inputSchema, handler, category, tags }) => {
    try {
      const primitive = await registry.createTool({
        name,
        description,
        inputSchema: inputSchema as JSONSchema,
        handler,
        category,
        tags,
      });

      return {
        success: true,
        message: `Tool "${name}" created successfully`,
        tool: {
          id: primitive.id,
          name: primitive.name,
          description: primitive.description,
          category: primitive.category,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Update an existing tool
 * Uses native AI SDK v6 needsApproval for human-in-the-loop
 */
export const vmcp_iterate_tool = tool({
  description: `Update an existing tool to improve or fix it.`,

  inputSchema: z.object({
    id: z.string().describe('Tool ID to update'),
    name: z.string().optional().describe('New name (snake_case)'),
    description: z.string().optional().describe('New description'),
    inputSchema: jsonSchemaSchema.optional().describe('New input schema'),
    handler: z.string().optional().describe('New handler code'),
    category: z.string().optional().describe('New category'),
    tags: z.array(z.string()).optional().describe('New tags'),
  }),

  // Dynamic approval based on autonomous mode setting
  needsApproval: async () => !(await isAutonomousMode()),

  execute: async ({ id, name, description, inputSchema, handler, category, tags }) => {
    try {
      const primitive = await registry.updateTool({
        id,
        name,
        description,
        inputSchema: inputSchema as JSONSchema | undefined,
        handler,
        category,
        tags,
      });

      return {
        success: true,
        message: `Tool "${primitive.name}" updated to version ${primitive.version}`,
        tool: {
          id: primitive.id,
          name: primitive.name,
          version: primitive.version,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Delete a tool from the registry
 * Uses native AI SDK v6 needsApproval for human-in-the-loop
 */
export const vmcp_delete_tool = tool({
  description: `Delete a tool from the registry. This action is irreversible.`,

  inputSchema: z.object({
    id: z.string().describe('Tool ID to delete'),
  }),

  // Dynamic approval based on autonomous mode setting
  needsApproval: async () => !(await isAutonomousMode()),

  execute: async ({ id }) => {
    try {
      await registry.deleteTool(id);
      return {
        success: true,
        message: 'Tool deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * List available tools (no approval required)
 */
export const vmcp_list_tools = tool({
  description: 'List all available dynamic tools in the registry',

  inputSchema: z.object({
    category: z.string().optional().describe('Filter by category'),
    enabledOnly: z.boolean().optional().default(true).describe('Only show enabled tools'),
    limit: z.number().optional().default(50).describe('Maximum number of results'),
  }),

  execute: async ({ category, enabledOnly, limit }) => {
    const tools = await registry.listTools({ category, enabledOnly, limit });

    return {
      count: tools.length,
      tools: tools.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        tags: t.tags,
        enabled: t.enabled,
        version: t.version,
      })),
    };
  },
});

/**
 * Search tools (no approval required)
 */
export const vmcp_search_tools = tool({
  description: 'Search for tools by name, description, or tags',

  inputSchema: z.object({
    query: z.string().describe('Search query'),
  }),

  execute: async ({ query }) => {
    const tools = await registry.searchTools(query);

    return {
      count: tools.length,
      tools: tools.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        enabled: t.enabled,
      })),
    };
  },
});

/**
 * Get tool details (no approval required)
 */
export const vmcp_get_tool = tool({
  description: 'Get detailed information about a specific tool including its handler code',

  inputSchema: z.object({
    idOrName: z.string().describe('Tool ID or name'),
  }),

  execute: async ({ idOrName }) => {
    const foundTool = await registry.getTool(idOrName);

    if (!foundTool) {
      return { success: false, error: 'Tool not found' };
    }

    return {
      success: true,
      tool: {
        id: foundTool.id,
        name: foundTool.name,
        version: foundTool.version,
        description: foundTool.description,
        inputSchema: foundTool.inputSchema,
        handler: foundTool.handler,
        category: foundTool.category,
        tags: foundTool.tags,
        enabled: foundTool.enabled,
        timeout: foundTool.timeout,
        createdAt: foundTool.createdAt,
        updatedAt: foundTool.updatedAt,
      },
    };
  },
});

/**
 * Test a tool (no approval required)
 */
export const vmcp_test_tool = tool({
  description: 'Test a tool with sample input before using it in production',

  inputSchema: z.object({
    idOrName: z.string().describe('Tool ID or name'),
    input: z.record(z.string(), z.unknown()).describe('Test input matching the tool schema'),
  }),

  execute: async ({ idOrName, input }) => {
    const foundTool = await registry.getTool(idOrName);

    if (!foundTool) {
      return { success: false, error: 'Tool not found' };
    }

    const result = await testTool(foundTool, input as Record<string, unknown>);

    return {
      toolName: foundTool.name,
      ...result,
    };
  },
});

/**
 * Mount a tool (no approval required - just enables)
 */
export const vmcp_mount_tool = tool({
  description: 'Mount/enable a tool so it can be used',

  inputSchema: z.object({
    id: z.string().describe('Tool ID to mount'),
  }),

  execute: async ({ id }) => {
    try {
      const mounted = await registry.mountTool(id);
      return {
        success: true,
        message: `Tool "${mounted.primitive.name}" is now mounted and available`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Dismount a tool (no approval required - just disables)
 */
export const vmcp_dismount_tool = tool({
  description: 'Dismount/disable a tool (keeps it in registry but not available)',

  inputSchema: z.object({
    id: z.string().describe('Tool ID to dismount'),
  }),

  execute: async ({ id }) => {
    try {
      await registry.dismountTool(id);
      return {
        success: true,
        message: 'Tool dismounted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Get registry statistics (no approval required)
 */
export const vmcp_stats = tool({
  description: 'Get statistics about the tool registry',

  inputSchema: z.object({}),

  execute: async () => {
    const stats = await registry.getStats();
    return stats;
  },
});

/**
 * Get current VMCP mode (no approval required)
 */
export const vmcp_get_mode = tool({
  description: 'Check the current VMCP permission mode (ask or autonomous)',

  inputSchema: z.object({}),

  execute: async () => {
    const settings = await getVmcpSettings();
    return {
      mode: settings.mode,
      isAutonomous: settings.mode === 'autonomous',
      description:
        settings.mode === 'autonomous'
          ? 'Autonomous mode: You can create/modify tools without user approval.'
          : 'Permission mode: Tool creation/modification requires user approval via the chat UI.',
    };
  },
});

/**
 * Enable autonomous mode
 * This itself requires approval to prevent unauthorized escalation
 */
export const vmcp_enable_autonomous = tool({
  description: `Enable autonomous mode. This allows the AI to create and modify tools without
asking for user approval each time. Use with caution - only enable when the user explicitly
requests autonomous operation.`,

  inputSchema: z.object({
    reason: z.string().describe('Why autonomous mode is needed'),
  }),

  // Always requires approval to enable autonomous mode
  needsApproval: true,

  execute: async ({ reason }) => {
    await enableAutonomousMode();
    return {
      success: true,
      message: 'Autonomous mode enabled. You can now create and modify tools without approval.',
      reason,
    };
  },
});

/**
 * Disable autonomous mode (no approval required - returning to safer mode)
 */
export const vmcp_disable_autonomous = tool({
  description: 'Disable autonomous mode and return to permission-based operation',

  inputSchema: z.object({}),

  execute: async () => {
    await disableAutonomousMode();
    return {
      success: true,
      message: 'Permission mode enabled. Tool modifications will now require user approval.',
    };
  },
});

/**
 * All VMCP management tools
 */
export const vmcpTools = {
  // Tool management (uses needsApproval in ask mode)
  vmcp_create_tool,
  vmcp_iterate_tool,
  vmcp_delete_tool,
  // Read-only tools (no approval required)
  vmcp_list_tools,
  vmcp_search_tools,
  vmcp_get_tool,
  vmcp_test_tool,
  vmcp_mount_tool,
  vmcp_dismount_tool,
  vmcp_stats,
  // Mode management
  vmcp_get_mode,
  vmcp_enable_autonomous,
  vmcp_disable_autonomous,
};
