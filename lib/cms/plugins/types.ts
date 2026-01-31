/**
 * Plugin System Types
 *
 * Core type definitions for the self-extending agent architecture.
 * Inspired by vmcp (Virtual Model Context Protocol) patterns.
 */

/**
 * JSON Schema types for input validation
 */
export interface JSONSchemaProperty {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  description?: string;
  enum?: string[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Primitive - Atomic unit of tool definition
 *
 * This is the core data structure representing a dynamic tool.
 * Compatible with MCP tool definitions for AI agent integration.
 */
export interface PrimitiveDefinition {
  // Identity
  id: string;
  name: string;
  version: string;

  // Schema (MCP-compatible)
  description: string;
  inputSchema: JSONSchema;

  // Implementation
  handler: string;           // JavaScript code
  dependencies?: string[];   // npm packages (allowlisted)

  // Metadata
  author?: string;
  tags?: string[];
  tier?: 'FREE' | 'PROPRIETARY';
  category?: string;
  icon?: string;

  // Runtime hints
  timeout?: number;          // ms (default: 30000)
  memory?: number;           // MB (default: 128)
  sandbox?: boolean;         // Run in sandbox (default: true)

  // Status
  enabled?: boolean;
  builtIn?: boolean;

  // Plugin relationship
  pluginId?: string | null;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mounted Primitive - A primitive that is currently active and available
 */
export interface MountedPrimitive {
  definition: PrimitiveDefinition;
  mountedAt: number;
  config?: Record<string, unknown>;
  invocationCount: number;
  lastInvoked?: number;
  compiledHandler?: Function;
}

/**
 * Plugin - Collection of primitives forming a feature unit
 */
export interface PluginDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;
  version: string;

  // Display
  icon?: string;
  color?: string;

  // Configuration
  config?: Record<string, unknown>;
  configSchema?: JSONSchema;

  // Status
  enabled?: boolean;
  installed?: boolean;
  builtIn?: boolean;

  // Author info
  author?: string;
  authorUrl?: string;
  repository?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  installedAt?: Date;
}

/**
 * Workflow - Visual composition of primitives
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;

  // React Flow data
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };

  // Configuration
  config?: Record<string, unknown>;
  variables?: Record<string, unknown>;

  // Trigger
  triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT' | 'AI_AGENT';
  triggerConfig?: Record<string, unknown>;

  // Status
  enabled?: boolean;

  // Plugin relationship
  pluginId?: string | null;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  lastRunAt?: Date;
}

/**
 * Workflow Node Data - React Flow node structure
 */
export interface WorkflowNodeData {
  id: string;
  type: 'primitive' | 'trigger' | 'condition' | 'loop' | 'output';
  position: { x: number; y: number };
  data: {
    label?: string;
    primitiveId?: string;
    config?: Record<string, unknown>;
    inputMappings?: Record<string, string>; // Map workflow vars to inputs
  };
}

/**
 * Workflow Edge Data - React Flow edge structure
 */
export interface WorkflowEdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: {
    condition?: string;  // For conditional edges
    label?: string;
  };
}

/**
 * Execution Context - Passed to primitive handlers
 */
export interface ExecutionContext {
  primitiveId: string;
  primitiveName: string;
  invocationId: string;
  startTime: number;
  timeout?: number;
  config?: Record<string, unknown>;
  debug?: boolean;

  // Workflow context (if part of workflow execution)
  workflowExecutionId?: string;
  workflowVariables?: Record<string, unknown>;

  // User context
  userId?: string;
  agentId?: string;

  // Platform info
  platform?: {
    os: 'windows' | 'mac' | 'linux';
    isWSL: boolean;
    arch: string;
  };
}

/**
 * Execution Result
 */
export interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
  invocationId?: string;
}

/**
 * Primitive Info - Simplified for listings
 */
export interface PrimitiveInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  category?: string;
  icon?: string;
  mounted: boolean;
  enabled: boolean;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plugin Info - Simplified for listings
 */
export interface PluginInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  version: string;
  icon?: string;
  color?: string;
  enabled: boolean;
  installed: boolean;
  builtIn: boolean;
  primitiveCount: number;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Registry Statistics
 */
export interface RegistryStats {
  primitiveCount: number;
  mountedCount: number;
  pluginCount: number;
  enabledPluginCount: number;
  workflowCount: number;
  totalExecutions: number;
}

/**
 * Create Primitive Request
 */
export interface CreatePrimitiveRequest {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: string;
  category?: string;
  tags?: string[];
  icon?: string;
  timeout?: number;
  pluginId?: string;
  autoMount?: boolean;
}

/**
 * Update Primitive Request
 */
export interface UpdatePrimitiveRequest {
  description?: string;
  inputSchema?: JSONSchema;
  handler?: string;
  category?: string;
  tags?: string[];
  icon?: string;
  timeout?: number;
  enabled?: boolean;
}

/**
 * Create Plugin Request
 */
export interface CreatePluginRequest {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  config?: Record<string, unknown>;
  configSchema?: JSONSchema;
  author?: string;
}

/**
 * Standard Response Format
 */
export interface PluginResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  hint?: string;
}

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Increment semver patch version
 */
export function incrementVersion(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

/**
 * Slugify a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
