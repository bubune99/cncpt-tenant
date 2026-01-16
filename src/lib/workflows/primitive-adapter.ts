/**
 * Primitive Adapter
 *
 * Bridges the workflow engine with the primitive execution system.
 * Handles primitive loading, validation, and execution logging.
 */

import { prisma } from '../db';
import type { Primitive, PrimitiveExecution } from '@prisma/client';
import Ajv from 'ajv';

// =============================================================================
// PRIMITIVE CACHE
// =============================================================================

const primitiveCache = new Map<string, Primitive>();
const ajv = new Ajv({ allErrors: true, useDefaults: true });

/**
 * Clear primitive cache (useful for testing)
 */
export function clearPrimitiveCache(): void {
  primitiveCache.clear();
}

// =============================================================================
// PRIMITIVE LOADING
// =============================================================================

/**
 * Get a primitive by ID with caching
 */
export async function getPrimitive(primitiveId: string): Promise<Primitive | null> {
  // Check cache
  if (primitiveCache.has(primitiveId)) {
    return primitiveCache.get(primitiveId)!;
  }

  // Load from database
  const primitive = await prisma.primitive.findUnique({
    where: { id: primitiveId },
  });

  if (primitive) {
    primitiveCache.set(primitiveId, primitive);
  }

  return primitive;
}

/**
 * Get a primitive by name
 */
export async function getPrimitiveByName(name: string): Promise<Primitive | null> {
  // Check cache by name
  for (const primitive of primitiveCache.values()) {
    if (primitive.name === name) {
      return primitive;
    }
  }

  // Load from database
  const primitive = await prisma.primitive.findUnique({
    where: { name },
  });

  if (primitive) {
    primitiveCache.set(primitive.id, primitive);
  }

  return primitive;
}

/**
 * Get all primitives for a category
 */
