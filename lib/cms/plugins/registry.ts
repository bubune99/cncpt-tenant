/**
 * Plugin Registry - Manages primitives, plugins, and workflows
 *
 * Two-tier architecture:
 * - Tier 1: In-memory cache (fast access for mounted primitives)
 * - Tier 2: PostgreSQL via Prisma (persistent storage)
 *
 * Read path: Memory -> DB (on cache miss)
 * Write path: Memory + DB (write-through)
 */

import { prisma } from '../db';
import type {
  PrimitiveDefinition,
  MountedPrimitive,
  PluginDefinition,
  WorkflowDefinition,
  PrimitiveInfo,
  PluginInfo,
  RegistryStats,
  CreatePrimitiveRequest,
  UpdatePrimitiveRequest,
  CreatePluginRequest,
  JSONSchema,
} from './types';
import { generateId, incrementVersion, slugify } from './types';
import { validateHandlerSecurity, createSandboxFunction, invalidateHandler } from './sandbox';

/**
 * Plugin Registry - Singleton class managing the plugin system
 */
export class PluginRegistry {
  // Tier 1: In-memory mounted primitives
  private mountedPrimitives: Map<string, MountedPrimitive> = new Map();

  // In-memory primitive definitions cache
  private primitiveCache: Map<string, PrimitiveDefinition> = new Map();

  // Compiled handlers cache
  private handlerCache: Map<string, Function> = new Map();

  // Initialization flag
  private initialized: boolean = false;

