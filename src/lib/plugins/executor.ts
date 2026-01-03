/**
 * Primitive Executor - Orchestrates execution with validation and sandboxing
 *
 * Ties together:
 * - Input validation
 * - Sandboxed execution
 * - Output validation
 * - Error handling and metrics
 * - Execution logging
 */

import { prisma } from '@/lib/db';
import type {
  PrimitiveDefinition,
  ExecutionContext,
  ExecutionResult,
  JSONSchema,
} from './types';
import { generateId } from './types';
import {
  executeSandbox,
  validateHandlerSecurity,
  getOrCompileHandler,
  type SandboxConfig,
} from './sandbox';
import { getPluginRegistry } from './registry';

/**
 * Execution Options
 */
export interface ExecutionOptions {
  timeout?: number;          // Override default timeout
  skipValidation?: boolean;  // Skip input validation
  skipSandbox?: boolean;     // Run without sandbox (trusted code only)
  recordMetrics?: boolean;   // Record execution to DB (default: true)
  debug?: boolean;           // Enable debug mode
}

/**
 * Validate input against JSON Schema
 */
function validateInput(
  input: Record<string, unknown>,
  schema: JSONSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in input)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check property types
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (key in input) {
      const value = input[key];
      const expectedType = prop.type;

      if (expectedType === 'array' && !Array.isArray(value)) {
        errors.push(`Field "${key}" should be an array`);
      } else if (expectedType === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
        errors.push(`Field "${key}" should be an object`);
      } else if (expectedType === 'string' && typeof value !== 'string') {
        errors.push(`Field "${key}" should be a string`);
      } else if (expectedType === 'number' && typeof value !== 'number') {
        errors.push(`Field "${key}" should be a number`);
      } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Field "${key}" should be a boolean`);
      }

      // Check enum values
      if (prop.enum && !prop.enum.includes(value as string)) {
        errors.push(`Field "${key}" must be one of: ${prop.enum.join(', ')}`);
      }

      // Check string constraints
      if (typeof value === 'string') {
        if (prop.minLength && value.length < prop.minLength) {
          errors.push(`Field "${key}" must be at least ${prop.minLength} characters`);
        }
        if (prop.maxLength && value.length > prop.maxLength) {
          errors.push(`Field "${key}" must be at most ${prop.maxLength} characters`);
        }
        if (prop.pattern && !new RegExp(prop.pattern).test(value)) {
          errors.push(`Field "${key}" must match pattern: ${prop.pattern}`);
        }
      }

      // Check number constraints
      if (typeof value === 'number') {
        if (prop.minimum !== undefined && value < prop.minimum) {
          errors.push(`Field "${key}" must be at least ${prop.minimum}`);
        }
        if (prop.maximum !== undefined && value > prop.maximum) {
          errors.push(`Field "${key}" must be at most ${prop.maximum}`);
        }
      }
    }
  }

  // Check for extra fields if additionalProperties is false
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(input)) {
      if (!(key in schema.properties)) {
        errors.push(`Unknown field: ${key}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Execute a primitive with full validation and sandboxing
 */
export async function executePrimitive(
  primitive: PrimitiveDefinition,
  args: Record<string, unknown>,
  context: Partial<ExecutionContext> = {},
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const invocationId = generateId('exec');
  const {
    timeout = primitive.timeout || 30000,
    skipValidation = false,
    skipSandbox = false,
    recordMetrics = true,
    debug = false,
  } = options;

  // Build full execution context
  const execContext: ExecutionContext = {
    primitiveId: primitive.id,
    primitiveName: primitive.name,
    invocationId,
    startTime,
    timeout,
    debug,
    ...context,
  };

  try {
    // Step 1: Input validation
    if (!skipValidation) {
      const validation = validateInput(args, primitive.inputSchema);
      if (!validation.valid) {
        return createErrorResult(
          `Input validation failed:\n- ${validation.errors.join('\n- ')}`,
          startTime,
          invocationId
        );
      }
    }

    // Step 2: Security check on handler
    const securityCheck = validateHandlerSecurity(primitive.handler);
    if (!securityCheck.safe) {
      return createErrorResult(
        `Handler security validation failed:\n- ${securityCheck.blocked.join('\n- ')}`,
        startTime,
        invocationId
      );
    }

    // Log warnings in debug mode
    if (debug && securityCheck.warnings.length > 0) {
      console.warn(`[${primitive.name}] Security warnings:\n- ${securityCheck.warnings.join('\n- ')}`);
    }

    // Step 3: Execute handler
    let result: unknown;

    if (skipSandbox) {
      // Direct execution (trusted code only)
      result = await executeDirectly(primitive, args, execContext, timeout);
    } else {
      // Sandboxed execution
      const sandboxConfig: Partial<SandboxConfig> = {
        timeout,
        allowAsync: true,
        maxOutputSize: 1024 * 1024, // 1MB
      };

      const sandboxResult = await executeSandbox(
        primitive.handler,
        args,
        execContext,
        sandboxConfig
      );

      if (!sandboxResult.success) {
        const errorResult = createErrorResult(
          sandboxResult.error || 'Unknown execution error',
          startTime,
          invocationId
        );

        // Record failed execution
        if (recordMetrics) {
          await recordExecution(
            primitive.id,
            args,
            null,
            false,
            sandboxResult.error,
            startTime,
            Date.now(),
            execContext
          );
        }

        return errorResult;
      }

      result = sandboxResult.result;
    }

    // Step 4: Success
    const endTime = Date.now();
    const executionResult: ExecutionResult = {
      success: true,
      result,
      executionTime: endTime - startTime,
      invocationId,
    };

    // Record successful execution
    if (recordMetrics) {
      await recordExecution(
        primitive.id,
        args,
        result,
        true,
        undefined,
        startTime,
        endTime,
        execContext
      );
    }

    // Update registry invocation count
    const registry = getPluginRegistry();
    registry.recordInvocation(primitive.id);

    return executionResult;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResult = createErrorResult(errorMessage, startTime, invocationId);

    // Record failed execution
    if (recordMetrics) {
      await recordExecution(
        primitive.id,
        args,
        null,
        false,
        errorMessage,
        startTime,
        Date.now(),
        execContext
      );
    }

    return errorResult;
  }
}

/**
 * Execute handler directly without sandbox (for trusted code)
 */
async function executeDirectly(
  primitive: PrimitiveDefinition,
  args: Record<string, unknown>,
  context: ExecutionContext,
  timeout: number
): Promise<unknown> {
  const handler = getOrCompileHandler(primitive.id, primitive.handler);

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Execution timeout after ${timeout}ms`));
    }, timeout);

    try {
      const result = handler(args, context);

      if (result instanceof Promise) {
        result
          .then((value) => {
            clearTimeout(timeoutId);
            resolve(value);
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            reject(err);
          });
      } else {
        clearTimeout(timeoutId);
        resolve(result);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}

/**
 * Create an error result
 */
function createErrorResult(
  error: string,
  startTime: number,
  invocationId: string
): ExecutionResult {
  return {
    success: false,
    error,
    executionTime: Date.now() - startTime,
    invocationId,
  };
}

/**
 * Record execution to database for audit trail
 */
async function recordExecution(
  primitiveId: string,
  input: Record<string, unknown>,
  output: unknown,
  success: boolean,
  error: string | undefined,
  startedAt: number,
  completedAt: number,
  context: ExecutionContext
): Promise<void> {
  try {
    await prisma.primitiveExecution.create({
      data: {
        primitiveId,
        workflowExecutionId: context.workflowExecutionId,
        userId: context.userId,
        agentId: context.agentId,
        input: input as object,
        output: output as object,
        success,
        error,
        startedAt: new Date(startedAt),
        completedAt: new Date(completedAt),
        executionTime: completedAt - startedAt,
      },
    });
  } catch (e) {
    // Don't fail execution if metrics recording fails
    console.error('Failed to record execution:', e);
  }
}

/**
 * Test a primitive with sample input
 */
export async function testPrimitive(
  primitive: PrimitiveDefinition,
  testInput: Record<string, unknown>,
  context?: Partial<ExecutionContext>
): Promise<{
  success: boolean;
  result?: unknown;
  error?: string;
  validationErrors?: string[];
  securityWarnings?: string[];
  executionTime: number;
}> {
  const startTime = Date.now();

  // Check input validation
  const inputValidation = validateInput(testInput, primitive.inputSchema);

  // Check handler security
  const securityCheck = validateHandlerSecurity(primitive.handler);

  // If validation fails, return early
  if (!inputValidation.valid) {
    return {
      success: false,
      error: 'Input validation failed',
      validationErrors: inputValidation.errors,
      securityWarnings: securityCheck.warnings,
      executionTime: Date.now() - startTime,
    };
  }

  if (!securityCheck.safe) {
    return {
      success: false,
      error: 'Handler security check failed',
      validationErrors: securityCheck.blocked,
      securityWarnings: securityCheck.warnings,
      executionTime: Date.now() - startTime,
    };
  }

  // Execute (without recording metrics)
  const result = await executePrimitive(primitive, testInput, context, {
    recordMetrics: false,
    debug: true,
  });

  return {
    success: result.success,
    result: result.result,
    error: result.error,
    securityWarnings: securityCheck.warnings,
    executionTime: result.executionTime,
  };
}

/**
 * Execute a primitive by ID or name
 */
export async function executeByIdOrName(
  idOrName: string,
  args: Record<string, unknown>,
  context?: Partial<ExecutionContext>,
  options?: ExecutionOptions
): Promise<ExecutionResult> {
  const registry = getPluginRegistry();
  const mounted = registry.getMountedPrimitive(idOrName);

  if (!mounted) {
    return {
      success: false,
      error: `Primitive not found or not mounted: ${idOrName}`,
      executionTime: 0,
    };
  }

  return executePrimitive(mounted.definition, args, context, options);
}

/**
 * Get execution statistics for a primitive
 */
export async function getExecutionStats(primitiveId: string): Promise<{
  totalExecutions: number;
  successCount: number;
  errorCount: number;
  averageExecutionTime: number;
  lastExecution?: Date;
}> {
  const stats = await prisma.primitiveExecution.aggregate({
    where: { primitiveId },
    _count: true,
    _avg: { executionTime: true },
  });

  const successCount = await prisma.primitiveExecution.count({
    where: { primitiveId, success: true },
  });

  const lastExecution = await prisma.primitiveExecution.findFirst({
    where: { primitiveId },
    orderBy: { startedAt: 'desc' },
    select: { startedAt: true },
  });

  return {
    totalExecutions: stats._count,
    successCount,
    errorCount: stats._count - successCount,
    averageExecutionTime: stats._avg.executionTime || 0,
    lastExecution: lastExecution?.startedAt,
  };
}

/**
 * Get recent executions for a primitive
 */
export async function getRecentExecutions(
  primitiveId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  success: boolean;
  error?: string;
  executionTime: number;
  startedAt: Date;
  userId?: string;
  agentId?: string;
}>> {
  const executions = await prisma.primitiveExecution.findMany({
    where: { primitiveId },
    orderBy: { startedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      success: true,
      error: true,
      executionTime: true,
      startedAt: true,
      userId: true,
      agentId: true,
    },
  });

  return executions.map(e => ({
    id: e.id,
    success: e.success,
    error: e.error || undefined,
    executionTime: e.executionTime,
    startedAt: e.startedAt,
    userId: e.userId || undefined,
    agentId: e.agentId || undefined,
  }));
}
