/**
 * VMCP Types
 *
 * Type definitions for the Virtualized Model Context Protocol.
 * Database-driven dynamic tool management for AI agents.
 */

import type { Primitive } from '@prisma/client';

/**
 * JSON Schema type for tool input validation
 */
export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Tool execution context - available to handlers
 */
export interface ToolExecutionContext {
  toolId: string;
  toolName: string;
  userId?: string;
  agentId?: string;
  // Database access helpers
  db: {
    products: {
      findMany: (args?: unknown) => Promise<unknown[]>;
      findUnique: (args: unknown) => Promise<unknown>;
      create: (args: unknown) => Promise<unknown>;
      update: (args: unknown) => Promise<unknown>;
      delete: (args: unknown) => Promise<unknown>;
    };
    orders: {
      findMany: (args?: unknown) => Promise<unknown[]>;
      findUnique: (args: unknown) => Promise<unknown>;
      update: (args: unknown) => Promise<unknown>;
    };
    customers: {
      findMany: (args?: unknown) => Promise<unknown[]>;
      findUnique: (args: unknown) => Promise<unknown>;
    };
    pages: {
      findMany: (args?: unknown) => Promise<unknown[]>;
      findUnique: (args: unknown) => Promise<unknown>;
      create: (args: unknown) => Promise<unknown>;
      update: (args: unknown) => Promise<unknown>;
    };
    blogPosts: {
      findMany: (args?: unknown) => Promise<unknown[]>;
      findUnique: (args: unknown) => Promise<unknown>;
      create: (args: unknown) => Promise<unknown>;
      update: (args: unknown) => Promise<unknown>;
    };
  };
  // Utility functions
  utils: {
    formatCurrency: (cents: number) => string;
    formatDate: (date: Date) => string;
    generateId: () => string;
    sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  };
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  executionTime: number;
}

/**
 * Mounted tool - active and ready for use
 */
export interface MountedTool {
  primitive: Primitive;
  mountedAt: Date;
  invocationCount: number;
  lastInvoked?: Date;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  totalTools: number;
  mountedTools: number;
  byCategory: Record<string, number>;
  byTier: Record<string, number>;
  recentExecutions: number;
}

/**
 * Tool template for quick creation
 */
export interface ToolTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: JSONSchema;
  handlerTemplate: string;
  tags: string[];
}

/**
 * Create tool input
 */
export interface CreateToolInput {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: string;
  category?: string;
  tags?: string[];
  timeout?: number;
  sandbox?: boolean;
}

/**
 * Update tool input
 */
export interface UpdateToolInput {
  id: string;
  name?: string;
  description?: string;
  inputSchema?: JSONSchema;
  handler?: string;
  category?: string;
  tags?: string[];
  timeout?: number;
  sandbox?: boolean;
}