  /**
   * Initialize the registry - load primitives from DB into memory
   */
  async initialize(): Promise<{ loaded: number; mounted: number; errors: string[] }> {
    if (this.initialized) {
      return { loaded: 0, mounted: 0, errors: [] };
    }

    const errors: string[] = [];
    let loaded = 0;
    let mounted = 0;

    try {
      // Load all enabled primitives from DB
      const primitives = await prisma.primitive.findMany({
        where: { enabled: true },
      });

      for (const dbPrimitive of primitives) {
        try {
          const definition = this.dbToPrimitiveDefinition(dbPrimitive);
          this.primitiveCache.set(definition.id, definition);
          loaded++;

          // Auto-mount all enabled primitives
          const mountResult = this.mountPrimitive(definition.id);
          if (mountResult.success) {
            mounted++;
          } else {
            errors.push(`Failed to mount ${definition.name}: ${mountResult.error}`);
          }
        } catch (e) {
          errors.push(`Failed to load primitive ${dbPrimitive.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      this.initialized = true;
    } catch (e) {
      errors.push(`Failed to initialize registry: ${e instanceof Error ? e.message : String(e)}`);
    }

    return { loaded, mounted, errors };
  }

  // ============================================================================
  // PRIMITIVE MANAGEMENT
  // ============================================================================

  /**
   * Create a new primitive
   */
  async createPrimitive(request: CreatePrimitiveRequest): Promise<{ success: boolean; primitiveId?: string; error?: string }> {
    // Validate handler security
    const securityCheck = validateHandlerSecurity(request.handler);
    if (!securityCheck.safe) {
      return { success: false, error: `Handler security failed: ${securityCheck.blocked.join(', ')}` };
    }

    // Check for duplicate name
    const existing = await prisma.primitive.findFirst({ where: { name: request.name, tenantId: null } });
    if (existing) {
      return { success: false, error: `Primitive with name "${request.name}" already exists` };
    }

    // Validate handler can compile
    try {
      createSandboxFunction(request.handler);
    } catch (e) {
      return { success: false, error: `Handler compilation failed: ${e instanceof Error ? e.message : String(e)}` };
    }

    const id = generateId('prim');

    try {
      // Create in DB
      const dbPrimitive = await prisma.primitive.create({
        data: {
          id,
          name: request.name,
          description: request.description,
          inputSchema: request.inputSchema as object,
          handler: request.handler,
          category: request.category,
          tags: request.tags || [],
          icon: request.icon,
          timeout: request.timeout || 30000,
          enabled: true,
          pluginId: request.pluginId,
        },
      });

      // Add to memory cache
      const definition = this.dbToPrimitiveDefinition(dbPrimitive);
      this.primitiveCache.set(id, definition);

      // Auto-mount if requested
      if (request.autoMount !== false) {
        const mountResult = this.mountPrimitive(id);
        if (!mountResult.success) {
          return { success: true, primitiveId: id, error: `Created but mount failed: ${mountResult.error}` };
        }
      }

      return { success: true, primitiveId: id };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * Update an existing primitive
   */
  async updatePrimitive(id: string, request: UpdatePrimitiveRequest): Promise<{ success: boolean; error?: string }> {
    const existing = this.primitiveCache.get(id) || await this.getPrimitiveFromDb(id);
    if (!existing) {
      return { success: false, error: `Primitive not found: ${id}` };
    }

    // Validate new handler if provided
    if (request.handler) {
      const securityCheck = validateHandlerSecurity(request.handler);
      if (!securityCheck.safe) {
        return { success: false, error: `Handler security failed: ${securityCheck.blocked.join(', ')}` };
      }

      try {
        createSandboxFunction(request.handler);
      } catch (e) {
        return { success: false, error: `Handler compilation failed: ${e instanceof Error ? e.message : String(e)}` };
      }
    }

    try {
      // Update in DB
      const updated = await prisma.primitive.update({
        where: { id },
        data: {
          description: request.description ?? existing.description,
          inputSchema: (request.inputSchema ?? existing.inputSchema) as object,
          handler: request.handler ?? existing.handler,
          category: request.category ?? existing.category,
          tags: request.tags ?? existing.tags,
          icon: request.icon ?? existing.icon,
          timeout: request.timeout ?? existing.timeout,
          enabled: request.enabled ?? existing.enabled,
          version: incrementVersion(existing.version),
        },
      });

      // Update memory cache
      const definition = this.dbToPrimitiveDefinition(updated);
      this.primitiveCache.set(id, definition);

      // Invalidate handler cache
      invalidateHandler(id);
      this.handlerCache.delete(id);

      // Re-mount if currently mounted
      if (this.mountedPrimitives.has(id)) {
        this.dismountPrimitive(id);
        this.mountPrimitive(id);
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * Delete a primitive
   */
  async deletePrimitive(id: string, force: boolean = false): Promise<{ success: boolean; error?: string }> {
    if (this.mountedPrimitives.has(id) && !force) {
      return { success: false, error: 'Primitive is mounted. Use force=true to dismount and delete.' };
    }

    // Dismount if mounted
    if (this.mountedPrimitives.has(id)) {
      this.dismountPrimitive(id);
    }

    try {
      await prisma.primitive.delete({ where: { id } });
      this.primitiveCache.delete(id);
      invalidateHandler(id);
      this.handlerCache.delete(id);

      return { success: true };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * Mount a primitive to make it active
   */
  mountPrimitive(id: string, config?: Record<string, unknown>): { success: boolean; error?: string } {
    const definition = this.primitiveCache.get(id);
    if (!definition) {
      return { success: false, error: `Primitive not found in cache: ${id}` };
    }

    if (this.mountedPrimitives.has(id)) {
      return { success: false, error: `Primitive already mounted: ${id}` };
    }

    // Compile handler
    let compiledHandler: Function;
    try {
      compiledHandler = createSandboxFunction(definition.handler);
      this.handlerCache.set(id, compiledHandler);
    } catch (e) {
      return { success: false, error: `Handler compilation failed: ${e instanceof Error ? e.message : String(e)}` };
    }

    // Mount
    const mounted: MountedPrimitive = {
      definition,
      mountedAt: Date.now(),
      config,
      invocationCount: 0,
      compiledHandler,
    };

    this.mountedPrimitives.set(id, mounted);
    return { success: true };
  }

  /**
   * Dismount a primitive
   */
  dismountPrimitive(id: string): { success: boolean; error?: string } {
    if (!this.mountedPrimitives.has(id)) {
      return { success: false, error: `Primitive not mounted: ${id}` };
    }

    this.mountedPrimitives.delete(id);
    this.handlerCache.delete(id);
    invalidateHandler(id);

    return { success: true };
  }

  /**
   * Get a mounted primitive by ID or name
   */
  getMountedPrimitive(idOrName: string): MountedPrimitive | undefined {
    // Try by ID first
    let primitive = this.mountedPrimitives.get(idOrName);
    if (primitive) return primitive;

    // Try by name
    for (const mounted of this.mountedPrimitives.values()) {
      if (mounted.definition.name === idOrName) {
        return mounted;
      }
    }

    return undefined;
  }

  /**
   * Get all mounted primitives
   */
  getMountedPrimitives(): MountedPrimitive[] {
    return Array.from(this.mountedPrimitives.values());
  }

  /**
   * Get compiled handler for a primitive
   */
  getCompiledHandler(id: string): Function | undefined {
    return this.handlerCache.get(id);
  }

  /**
   * Record a primitive invocation
   */
  recordInvocation(id: string): void {
    const mounted = this.mountedPrimitives.get(id);
    if (mounted) {
      mounted.invocationCount++;
      mounted.lastInvoked = Date.now();
    }
  }

  /**
   * List primitives with filtering
   */
  async listPrimitives(options: {
    filter?: 'mounted' | 'available' | 'all';
    category?: string;
    tags?: string[];
    pluginId?: string;
    search?: string;
  } = {}): Promise<PrimitiveInfo[]> {
    const { filter = 'all', category, tags, pluginId, search } = options;

    let primitives: PrimitiveInfo[] = [];

    if (filter === 'mounted') {
      // Only mounted primitives (from memory)
      for (const mounted of this.mountedPrimitives.values()) {
        primitives.push(this.toPrimitiveInfo(mounted.definition, true));
      }
    } else {
      // Query from DB
      const where: any = {};
      if (category) where.category = category;
      if (pluginId) where.pluginId = pluginId;
      if (tags?.length) where.tags = { hasSome: tags };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const dbPrimitives = await prisma.primitive.findMany({ where });

      for (const dbPrim of dbPrimitives) {
        const isMounted = this.mountedPrimitives.has(dbPrim.id);
        if (filter === 'available' && isMounted) continue;

        primitives.push({
          id: dbPrim.id,
          name: dbPrim.name,
          description: dbPrim.description,
          version: dbPrim.version,
          tags: dbPrim.tags,
          category: dbPrim.category || undefined,
          icon: dbPrim.icon || undefined,
          mounted: isMounted,
          enabled: dbPrim.enabled,
          author: dbPrim.author || undefined,
          createdAt: dbPrim.createdAt,
          updatedAt: dbPrim.updatedAt,
        });
      }
    }

    return primitives;
  }

  // ============================================================================
  // PLUGIN MANAGEMENT
  // ============================================================================

  /**
   * Create a new plugin
   */
  async createPlugin(request: CreatePluginRequest): Promise<{ success: boolean; pluginId?: string; error?: string }> {
    const slug = request.slug || slugify(request.name);

    // Check for duplicate
    const existing = await prisma.plugin.findFirst({
      where: { OR: [{ name: request.name }, { slug }] },
    });
    if (existing) {
      return { success: false, error: `Plugin with name or slug already exists` };
    }

    const id = generateId('plug');

    try {
      await prisma.plugin.create({
        data: {
          id,
          name: request.name,
          slug,
          description: request.description,
          icon: request.icon,
          color: request.color,
          config: request.config as object,
          configSchema: request.configSchema as object,
          author: request.author,
          enabled: false, // Disabled by default
        },
      });

      return { success: true, pluginId: id };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * Enable/disable a plugin
   */
  async setPluginEnabled(id: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const plugin = await prisma.plugin.findUnique({ where: { id } });
      if (!plugin) {
        return { success: false, error: `Plugin not found: ${id}` };
      }

      // Update plugin
      await prisma.plugin.update({
        where: { id },
        data: { enabled },
      });

      // Mount/dismount plugin's primitives
      const primitives = await prisma.primitive.findMany({
        where: { pluginId: id, enabled: true },
      });

      for (const prim of primitives) {
        if (enabled) {
          const def = this.dbToPrimitiveDefinition(prim);
          this.primitiveCache.set(prim.id, def);
          this.mountPrimitive(prim.id);
        } else {
          this.dismountPrimitive(prim.id);
        }
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * Delete a plugin and its primitives
   */
  async deletePlugin(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get primitives to dismount
      const primitives = await prisma.primitive.findMany({ where: { pluginId: id } });

      for (const prim of primitives) {
        this.dismountPrimitive(prim.id);
        this.primitiveCache.delete(prim.id);
      }

      // Delete plugin (cascades to primitives)
      await prisma.plugin.delete({ where: { id } });

      return { success: true };
    } catch (e) {
      return { success: false, error: `Database error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * List plugins
   */
  async listPlugins(options: {
    enabled?: boolean;
    search?: string;
  } = {}): Promise<PluginInfo[]> {
    const { enabled, search } = options;

    const where: any = {};
    if (enabled !== undefined) where.enabled = enabled;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const plugins = await prisma.plugin.findMany({
      where,
      include: { _count: { select: { primitives: true } } },
    });

    return plugins.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || undefined,
      version: p.version,
      icon: p.icon || undefined,
      color: p.color || undefined,
      enabled: p.enabled,
      installed: p.installed,
      builtIn: p.builtIn,
      primitiveCount: p._count.primitives,
      author: p.author || undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  // ============================================================================
  // WORKFLOW MANAGEMENT
  // ============================================================================

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) return null;

    return {
      id: workflow.id,
      name: workflow.name,
      slug: workflow.slug,
      description: workflow.description || undefined,
      nodes: workflow.nodes as any[],
      edges: workflow.edges as any[],
      viewport: workflow.viewport as any,
      config: workflow.config as any,
      variables: workflow.variables as any,
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig as any,
      enabled: workflow.enabled,
      pluginId: workflow.pluginId,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      lastRunAt: workflow.lastRunAt || undefined,
    };
  }

  /**
   * List workflows
   */
  async listWorkflows(options: {
    enabled?: boolean;
    pluginId?: string;
    triggerType?: string;
  } = {}): Promise<WorkflowDefinition[]> {
    const where: any = {};
    if (options.enabled !== undefined) where.enabled = options.enabled;
    if (options.pluginId) where.pluginId = options.pluginId;
    if (options.triggerType) where.triggerType = options.triggerType;

    const workflows = await prisma.workflow.findMany({ where });

    return workflows.map(w => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      description: w.description || undefined,
      nodes: w.nodes as any[],
      edges: w.edges as any[],
      viewport: w.viewport as any,
      config: w.config as any,
      variables: w.variables as any,
      triggerType: w.triggerType,
      triggerConfig: w.triggerConfig as any,
      enabled: w.enabled,
      pluginId: w.pluginId,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      lastRunAt: w.lastRunAt || undefined,
    }));
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get registry statistics
   */
  async getStats(): Promise<RegistryStats> {
    const [primitiveCount, pluginStats, workflowCount, executionCount] = await Promise.all([
      prisma.primitive.count(),
      prisma.plugin.aggregate({
        _count: true,
        where: { enabled: true },
      }),
      prisma.workflow.count(),
      prisma.primitiveExecution.count(),
    ]);

    return {
      primitiveCount,
      mountedCount: this.mountedPrimitives.size,
      pluginCount: await prisma.plugin.count(),
      enabledPluginCount: pluginStats._count,
      workflowCount,
      totalExecutions: executionCount,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private dbToPrimitiveDefinition(db: any): PrimitiveDefinition {
    return {
      id: db.id,
      name: db.name,
      version: db.version,
      description: db.description,
      inputSchema: db.inputSchema as JSONSchema,
      handler: db.handler,
      dependencies: db.dependencies,
      author: db.author || undefined,
      tags: db.tags,
      tier: db.tier,
      category: db.category || undefined,
      icon: db.icon || undefined,
      timeout: db.timeout,
      memory: db.memory,
      sandbox: db.sandbox,
      enabled: db.enabled,
      builtIn: db.builtIn,
      pluginId: db.pluginId,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    };
  }

  private async getPrimitiveFromDb(id: string): Promise<PrimitiveDefinition | null> {
    const db = await prisma.primitive.findUnique({ where: { id } });
    if (!db) return null;
    return this.dbToPrimitiveDefinition(db);
  }

  private toPrimitiveInfo(def: PrimitiveDefinition, mounted: boolean): PrimitiveInfo {
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      version: def.version,
      tags: def.tags || [],
      category: def.category,
      icon: def.icon,
      mounted,
      enabled: def.enabled ?? true,
      author: def.author,
      createdAt: def.createdAt ?? new Date(),
      updatedAt: def.updatedAt ?? new Date(),
    };
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let registryInstance: PluginRegistry | null = null;

/**
 * Get the global plugin registry instance
 */
export function getPluginRegistry(): PluginRegistry {
  if (!registryInstance) {
    registryInstance = new PluginRegistry();
  }
  return registryInstance;
}

/**
 * Reset the registry (for testing)
 */
export function resetPluginRegistry(): void {
  registryInstance = new PluginRegistry();
}
