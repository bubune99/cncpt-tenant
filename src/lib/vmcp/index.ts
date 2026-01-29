/**
 * VMCP - Virtualized Model Context Protocol
 *
 * Database-driven dynamic tool management for AI agents.
 * Allows agents to create, edit, and manage their own tools at runtime.
 *
 * Based on: https://github.com/farcncpt/vmcp
 */

import { tool } from 'ai';
import { z } from 'zod';
import * as registry from './registry';
import { executeTool } from './runtime';
import { vmcpTools } from './tools';
import type { MountedTool, JSONSchema } from './types';

// Re-export types
export * from './types';

// Re-export registry functions
export {
  initializeRegistry,
  listTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  mountTool,
  dismountTool,
  getMountedTools,
  searchTools,
  getStats,
} from './registry';

// Re-export runtime functions
export { executeTool, testTool } from './runtime';

// Re-export management tools
export { vmcpTools } from './tools';

// Re-export permission functions (simplified - native AI SDK v6 handles approvals)
export {
  getVmcpSettings,
  updateVmcpSettings,
  enableAutonomousMode,
  disableAutonomousMode,
  isAutonomousMode,
  type VmcpPermissionMode,
  type VmcpSettings,
} from './permissions';

/**
 * Convert a mounted primitive to an AI SDK tool
 */
function primitiveToAiTool(mounted: MountedTool) {
  const primitive = mounted.primitive;
  const schema = primitive.inputSchema as unknown as JSONSchema;

  // Convert JSON Schema to Zod schema
  const zodProperties: Record<string, z.ZodTypeAny> = {};

  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      let zodType: z.ZodTypeAny;

      switch (prop.type) {
        case 'string':
          zodType = z.string();
          break;
        case 'number':
          zodType = z.number();
          break;
        case 'integer':
          zodType = z.number().int();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'array':
          zodType = z.array(z.unknown());
          break;
        case 'object':
          zodType = z.record(z.string(), z.unknown());
          break;
        default:
          zodType = z.unknown();
      }

      if (prop.description) {
        zodType = zodType.describe(prop.description);
      }

      if (!schema.required?.includes(key)) {
        zodType = zodType.optional();
      }

      zodProperties[key] = zodType;
    }
  }

  const inputSchema = z.object(zodProperties);

  return tool({
    description: primitive.description,
    inputSchema,
    execute: async (input) => {
      const result = await executeTool(
        primitive,
        input as Record<string, unknown>
      );

      if (!result.success) {
        return { error: result.error };
      }

      return result.output;
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = ReturnType<typeof tool<any, any>>;

/**
 * Get all dynamic tools as AI SDK tools
 * Combines VMCP management tools with mounted primitives
 */
export async function getDynamicTools(): Promise<Record<string, AnyTool>> {
  // Initialize registry if needed
  const mounted = registry.getMountedTools();

  if (mounted.length === 0) {
    await registry.initializeRegistry();
  }

  // Convert mounted primitives to AI tools
  const dynamicTools: Record<string, AnyTool> = {};

  for (const mountedTool of registry.getMountedTools()) {
    try {
      dynamicTools[mountedTool.primitive.name] = primitiveToAiTool(mountedTool);
    } catch (error) {
      console.error(
        `[VMCP] Failed to convert tool ${mountedTool.primitive.name}:`,
        error
      );
    }
  }

  return dynamicTools;
}

/**
 * Get all tools (management + dynamic)
 */
export async function getAllVmcpTools(): Promise<Record<string, AnyTool>> {
  const dynamicTools = await getDynamicTools();

  return {
    ...(vmcpTools as Record<string, AnyTool>),
    ...dynamicTools,
  };
}

/**
 * Seed initial tools for the CMS
 */
export async function seedDefaultTools(): Promise<void> {
  const existingTools = await registry.listTools({ limit: 1 });

  if (existingTools.length > 0) {
    console.log('[VMCP] Tools already exist, skipping seed');
    return;
  }

  console.log('[VMCP] Seeding default tools...');

  // Product tools
  await registry.createTool({
    name: 'get_product_by_sku',
    description: 'Get a product by its SKU code',
    category: 'commerce',
    tags: ['product', 'lookup'],
    inputSchema: {
      type: 'object',
      properties: {
        sku: { type: 'string', description: 'Product SKU code' },
      },
      required: ['sku'],
    },
    handler: `
const product = await context.db.products.findUnique({
  where: { sku: input.sku },
  include: { variants: true, images: true }
});

if (!product) {
  return { error: 'Product not found' };
}

return {
  id: product.id,
  title: product.title,
  sku: product.sku,
  price: context.utils.formatCurrency(product.basePrice),
  status: product.status,
  variantCount: product.variants.length,
  imageCount: product.images.length,
  adminUrl: '/admin/products/' + product.id
};
`,
  });

  // Order tools
  await registry.createTool({
    name: 'update_order_status',
    description: 'Update the status of an order',
    category: 'commerce',
    tags: ['order', 'status'],
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID' },
        status: {
          type: 'string',
          description: 'New status: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED',
        },
        note: { type: 'string', description: 'Optional note about the status change' },
      },
      required: ['orderId', 'status'],
    },
    handler: `
const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
if (!validStatuses.includes(input.status)) {
  return { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') };
}

const order = await context.db.orders.update({
  where: { id: input.orderId },
  data: { status: input.status }
});

return {
  success: true,
  orderNumber: order.orderNumber,
  newStatus: order.status,
  note: input.note || 'Status updated'
};
`,
  });

  // Content tools
  await registry.createTool({
    name: 'create_blog_draft',
    description: 'Create a new blog post draft',
    category: 'content',
    tags: ['blog', 'content', 'draft'],
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Blog post title' },
        excerpt: { type: 'string', description: 'Short excerpt/summary' },
        content: { type: 'string', description: 'Blog post content (markdown)' },
        tags: { type: 'array', description: 'Tags for the post' },
      },
      required: ['title', 'content'],
    },
    handler: `
const slug = input.title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const post = await context.db.blogPosts.create({
  data: {
    title: input.title,
    slug: slug + '-' + context.utils.generateId().slice(0, 6),
    excerpt: input.excerpt || input.content.slice(0, 160),
    content: input.content,
    status: 'DRAFT'
  }
});

return {
  success: true,
  id: post.id,
  title: post.title,
  slug: post.slug,
  status: post.status,
  adminUrl: '/admin/blog/' + post.id
};
`,
  });

  // Analytics tool
  await registry.createTool({
    name: 'get_sales_summary',
    description: 'Get a summary of sales for a given period',
    category: 'analytics',
    tags: ['sales', 'analytics', 'report'],
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'integer', description: 'Number of days to look back (default: 30)' },
      },
    },
    handler: `
const days = input.days || 30;
const startDate = new Date();
startDate.setDate(startDate.getDate() - days);

const orders = await context.db.orders.findMany({
  where: {
    createdAt: { gte: startDate },
    status: { not: 'CANCELLED' }
  }
});

const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

return {
  period: days + ' days',
  totalOrders: orders.length,
  totalRevenue: context.utils.formatCurrency(totalRevenue),
  averageOrderValue: context.utils.formatCurrency(avgOrderValue),
  ordersPerDay: (orders.length / days).toFixed(1)
};
`,
  });

  console.log('[VMCP] Default tools seeded successfully');
}
