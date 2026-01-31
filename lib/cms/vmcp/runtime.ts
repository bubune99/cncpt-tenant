/**
 * VMCP Runtime
 *
 * Sandboxed execution environment for dynamic tools.
 * Executes JavaScript handlers with controlled access to CMS data.
 */

import { prisma } from '../db';
import type { Primitive } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { ToolExecutionContext, ToolExecutionResult } from './types';
import { recordInvocation } from './registry';
import { nanoid } from 'nanoid';

/**
 * Execute a tool with the given input
 */
export async function executeTool(
  primitive: Primitive,
  input: Record<string, unknown>,
  options?: {
    userId?: string;
    agentId?: string;
  }
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  // Create execution context
  const context = createExecutionContext(primitive.id, primitive.name, options);

  try {
    // Validate input against schema
    validateInput(input, primitive.inputSchema as Record<string, unknown>);

    // Execute the handler
    const output = await executeHandler(primitive.handler, input, context, primitive.timeout);

    const executionTime = Date.now() - startTime;

    // Record execution
    await recordExecution({
      primitiveId: primitive.id,
      userId: options?.userId,
      agentId: options?.agentId,
      input,
      output,
      success: true,
      executionTime,
    });

    recordInvocation(primitive.id);

    return {
      success: true,
      output,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Record failed execution
    await recordExecution({
      primitiveId: primitive.id,
      userId: options?.userId,
      agentId: options?.agentId,
      input,
      output: null,
      success: false,
      error: errorMessage,
      executionTime,
    });

    return {
      success: false,
      error: errorMessage,
      executionTime,
    };
  }
}

/**
 * Execute handler code in a sandboxed environment
 */
async function executeHandler(
  handler: string,
  input: Record<string, unknown>,
  context: ToolExecutionContext,
  timeout: number
): Promise<unknown> {
  // Create a promise that rejects after timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Tool execution timed out')), timeout);
  });

  // Create the execution promise
  const executionPromise = (async () => {
    // Build the sandboxed function
    // The handler has access to: input, context, console
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    const sandboxedFn = new AsyncFunction(
      'input',
      'context',
      'console',
      `
      "use strict";
      ${handler}
      `
    );

    // Create a safe console
    const safeConsole = {
      log: (...args: unknown[]) => console.log('[Tool]', ...args),
      warn: (...args: unknown[]) => console.warn('[Tool]', ...args),
      error: (...args: unknown[]) => console.error('[Tool]', ...args),
    };

    return await sandboxedFn(input, context, safeConsole);
  })();

  // Race between execution and timeout
  return Promise.race([executionPromise, timeoutPromise]);
}

/**
 * Create execution context with CMS data access
 */
function createExecutionContext(
  toolId: string,
  toolName: string,
  options?: { userId?: string; agentId?: string }
): ToolExecutionContext {
  return {
    toolId,
    toolName,
    userId: options?.userId,
    agentId: options?.agentId,

    // Database access helpers
    db: {
      products: {
        findMany: async (args) =>
          prisma.product.findMany(args as Parameters<typeof prisma.product.findMany>[0]),
        findUnique: async (args) =>
          prisma.product.findUnique(args as Parameters<typeof prisma.product.findUnique>[0]),
        create: async (args) =>
          prisma.product.create(args as Parameters<typeof prisma.product.create>[0]),
        update: async (args) =>
          prisma.product.update(args as Parameters<typeof prisma.product.update>[0]),
        delete: async (args) =>
          prisma.product.delete(args as Parameters<typeof prisma.product.delete>[0]),
      },
      orders: {
        findMany: async (args) =>
          prisma.order.findMany(args as Parameters<typeof prisma.order.findMany>[0]),
        findUnique: async (args) =>
          prisma.order.findUnique(args as Parameters<typeof prisma.order.findUnique>[0]),
        update: async (args) =>
          prisma.order.update(args as Parameters<typeof prisma.order.update>[0]),
      },
      customers: {
        findMany: async (args) =>
          prisma.customer.findMany(args as Parameters<typeof prisma.customer.findMany>[0]),
        findUnique: async (args) =>
          prisma.customer.findUnique(args as Parameters<typeof prisma.customer.findUnique>[0]),
      },
      pages: {
        findMany: async (args) =>
          prisma.page.findMany(args as Parameters<typeof prisma.page.findMany>[0]),
        findUnique: async (args) =>
          prisma.page.findUnique(args as Parameters<typeof prisma.page.findUnique>[0]),
        create: async (args) =>
          prisma.page.create(args as Parameters<typeof prisma.page.create>[0]),
        update: async (args) =>
          prisma.page.update(args as Parameters<typeof prisma.page.update>[0]),
      },
      blogPosts: {
        findMany: async (args) =>
          prisma.blogPost.findMany(args as Parameters<typeof prisma.blogPost.findMany>[0]),
        findUnique: async (args) =>
          prisma.blogPost.findUnique(args as Parameters<typeof prisma.blogPost.findUnique>[0]),
        create: async (args) =>
          prisma.blogPost.create(args as Parameters<typeof prisma.blogPost.create>[0]),
        update: async (args) =>
          prisma.blogPost.update(args as Parameters<typeof prisma.blogPost.update>[0]),
      },
    },

    // Utility functions
    utils: {
      formatCurrency: (cents: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(cents / 100);
      },
      formatDate: (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
      },
      generateId: () => nanoid(),
      sendEmail: async (to: string, subject: string, body: string) => {
        // Placeholder - integrate with email service
        console.log(`[Tool] Email to ${to}: ${subject}`);
        // TODO: Integrate with actual email service
      },
    },
  };
}

/**
 * Validate input against JSON schema
 */
function validateInput(
  input: Record<string, unknown>,
  schema: Record<string, unknown>
): void {
  const properties = schema.properties as Record<string, { type: string }> | undefined;
  const required = schema.required as string[] | undefined;

  if (required) {
    for (const field of required) {
      if (!(field in input)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  if (properties) {
    for (const [key, value] of Object.entries(input)) {
      const fieldSchema = properties[key];
      if (fieldSchema) {
        const expectedType = fieldSchema.type;
        const actualType = Array.isArray(value) ? 'array' : typeof value;

        if (expectedType && expectedType !== actualType) {
          // Allow number for integer type
          if (!(expectedType === 'integer' && actualType === 'number')) {
            throw new Error(
              `Invalid type for field ${key}: expected ${expectedType}, got ${actualType}`
            );
          }
        }
      }
    }
  }
}

/**
 * Record execution in database
 */
async function recordExecution(data: {
  primitiveId: string;
  userId?: string;
  agentId?: string;
  input: Record<string, unknown>;
  output: unknown;
  success: boolean;
  error?: string;
  executionTime: number;
}): Promise<void> {
  try {
    await prisma.primitiveExecution.create({
      data: {
        primitiveId: data.primitiveId,
        userId: data.userId,
        agentId: data.agentId,
        input: data.input as Prisma.InputJsonValue,
        output: data.output !== null ? (data.output as Prisma.InputJsonValue) : Prisma.JsonNull,
        success: data.success,
        error: data.error,
        startedAt: new Date(Date.now() - data.executionTime),
        completedAt: new Date(),
        executionTime: data.executionTime,
      },
    });
  } catch (error) {
    console.error('[VMCP] Failed to record execution:', error);
  }
}

/**
 * Test a tool with sample input
 */
export async function testTool(
  primitive: Primitive,
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  return executeTool(primitive, input, { agentId: 'test' });
}
