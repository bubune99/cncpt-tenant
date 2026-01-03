/**
 * Workflow Context & State Management
 *
 * Manages execution context, variable resolution, and state
 * throughout workflow execution.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  WorkflowContext,
  WorkflowEvent,
  InputMapping,
  WorkflowCondition,
} from './types';

// =============================================================================
// CONTEXT CREATION
// =============================================================================

/**
 * Create a new workflow execution context
 */
export function createWorkflowContext(
  workflowId: string,
  trigger: {
    type: string;
    data: unknown;
    event?: WorkflowEvent;
  },
  initialVariables?: Record<string, unknown>
): WorkflowContext {
  return {
    executionId: uuidv4(),
    workflowId,
    startedAt: new Date(),
    trigger,
    variables: initialVariables || {},
    nodeOutputs: {},
    executedNodes: [],
    errors: [],
  };
}

// =============================================================================
// VARIABLE RESOLUTION
// =============================================================================

/**
 * Resolve a value from context using path notation
 * Supports: trigger.data.field, variables.name, nodes.nodeId.field
 */
export function resolveValue(context: WorkflowContext, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = context;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== 'object') {
      return undefined;
    }

    // Handle special prefixes
    if (part === 'trigger') {
      current = context.trigger;
    } else if (part === 'variables') {
      current = context.variables;
    } else if (part === 'nodes') {
      current = context.nodeOutputs;
    } else if (part === 'event') {
      current = context.trigger.event;
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/**
 * Resolve input mapping to actual value
 */
export function resolveInputMapping(
  mapping: string | InputMapping,
  context: WorkflowContext
): unknown {
  // Simple string path
  if (typeof mapping === 'string') {
    // Check if it's a template string
    if (mapping.includes('{{')) {
      return resolveTemplate(mapping, context);
    }
    return resolveValue(context, mapping);
  }

  // Input mapping object
  switch (mapping.type) {
    case 'static':
      return mapping.value;

    case 'reference':
      return resolveValue(context, mapping.path || mapping.value);

    case 'expression':
      return evaluateExpression(mapping.value, context);

    case 'template':
      return resolveTemplate(mapping.value, context);

    default:
      return mapping.value;
  }
}

/**
 * Resolve all input mappings for a node
 */
export function resolveNodeInputs(
  inputMapping: Record<string, string | InputMapping> | undefined,
  context: WorkflowContext
): Record<string, unknown> {
  if (!inputMapping) return {};

  const resolved: Record<string, unknown> = {};

  for (const [key, mapping] of Object.entries(inputMapping)) {
    resolved[key] = resolveInputMapping(mapping, context);
  }

  return resolved;
}

/**
 * Resolve template string with {{path}} placeholders
 */
export function resolveTemplate(template: string, context: WorkflowContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const value = resolveValue(context, path.trim());
    return value !== undefined && value !== null ? String(value) : '';
  });
}

// =============================================================================
// EXPRESSION EVALUATION
// =============================================================================

/**
 * Safely evaluate an expression against context
 * Supports basic operations and context references
 */
export function evaluateExpression(expression: string, context: WorkflowContext): unknown {
  // Create a safe evaluation context
  const safeContext = {
    trigger: context.trigger,
    variables: context.variables,
    nodes: context.nodeOutputs,
    event: context.trigger.event,
    // Helper functions
    $get: (path: string) => resolveValue(context, path),
    $len: (arr: unknown) => Array.isArray(arr) ? arr.length : 0,
    $exists: (path: string) => resolveValue(context, path) !== undefined,
    $empty: (val: unknown) => val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0),
    $now: () => new Date().toISOString(),
    $lower: (str: unknown) => typeof str === 'string' ? str.toLowerCase() : str,
    $upper: (str: unknown) => typeof str === 'string' ? str.toUpperCase() : str,
    $trim: (str: unknown) => typeof str === 'string' ? str.trim() : str,
    $number: (val: unknown) => Number(val),
    $string: (val: unknown) => String(val),
    $json: (val: unknown) => JSON.stringify(val),
    $parse: (str: unknown) => typeof str === 'string' ? JSON.parse(str) : str,
  };

  try {
    // Create function with safe context
    const fn = new Function(
      ...Object.keys(safeContext),
      `"use strict"; return (${expression});`
    );

    return fn(...Object.values(safeContext));
  } catch (error) {
    console.error('[WorkflowContext] Expression evaluation error:', error);
    return undefined;
  }
}

// =============================================================================
// CONDITION EVALUATION
// =============================================================================

/**
 * Evaluate a workflow condition
 */
