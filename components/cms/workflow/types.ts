/**
 * Workflow Builder Types
 *
 * Types for the React Flow-based workflow builder
 */

import type { Node, Edge } from '@xyflow/react';

/**
 * Node data for primitive nodes
 */
export interface PrimitiveNodeData extends Record<string, unknown> {
  primitiveId: string;
  primitiveName: string;
  description?: string;
  category?: string;
  icon?: string;
  inputSchema: Record<string, unknown>;
  config: Record<string, unknown>; // User-configured values
  isConfigured: boolean;
}

/**
 * Node data for trigger nodes (workflow entry points)
 */
export interface TriggerNodeData extends Record<string, unknown> {
  triggerType: 'manual' | 'schedule' | 'webhook' | 'event';
  name: string;
  config: {
    schedule?: string; // cron expression
    webhookPath?: string;
    eventType?: string;
  };
}

/**
 * Node data for condition/branch nodes
 */
export interface ConditionNodeData extends Record<string, unknown> {
  name: string;
  expression: string;
  context?: Record<string, unknown>;
}

/**
 * Node data for output/end nodes
 */
export interface OutputNodeData extends Record<string, unknown> {
  outputType: 'return' | 'log' | 'notify' | 'store';
  name: string;
  config: {
    format?: string;
    destination?: string;
  };
}

/**
 * Union type for all node data types
 */
export type WorkflowNodeData =
  | PrimitiveNodeData
  | TriggerNodeData
  | ConditionNodeData
  | OutputNodeData;

/**
 * Custom node types enum
 */
export type WorkflowNodeType =
  | 'trigger'
  | 'primitive'
  | 'condition'
  | 'output';

/**
 * Typed workflow node
 */
export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType>;

/**
 * Edge data for workflow connections
 */
export interface WorkflowEdgeData extends Record<string, unknown> {
  sourceOutput?: string; // Which output field from source
  targetInput?: string;  // Which input field on target
  condition?: string;    // Condition for conditional edges
  label?: string;
}

/**
 * Typed workflow edge
 */
export type WorkflowEdge = Edge<WorkflowEdgeData>;

/**
 * Workflow definition for saving/loading
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: Node[];
  edges: Edge[];
  // Trigger configuration
  triggerType?: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT' | 'AI_AGENT';
  triggerConfig?: Record<string, unknown>;
  // Workflow configuration
  config?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
  };
}

/**
 * Available primitive for the palette
 */
export interface AvailablePrimitive {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  inputSchema: Record<string, unknown>;
  tags: string[];
}

/**
 * Workflow builder state
 */
export interface WorkflowBuilderState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: string | null;
  selectedEdge: string | null;
  isDirty: boolean;
  isExecuting: boolean;
  executionResult?: {
    success: boolean;
    outputs: Record<string, unknown>;
    errors?: string[];
  };
}

/**
 * Node execution status for visualization
 */
export interface NodeExecutionStatus {
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  startTime?: number;
  endTime?: number;
  result?: unknown;
  error?: string;
}

/**
 * Create a new primitive node
 */
export function createPrimitiveNode(
  primitive: AvailablePrimitive,
  position: { x: number; y: number }
): WorkflowNode {
  return {
    id: `primitive-${primitive.id}-${Date.now()}`,
    type: 'primitive',
    position,
    data: {
      primitiveId: primitive.id,
      primitiveName: primitive.name,
      description: primitive.description,
      category: primitive.category,
      icon: primitive.icon,
      inputSchema: primitive.inputSchema,
      config: {},
      isConfigured: false,
    } as PrimitiveNodeData,
  };
}

/**
 * Create a new trigger node
 */
export function createTriggerNode(
  triggerType: TriggerNodeData['triggerType'],
  position: { x: number; y: number }
): WorkflowNode {
  return {
    id: `trigger-${Date.now()}`,
    type: 'trigger',
    position,
    data: {
      triggerType,
      name: `${triggerType.charAt(0).toUpperCase() + triggerType.slice(1)} Trigger`,
      config: {},
    } as TriggerNodeData,
  };
}

/**
 * Create a new condition node
 */
export function createConditionNode(
  position: { x: number; y: number }
): WorkflowNode {
  return {
    id: `condition-${Date.now()}`,
    type: 'condition',
    position,
    data: {
      name: 'Condition',
      expression: '',
    } as ConditionNodeData,
  };
}

/**
 * Create a new output node
 */
export function createOutputNode(
  outputType: OutputNodeData['outputType'],
  position: { x: number; y: number }
): WorkflowNode {
  return {
    id: `output-${Date.now()}`,
    type: 'output',
    position,
    data: {
      outputType,
      name: `${outputType.charAt(0).toUpperCase() + outputType.slice(1)} Output`,
      config: {},
    } as OutputNodeData,
  };
}

/**
 * Validate workflow connections
 */
export function validateWorkflow(
  nodes: Node[],
  edges: Edge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for at least one trigger
  const triggers = nodes.filter(n => n.type === 'trigger');
  if (triggers.length === 0) {
    errors.push('Workflow must have at least one trigger node');
  }

  // Check all nodes are connected
  const connectedNodeIds = new Set<string>();
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const disconnectedNodes = nodes.filter(
    n => !connectedNodeIds.has(n.id) && nodes.length > 1
  );
  if (disconnectedNodes.length > 0) {
    errors.push(
      `Disconnected nodes: ${disconnectedNodes.map(n => (n.data as Record<string, unknown>).name || n.id).join(', ')}`
    );
  }

  // Check primitive nodes are configured
  const unconfiguredPrimitives = nodes.filter(
    n => n.type === 'primitive' && !(n.data as PrimitiveNodeData).isConfigured
  );
  if (unconfiguredPrimitives.length > 0) {
    errors.push(
      `Unconfigured primitives: ${unconfiguredPrimitives.map(n => (n.data as PrimitiveNodeData).primitiveName).join(', ')}`
    );
  }

  return { valid: errors.length === 0, errors };
}