export async function getPrimitivesByCategory(category: string): Promise<Primitive[]> {
  return prisma.primitive.findMany({
    where: {
      category,
      enabled: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get all available primitives
 */
export async function getAllPrimitives(): Promise<Primitive[]> {
  return prisma.primitive.findMany({
    where: { enabled: true },
    orderBy: { category: 'asc' },
  });
}

// =============================================================================
// INPUT VALIDATION
// =============================================================================

/**
 * Validate input against primitive's JSON Schema
 */
export function validatePrimitiveInput(
  primitive: Primitive,
  input: unknown
): { valid: boolean; errors?: string[] } {
  const schema = primitive.inputSchema as Record<string, unknown>;

  if (!schema || Object.keys(schema).length === 0) {
    return { valid: true };
  }

  try {
    const validate = ajv.compile(schema);
    const valid = validate(input);

    if (!valid && validate.errors) {
      return {
        valid: false,
        errors: validate.errors.map(
          (e) => `${(e as { instancePath?: string }).instancePath || 'input'} ${e.message}`
        ),
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: [`Schema validation error: ${error instanceof Error ? error.message : 'Unknown'}`],
    };
  }
}

// =============================================================================
// PRIMITIVE EXECUTION
// =============================================================================

interface ExecutionContext {
  workflowExecutionId?: string;
  workflowId?: string;
  userId?: string;
  agentId?: string;
}

/**
 * Execute a primitive by ID
 */
export async function executePrimitive(
  primitiveId: string,
  input: Record<string, unknown>,
  context?: ExecutionContext
): Promise<unknown> {
  const startedAt = new Date();
  const startTime = Date.now();

  // Load primitive
  const primitive = await getPrimitive(primitiveId);
  if (!primitive) {
    throw new Error(`Primitive not found: ${primitiveId}`);
  }

  if (!primitive.enabled) {
    throw new Error(`Primitive is disabled: ${primitive.name}`);
  }

  // Validate input
  const validation = validatePrimitiveInput(primitive, input);
  if (!validation.valid) {
    throw new Error(`Invalid input: ${validation.errors?.join(', ')}`);
  }

  let output: unknown;
  let success = true;
  let errorMessage: string | undefined;

  try {
    // Execute the primitive handler
    output = await executeHandler(primitive, input);
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  } finally {
    // Log execution
    const completedAt = new Date();
    const executionTime = Date.now() - startTime;

    await logPrimitiveExecution({
      primitiveId,
      workflowExecutionId: context?.workflowExecutionId,
      userId: context?.userId,
      agentId: context?.agentId,
      input,
      output,
      success,
      error: errorMessage,
      startedAt,
      completedAt,
      executionTime,
    });
  }

  return output;
}

/**
 * Execute a primitive by name
 */
export async function executePrimitiveByName(
  name: string,
  input: Record<string, unknown>,
  context?: ExecutionContext
): Promise<unknown> {
  const primitive = await getPrimitiveByName(name);
  if (!primitive) {
    throw new Error(`Primitive not found: ${name}`);
  }

  return executePrimitive(primitive.id, input, context);
}

// =============================================================================
// HANDLER EXECUTION
// =============================================================================

/**
 * Execute the primitive handler code
 */
async function executeHandler(
  primitive: Primitive,
  input: Record<string, unknown>
): Promise<unknown> {
  const handler = primitive.handler;

  // Create a sandboxed execution context
  const context = createExecutionContext(primitive);

  try {
    // Wrap handler in async function
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction('input', 'context', handler);

    // Execute with timeout
    const result = await Promise.race([
      fn(input, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), primitive.timeout)
      ),
    ]);

    return result;
  } catch (error) {
    console.error(`[PrimitiveAdapter] Handler error for ${primitive.name}:`, error);
    throw error;
  }
}

/**
 * Create execution context for handler
 */
function createExecutionContext(primitive: Primitive): Record<string, unknown> {
  return {
    // Primitive metadata
    primitiveId: primitive.id,
    primitiveName: primitive.name,
    primitiveVersion: primitive.version,

    // Utilities
    log: (...args: unknown[]) => console.log(`[${primitive.name}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${primitive.name}]`, ...args),

    // HTTP helpers (if needed by handler)
    fetch: globalThis.fetch,

    // Environment (filtered for security)
    env: {
      NODE_ENV: process.env.NODE_ENV,
    },
  };
}

// =============================================================================
// EXECUTION LOGGING
// =============================================================================

interface LogExecutionParams {
  primitiveId: string;
  workflowExecutionId?: string;
  userId?: string;
  agentId?: string;
  input: unknown;
  output: unknown;
  success: boolean;
  error?: string;
  startedAt: Date;
  completedAt: Date;
  executionTime: number;
}

/**
 * Log primitive execution to database
 */
async function logPrimitiveExecution(params: LogExecutionParams): Promise<PrimitiveExecution> {
  return prisma.primitiveExecution.create({
    data: {
      primitiveId: params.primitiveId,
      workflowExecutionId: params.workflowExecutionId,
      userId: params.userId,
      agentId: params.agentId,
      input: params.input as never,
      output: params.output as never,
      success: params.success,
      error: params.error,
      startedAt: params.startedAt,
      completedAt: params.completedAt,
      executionTime: params.executionTime,
    },
  });
}

/**
 * Get execution history for a primitive
 */
export async function getPrimitiveExecutionHistory(
  primitiveId: string,
  options?: {
    limit?: number;
    success?: boolean;
    workflowExecutionId?: string;
  }
): Promise<PrimitiveExecution[]> {
  return prisma.primitiveExecution.findMany({
    where: {
      primitiveId,
      ...(options?.success !== undefined && { success: options.success }),
      ...(options?.workflowExecutionId && {
        workflowExecutionId: options.workflowExecutionId,
      }),
    },
    orderBy: { startedAt: 'desc' },
    take: options?.limit || 50,
  });
}

// =============================================================================
// PRIMITIVE UTILITIES
// =============================================================================

/**
 * Get primitive categories
 */
export async function getPrimitiveCategories(): Promise<string[]> {
  const primitives = await prisma.primitive.findMany({
    where: { enabled: true },
    select: { category: true },
    distinct: ['category'],
  });

  return primitives
    .map((p: { category: string | null }) => p.category)
    .filter((c: string | null): c is string => c !== null)
    .sort();
}

/**
 * Check if a primitive exists and is enabled
 */
export async function isPrimitiveAvailable(primitiveId: string): Promise<boolean> {
  const primitive = await getPrimitive(primitiveId);
  return primitive !== null && primitive.enabled;
}

/**
 * Get primitive input schema for UI rendering
 */
export async function getPrimitiveInputSchema(
  primitiveId: string
): Promise<Record<string, unknown> | null> {
  const primitive = await getPrimitive(primitiveId);
  if (!primitive) return null;

  return primitive.inputSchema as Record<string, unknown>;
}