export function evaluateCondition(
  condition: WorkflowCondition,
  context: WorkflowContext
): boolean {
  switch (condition.type) {
    case 'simple':
      return evaluateSimpleCondition(condition, context);

    case 'expression':
      return Boolean(evaluateExpression(condition.expression || 'false', context));

    case 'all':
      return (condition.conditions || []).every((c) => evaluateCondition(c, context));

    case 'any':
      return (condition.conditions || []).some((c) => evaluateCondition(c, context));

    case 'none':
      return !(condition.conditions || []).some((c) => evaluateCondition(c, context));

    default:
      return true;
  }
}

/**
 * Evaluate a simple condition
 */
function evaluateSimpleCondition(
  condition: WorkflowCondition,
  context: WorkflowContext
): boolean {
  const fieldValue = condition.field ? resolveValue(context, condition.field) : undefined;
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return fieldValue === compareValue;

    case 'neq':
      return fieldValue !== compareValue;

    case 'gt':
      return typeof fieldValue === 'number' && typeof compareValue === 'number' && fieldValue > compareValue;

    case 'gte':
      return typeof fieldValue === 'number' && typeof compareValue === 'number' && fieldValue >= compareValue;

    case 'lt':
      return typeof fieldValue === 'number' && typeof compareValue === 'number' && fieldValue < compareValue;

    case 'lte':
      return typeof fieldValue === 'number' && typeof compareValue === 'number' && fieldValue <= compareValue;

    case 'contains':
      if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
        return fieldValue.includes(compareValue);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(compareValue);
      }
      return false;

    case 'startsWith':
      return typeof fieldValue === 'string' && typeof compareValue === 'string' && fieldValue.startsWith(compareValue);

    case 'endsWith':
      return typeof fieldValue === 'string' && typeof compareValue === 'string' && fieldValue.endsWith(compareValue);

    case 'in':
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);

    case 'notIn':
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);

    case 'exists':
      return compareValue ? fieldValue !== undefined && fieldValue !== null : fieldValue === undefined || fieldValue === null;

    default:
      return true;
  }
}

// =============================================================================
// CONTEXT MUTATION
// =============================================================================

/**
 * Update context with node output
 */
export function setNodeOutput(
  context: WorkflowContext,
  nodeId: string,
  output: unknown
): WorkflowContext {
  return {
    ...context,
    nodeOutputs: {
      ...context.nodeOutputs,
      [nodeId]: output,
    },
    executedNodes: [...context.executedNodes, nodeId],
    currentNodeId: nodeId,
  };
}

/**
 * Set a variable in context
 */
export function setVariable(
  context: WorkflowContext,
  name: string,
  value: unknown
): WorkflowContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      [name]: value,
    },
  };
}

/**
 * Add an error to context
 */
export function addError(
  context: WorkflowContext,
  nodeId: string,
  error: string
): WorkflowContext {
  return {
    ...context,
    errors: [
      ...context.errors,
      {
        nodeId,
        error,
        timestamp: new Date(),
      },
    ],
  };
}

// =============================================================================
// LOOP CONTEXT
// =============================================================================

/**
 * Create iteration context for loop execution
 */
export function createIterationContext(
  context: WorkflowContext,
  itemVariable: string,
  item: unknown,
  indexVariable: string | undefined,
  index: number
): WorkflowContext {
  const variables = {
    ...context.variables,
    [itemVariable]: item,
  };

  if (indexVariable) {
    variables[indexVariable] = index;
  }

  return {
    ...context,
    variables,
  };
}

// =============================================================================
// CONTEXT SERIALIZATION
// =============================================================================

/**
 * Serialize context for storage (e.g., for pause/resume)
 */
export function serializeContext(context: WorkflowContext): string {
  return JSON.stringify({
    ...context,
    startedAt: context.startedAt.toISOString(),
    errors: context.errors.map((e) => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
    })),
  });
}

/**
 * Deserialize context from storage
 */
export function deserializeContext(serialized: string): WorkflowContext {
  const parsed = JSON.parse(serialized);
  return {
    ...parsed,
    startedAt: new Date(parsed.startedAt),
    errors: parsed.errors.map((e: { nodeId: string; error: string; timestamp: string }) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    })),
  };
}

// =============================================================================
// CONTEXT UTILITIES
// =============================================================================

/**
 * Get a summary of context for logging
 */
export function getContextSummary(context: WorkflowContext): Record<string, unknown> {
  return {
    executionId: context.executionId,
    workflowId: context.workflowId,
    triggerType: context.trigger.type,
    executedNodes: context.executedNodes.length,
    variableCount: Object.keys(context.variables).length,
    errorCount: context.errors.length,
    hasErrors: context.errors.length > 0,
  };
}

/**
 * Clone context for branch execution
 */
export function cloneContext(context: WorkflowContext): WorkflowContext {
  return JSON.parse(JSON.stringify(context));
}
