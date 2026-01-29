/**
 * VMCP Registry
 *
 * Database-driven tool registry for dynamic tool management.
 * Stores and retrieves tools from PostgreSQL via Prisma.
 */

import { prisma } from '../db';
import type { Primitive } from '@prisma/client';
import type {
  CreateToolInput,
  UpdateToolInput,
  RegistryStats,
  MountedTool,
  JSONSchema,
} from './types';

// In-memory cache for mounted tools (LRU-style)
const mountedToolsCache = new Map<string, MountedTool>();

/**
 * Initialize the registry - load mounted tools into cache
 */
export async function initializeRegistry(): Promise<void> {
  const mountedPrimitives = await prisma.primitive.findMany({
    where: { enabled: true },
  });

  mountedToolsCache.clear();
  for (const primitive of mountedPrimitives) {
    mountedToolsCache.set(primitive.id, {
      primitive,
      mountedAt: new Date(),
      invocationCount: 0,
    });
  }

  console.log(`[VMCP] Registry initialized with ${mountedPrimitives.length} tools`);
}

/**
 * Get all tools in the registry
 */
export async function listTools(options?: {
  category?: string;
  tags?: string[];
  enabledOnly?: boolean;
  limit?: number;
}): Promise<Primitive[]> {
  const where: Record<string, unknown> = {};

  if (options?.category) {
    where.category = options.category;
  }

  if (options?.tags?.length) {
    where.tags = { hasSome: options.tags };
  }

  if (options?.enabledOnly !== false) {
    where.enabled = true;
  }

  return prisma.primitive.findMany({
    where,
    take: options?.limit || 100,
    orderBy: { name: 'asc' },
  });
}

/**
 * Get a tool by ID or name
 */
export async function getTool(idOrName: string): Promise<Primitive | null> {
  return prisma.primitive.findFirst({
    where: {
      OR: [{ id: idOrName }, { name: idOrName }],
    },
  });
}

/**
 * Create a new tool
 */
export async function createTool(input: CreateToolInput): Promise<Primitive> {
  // Validate handler doesn't contain dangerous patterns
  validateHandler(input.handler);

  const primitive = await prisma.primitive.create({
    data: {
      name: input.name,
      description: input.description,
      inputSchema: input.inputSchema as object,
      handler: input.handler,
      category: input.category,
      tags: input.tags || [],
      timeout: input.timeout || 30000,
      sandbox: input.sandbox !== false,
      enabled: true,
    },
  });

  // Auto-mount the new tool
  mountedToolsCache.set(primitive.id, {
    primitive,
    mountedAt: new Date(),
    invocationCount: 0,
  });

  console.log(`[VMCP] Created tool: ${primitive.name}`);
  return primitive;
}

/**
 * Update an existing tool
 */
export async function updateTool(input: UpdateToolInput): Promise<Primitive> {
  if (input.handler) {
    validateHandler(input.handler);
  }

  const primitive = await prisma.primitive.update({
    where: { id: input.id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description && { description: input.description }),
      ...(input.inputSchema && { inputSchema: input.inputSchema as object }),
      ...(input.handler && { handler: input.handler }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.tags && { tags: input.tags }),
      ...(input.timeout && { timeout: input.timeout }),
      ...(input.sandbox !== undefined && { sandbox: input.sandbox }),
      version: { increment: 1 } as unknown as string, // Increment version
    },
  });

  // Update cache if mounted
  if (mountedToolsCache.has(primitive.id)) {
    const cached = mountedToolsCache.get(primitive.id)!;
    mountedToolsCache.set(primitive.id, {
      ...cached,
      primitive,
    });
  }

  console.log(`[VMCP] Updated tool: ${primitive.name}`);
  return primitive;
}

/**
 * Delete a tool
 */
export async function deleteTool(id: string): Promise<void> {
  const tool = await prisma.primitive.findUnique({ where: { id } });

  if (!tool) {
    throw new Error(`Tool not found: ${id}`);
  }

  if (tool.builtIn) {
    throw new Error('Cannot delete built-in tools');
  }

  await prisma.primitive.delete({ where: { id } });
  mountedToolsCache.delete(id);

  console.log(`[VMCP] Deleted tool: ${tool.name}`);
}

/**
 * Mount a tool (make it available for use)
 */
export async function mountTool(id: string): Promise<MountedTool> {
  const primitive = await prisma.primitive.update({
    where: { id },
    data: { enabled: true },
  });

  const mounted: MountedTool = {
    primitive,
    mountedAt: new Date(),
    invocationCount: 0,
  };

  mountedToolsCache.set(id, mounted);
  console.log(`[VMCP] Mounted tool: ${primitive.name}`);

  return mounted;
}

/**
 * Dismount a tool (keep in registry but disable)
 */
export async function dismountTool(id: string): Promise<void> {
  await prisma.primitive.update({
    where: { id },
    data: { enabled: false },
  });

  mountedToolsCache.delete(id);
  console.log(`[VMCP] Dismounted tool: ${id}`);
}

/**
 * Get all mounted tools
 */
export function getMountedTools(): MountedTool[] {
  return Array.from(mountedToolsCache.values());
}

/**
 * Get a mounted tool by name
 */
export function getMountedToolByName(name: string): MountedTool | undefined {
  for (const tool of mountedToolsCache.values()) {
    if (tool.primitive.name === name) {
      return tool;
    }
  }
  return undefined;
}

/**
 * Record a tool invocation
 */
export function recordInvocation(id: string): void {
  const tool = mountedToolsCache.get(id);
  if (tool) {
    tool.invocationCount++;
    tool.lastInvoked = new Date();
  }
}

/**
 * Search tools by query
 */
export async function searchTools(query: string): Promise<Primitive[]> {
  return prisma.primitive.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ],
    },
    take: 20,
  });
}

/**
 * Get registry statistics
 */
export async function getStats(): Promise<RegistryStats> {
  const [tools, executions, categoryGroups] = await Promise.all([
    prisma.primitive.findMany({
      select: { id: true, category: true, tier: true, enabled: true },
    }),
    prisma.primitiveExecution.count({
      where: {
        startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.primitive.groupBy({
      by: ['category'],
      _count: true,
    }),
  ]);

  const byCategory: Record<string, number> = {};
  for (const group of categoryGroups) {
    byCategory[group.category || 'uncategorized'] = group._count;
  }

  const byTier: Record<string, number> = { FREE: 0, PROPRIETARY: 0 };
  for (const tool of tools) {
    byTier[tool.tier]++;
  }

  return {
    totalTools: tools.length,
    mountedTools: tools.filter((t) => t.enabled).length,
    byCategory,
    byTier,
    recentExecutions: executions,
  };
}

/**
 * Validate handler code for dangerous patterns
 */
function validateHandler(handler: string): void {
  const dangerousPatterns = [
    /\beval\s*\(/,
    /\bFunction\s*\(/,
    /\brequire\s*\(/,
    /\bimport\s*\(/,
    /\bprocess\.exit/,
    /\bchild_process/,
    /\bfs\.(unlink|rmdir|rm|writeFile)/,
    /\b__dirname\b/,
    /\b__filename\b/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(handler)) {
      throw new Error(
        `Handler contains dangerous pattern: ${pattern.toString()}`
      );
    }
  }
}

/**
 * Get tool categories
 */
export async function getCategories(): Promise<string[]> {
  const result = await prisma.primitive.groupBy({
    by: ['category'],
    where: { category: { not: null } },
  });

  return result.map((r) => r.category!).filter(Boolean);
}
