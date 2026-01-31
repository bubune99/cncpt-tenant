/**
 * Plugin System - Self-Extending Agent Architecture
 *
 * This module provides a vmcp-inspired plugin system that enables:
 * - Dynamic primitive (tool) creation and management
 * - Secure sandboxed execution
 * - Plugin packaging of related primitives
 * - Visual workflow composition (React Flow)
 * - AI agent integration via MCP-compatible tools
 */

// Types
export type {
  JSONSchema,
  JSONSchemaProperty,
  PrimitiveDefinition,
  MountedPrimitive,
  PluginDefinition,
  WorkflowDefinition,
  WorkflowNodeData,
  WorkflowEdgeData,
  ExecutionContext,
  ExecutionResult,
  PrimitiveInfo,
  PluginInfo,
  RegistryStats,
  CreatePrimitiveRequest,
  UpdatePrimitiveRequest,
  CreatePluginRequest,
  PluginResponse,
} from './types';

// Type utilities
export { generateId, incrementVersion, slugify } from './types';

// Sandbox
export {
  validateHandlerSecurity,
  createSandboxFunction,
  executeSandbox,
  getOrCompileHandler,
  invalidateHandler,
  clearHandlerCache,
  type SandboxConfig,
  type SandboxResult,
} from './sandbox';

// Registry
export {
  PluginRegistry,
  getPluginRegistry,
  resetPluginRegistry,
} from './registry';

// Executor
export {
  executePrimitive,
  executeByIdOrName,
  testPrimitive,
  getExecutionStats,
  getRecentExecutions,
  type ExecutionOptions,
} from './executor';

// Built-in primitives loader
export { loadBuiltInPrimitives } from './built-in';
