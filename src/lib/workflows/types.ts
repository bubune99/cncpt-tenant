/**
 * Workflow System Types
 *
 * TypeScript definitions for the event-driven workflow engine.
 */

import type { Workflow, WorkflowNode, Primitive, WorkflowExecution } from '@prisma/client';

// =============================================================================
// EVENT TYPES
// =============================================================================

export type WorkflowEventType =
  // Order events
  | 'order.created'
  | 'order.paid'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'order.refunded'
  // User events
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.subscribed'
  | 'user.unsubscribed'
  // Product events
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.low_stock'
  | 'product.out_of_stock'
  // Content events
  | 'page.created'
  | 'page.published'
  | 'page.updated'
  | 'blog.created'
  | 'blog.published'
  | 'blog.updated'
  // Payment events
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.created'
  | 'subscription.cancelled'
  // Form events
  | 'form.submitted'
  | 'contact.created'
  // Webhook events
  | 'webhook.received'
  // Custom events
  | 'custom'
  | string;

export interface WorkflowEvent<T = unknown> {
  id: string;
  type: WorkflowEventType;
  timestamp: Date;
  data: T;
  metadata?: {
    source?: string;
    userId?: string;
    correlationId?: string;
    [key: string]: unknown;
  };
}

export interface EventSubscription {
  id: string;
  eventType: WorkflowEventType | WorkflowEventType[];
  handler: (event: WorkflowEvent) => Promise<void>;
  filter?: (event: WorkflowEvent) => boolean;
  priority?: number;
}

// =============================================================================
// WORKFLOW NODE TYPES
// =============================================================================

export type WorkflowNodeType =
  | 'trigger'
  | 'primitive'
  | 'condition'
  | 'loop'
  | 'delay'
  | 'parallel'
  | 'output';

export interface WorkflowNodeConfig {
  // Input mapping from previous nodes or trigger data
  inputMapping?: Record<string, string | InputMapping>;
  // Condition for conditional nodes
  condition?: WorkflowCondition;
  // Loop configuration
  loop?: {
    collection: string; // Path to array in context
    itemVariable: string;
    indexVariable?: string;
  };
  // Delay configuration
  delay?: {
    duration: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
  };
  // Primitive-specific configuration
  primitiveConfig?: Record<string, unknown>;
}

export interface InputMapping {
  type: 'static' | 'reference' | 'expression' | 'template';
  value: string;
  path?: string; // For reference type - path to value in context
}

export interface WorkflowCondition {
  type: 'simple' | 'expression' | 'all' | 'any' | 'none';
  // Simple condition
  field?: string;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn' | 'exists';
  value?: unknown;
  // Expression condition
  expression?: string;
  // Compound conditions
  conditions?: WorkflowCondition[];
}

// =============================================================================
// WORKFLOW EXECUTION
// =============================================================================

export type WorkflowExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WorkflowContext {
  // Execution metadata
  executionId: string;
  workflowId: string;
  startedAt: Date;

  // Trigger data
  trigger: {
    type: string;
    data: unknown;
    event?: WorkflowEvent;
  };

  // Variables and state
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;

  // Current execution path
  currentNodeId?: string;
  executedNodes: string[];

  // Error tracking
  errors: Array<{
    nodeId: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
  skipped?: boolean;
  skipReason?: string;
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  result?: unknown;
  error?: string;
  nodeResults: NodeExecutionResult[];
}

// =============================================================================
// WORKFLOW TEMPLATES
// =============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowTemplateCategory;
  triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT' | 'AI_AGENT';

  // Template data (React Flow format)
  nodes: WorkflowTemplateNode[];
  edges: WorkflowTemplateEdge[];

  // Configuration hints
  requiredPrimitives: string[];
  configSchema?: Record<string, unknown>;

  // Metadata
  icon?: string;
  tags?: string[];
}

export type WorkflowTemplateCategory =
  | 'ecommerce'
  | 'marketing'
  | 'notifications'
  | 'content'
  | 'integrations'
  | 'custom';

export interface WorkflowTemplateNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: WorkflowNodeType;
    primitiveId?: string;
    config?: WorkflowNodeConfig;
  };
}

export interface WorkflowTemplateEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: {
    condition?: WorkflowCondition;
    label?: string;
  };
}

// =============================================================================
// ACTION HANDLERS
// =============================================================================

export type ActionHandler<TInput = Record<string, unknown>, TOutput = unknown> = (
  input: TInput,
  context: WorkflowContext
) => Promise<TOutput>;

export interface ActionDefinition<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string;
  description: string;
  category: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  handler: ActionHandler<TInput, TOutput>;
}

// =============================================================================
// DATABASE TYPES WITH RELATIONS
// =============================================================================

export type WorkflowWithNodes = Workflow & {
  workflowNodes: (WorkflowNode & {
    primitive: Primitive | null;
  })[];
};

export type WorkflowExecutionWithDetails = WorkflowExecution & {
  workflow: Workflow;
};

// =============================================================================
// API TYPES
// =============================================================================

export interface CreateWorkflowInput {
  name: string;
  slug?: string;
  description?: string;
  nodes: WorkflowTemplateNode[];
  edges: WorkflowTemplateEdge[];
  triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT' | 'AI_AGENT';
  triggerConfig?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  enabled?: boolean;
  pluginId?: string;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  nodes?: WorkflowTemplateNode[];
  edges?: WorkflowTemplateEdge[];
  triggerConfig?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  enabled?: boolean;
}

export interface TriggerWorkflowInput {
  workflowId: string;
  data?: unknown;
  userId?: string;
  agentId?: string;
}

export interface WorkflowListOptions {
  enabled?: boolean;
  triggerType?: string;
  pluginId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
