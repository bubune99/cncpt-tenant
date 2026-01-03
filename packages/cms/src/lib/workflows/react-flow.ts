/**
 * React Flow Integration
 *
 * Utilities for integrating workflows with React Flow visual editor.
 * Handles node/edge conversion, validation, and workflow serialization.
 */

// React Flow types (defined locally to avoid hard dependency)
// These match the reactflow package types for compatibility
export interface XYPosition {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Node<T = unknown> {
  id: string;
  type?: string;
  position: XYPosition;
  data: T;
  width?: number;
  height?: number;
  selected?: boolean;
  dragging?: boolean;
  hidden?: boolean;
}

export interface Edge<T = unknown> {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  hidden?: boolean;
  data?: T;
  label?: string;
  selected?: boolean;
}

import type {
  WorkflowTemplateNode,
  WorkflowTemplateEdge,
  WorkflowNodeType,
  WorkflowNodeConfig,
  WorkflowCondition,
} from './types';

// =============================================================================
// NODE TYPES FOR REACT FLOW
// =============================================================================

export interface WorkflowNodeData {
  label: string;
  nodeType: WorkflowNodeType;
  primitiveId?: string;
  primitiveName?: string;
  primitiveIcon?: string;
  config?: WorkflowNodeConfig;
  // UI state
  isExecuting?: boolean;
  isCompleted?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  executionTime?: number;
}

export interface WorkflowEdgeData {
  condition?: WorkflowCondition;
  label?: string;
}

export type WorkflowReactFlowNode = Node<WorkflowNodeData>;
export type WorkflowReactFlowEdge = Edge<WorkflowEdgeData>;

// =============================================================================
// NODE DEFINITIONS
// =============================================================================

export interface NodeTypeDefinition {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: 'trigger' | 'action' | 'control' | 'output';
  handles: {
    inputs: number;
    outputs: number;
    conditionalOutputs?: string[];
  };
  defaultConfig?: WorkflowNodeConfig;
}

export const nodeTypeDefinitions: Record<WorkflowNodeType, NodeTypeDefinition> = {
  trigger: {
    type: 'trigger',
    label: 'Trigger',
    description: 'Starting point of the workflow',
    icon: 'Zap',
    color: '#f59e0b',
    category: 'trigger',
    handles: { inputs: 0, outputs: 1 },
  },
  primitive: {
    type: 'primitive',
    label: 'Action',
    description: 'Execute a primitive action',
    icon: 'Play',
    color: '#3b82f6',
    category: 'action',
    handles: { inputs: 1, outputs: 1 },
  },
  condition: {
    type: 'condition',
    label: 'Condition',
    description: 'Branch based on conditions',
    icon: 'GitBranch',
    color: '#8b5cf6',
    category: 'control',
    handles: { inputs: 1, outputs: 2, conditionalOutputs: ['true', 'false'] },
  },
  loop: {
    type: 'loop',
    label: 'Loop',
    description: 'Iterate over a collection',
    icon: 'Repeat',
    color: '#10b981',
    category: 'control',
    handles: { inputs: 1, outputs: 2, conditionalOutputs: ['body', 'complete'] },
  },
  delay: {
    type: 'delay',
    label: 'Delay',
    description: 'Wait for a specified duration',
    icon: 'Clock',
    color: '#6b7280',
    category: 'control',
    handles: { inputs: 1, outputs: 1 },
  },
  parallel: {
    type: 'parallel',
    label: 'Parallel',
    description: 'Execute multiple branches simultaneously',
    icon: 'GitMerge',
    color: '#ec4899',
    category: 'control',
    handles: { inputs: 1, outputs: 4 },
  },
  output: {
    type: 'output',
    label: 'Output',
    description: 'Workflow output/result',
    icon: 'Flag',
    color: '#14b8a6',
    category: 'output',
    handles: { inputs: 1, outputs: 0 },
  },
};

// =============================================================================
// CONVERSION UTILITIES
// =============================================================================

/**
 * Convert workflow template nodes to React Flow nodes
 */
export function toReactFlowNodes(
  templateNodes: WorkflowTemplateNode[]
): WorkflowReactFlowNode[] {
  return templateNodes.map((node) => ({
    id: node.id,
    type: getReactFlowNodeType(node.data.nodeType),
    position: node.position,
    data: {
      label: node.data.label,
      nodeType: node.data.nodeType,
      primitiveId: node.data.primitiveId,
      config: node.data.config,
    },
  }));
}

/**
 * Convert workflow template edges to React Flow edges
 */
export function toReactFlowEdges(
  templateEdges: WorkflowTemplateEdge[]
): WorkflowReactFlowEdge[] {
  return templateEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.data?.condition ? 'conditional' : 'default',
    animated: false,
    data: edge.data,
  }));
}

/**
 * Convert React Flow nodes back to workflow template format
 */
export function fromReactFlowNodes(
  nodes: WorkflowReactFlowNode[]
): WorkflowTemplateNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.data.nodeType,
    position: node.position,
    data: {
      label: node.data.label,
      nodeType: node.data.nodeType,
      primitiveId: node.data.primitiveId,
      config: node.data.config,
    },
  }));
}

/**
 * Convert React Flow edges back to workflow template format
 */
export function fromReactFlowEdges(
  edges: WorkflowReactFlowEdge[]
): WorkflowTemplateEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
    data: edge.data,
  }));
}

/**
 * Get React Flow node type from workflow node type
 */
function getReactFlowNodeType(nodeType: WorkflowNodeType): string {
  // Map to custom node types if you have them registered
  return `workflow-${nodeType}`;
}

// =============================================================================
// WORKFLOW VALIDATION
// =============================================================================

export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
}

export interface WorkflowValidationError {
  type: 'error';
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface WorkflowValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  nodeId?: string;
}

/**
 * Validate a workflow graph
 */
export function validateWorkflow(
  nodes: WorkflowReactFlowNode[],
  edges: WorkflowReactFlowEdge[]
): WorkflowValidationResult {
  const errors: WorkflowValidationError[] = [];
  const warnings: WorkflowValidationWarning[] = [];

  // Check for trigger node
  const triggerNodes = nodes.filter((n) => n.data.nodeType === 'trigger');
  if (triggerNodes.length === 0) {
    errors.push({
      type: 'error',
      code: 'NO_TRIGGER',
      message: 'Workflow must have at least one trigger node',
    });
  }
  if (triggerNodes.length > 1) {
    warnings.push({
      type: 'warning',
      code: 'MULTIPLE_TRIGGERS',
      message: 'Workflow has multiple trigger nodes',
    });
  }

  // Check for disconnected nodes
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  nodes.forEach((node) => {
    // Trigger nodes don't need incoming connections
    if (node.data.nodeType === 'trigger') {
      if (!edges.some((e) => e.source === node.id)) {
        warnings.push({
          type: 'warning',
          code: 'DEAD_END_TRIGGER',
          message: `Trigger node "${node.data.label}" has no outgoing connections`,
          nodeId: node.id,
        });
      }
      return;
    }

    // Other nodes should have incoming connections
    if (!edges.some((e) => e.target === node.id)) {
      errors.push({
        type: 'error',
        code: 'DISCONNECTED_NODE',
        message: `Node "${node.data.label}" has no incoming connections`,
        nodeId: node.id,
      });
    }
  });

  // Check primitive nodes have primitiveId
  nodes
    .filter((n) => n.data.nodeType === 'primitive')
    .forEach((node) => {
      if (!node.data.primitiveId) {
        errors.push({
          type: 'error',
          code: 'MISSING_PRIMITIVE',
          message: `Action node "${node.data.label}" has no primitive assigned`,
          nodeId: node.id,
        });
      }
    });

  // Check condition nodes have conditions
  nodes
    .filter((n) => n.data.nodeType === 'condition')
    .forEach((node) => {
      if (!node.data.config?.condition) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_CONDITION',
          message: `Condition node "${node.data.label}" has no condition configured`,
          nodeId: node.id,
        });
      }
    });

  // Check for cycles (simplified - just check direct self-loops)
  edges.forEach((edge) => {
    if (edge.source === edge.target) {
      errors.push({
        type: 'error',
        code: 'SELF_LOOP',
        message: 'Edge creates a self-loop',
        edgeId: edge.id,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// LAYOUT UTILITIES
// =============================================================================

/**
 * Auto-layout nodes in a hierarchical fashion
 */
export function autoLayoutNodes(
  nodes: WorkflowReactFlowNode[],
  edges: WorkflowReactFlowEdge[],
  options?: {
    direction?: 'TB' | 'LR';
    nodeSpacingX?: number;
    nodeSpacingY?: number;
  }
): WorkflowReactFlowNode[] {
  const direction = options?.direction || 'TB';
  const spacingX = options?.nodeSpacingX || 200;
  const spacingY = options?.nodeSpacingY || 100;

  // Build adjacency list
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();

  nodes.forEach((node) => {
    children.set(node.id, []);
    parents.set(node.id, []);
  });

  edges.forEach((edge) => {
    children.get(edge.source)?.push(edge.target);
    parents.get(edge.target)?.push(edge.source);
  });

  // Find root nodes (no parents or trigger nodes)
  const rootNodes = nodes.filter(
    (n) =>
      n.data.nodeType === 'trigger' || parents.get(n.id)?.length === 0
  );

  // Calculate levels using BFS
  const levels = new Map<string, number>();
  const queue: { id: string; level: number }[] = rootNodes.map((n) => ({
    id: n.id,
    level: 0,
  }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;

    if (levels.has(id)) continue;
    levels.set(id, level);

    const nodeChildren = children.get(id) || [];
    nodeChildren.forEach((childId) => {
      queue.push({ id: childId, level: level + 1 });
    });
  }

  // Group nodes by level
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(nodeId);
  });

  // Position nodes
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return nodes.map((node) => {
    const level = levels.get(node.id) || 0;
    const nodesAtLevel = levelGroups.get(level) || [];
    const indexAtLevel = nodesAtLevel.indexOf(node.id);

    const totalWidth = (nodesAtLevel.length - 1) * spacingX;
    const startX = -totalWidth / 2;

    let position: XYPosition;
    if (direction === 'TB') {
      position = {
        x: startX + indexAtLevel * spacingX,
        y: level * spacingY,
      };
    } else {
      position = {
        x: level * spacingX,
        y: startX + indexAtLevel * spacingY,
      };
    }

    return {
      ...node,
      position,
    };
  });
}

// =============================================================================
// NODE CREATION HELPERS
// =============================================================================

let nodeIdCounter = 0;

/**
 * Generate a unique node ID
 */
export function generateNodeId(): string {
  return `node_${Date.now()}_${++nodeIdCounter}`;
}

/**
 * Generate a unique edge ID
 */
export function generateEdgeId(source: string, target: string): string {
  return `edge_${source}_${target}_${++nodeIdCounter}`;
}

/**
 * Create a new trigger node
 */
export function createTriggerNode(
  position: XYPosition,
  triggerType: 'manual' | 'schedule' | 'webhook' | 'event'
): WorkflowReactFlowNode {
  return {
    id: generateNodeId(),
    type: 'workflow-trigger',
    position,
    data: {
      label: `${triggerType.charAt(0).toUpperCase() + triggerType.slice(1)} Trigger`,
      nodeType: 'trigger',
      config: {},
    },
  };
}

/**
 * Create a new primitive/action node
 */
export function createPrimitiveNode(
  position: XYPosition,
  primitiveId: string,
  primitiveName: string,
  primitiveIcon?: string
): WorkflowReactFlowNode {
  return {
    id: generateNodeId(),
    type: 'workflow-primitive',
    position,
    data: {
      label: primitiveName,
      nodeType: 'primitive',
      primitiveId,
      primitiveName,
      primitiveIcon,
      config: {
        inputMapping: {},
      },
    },
  };
}

/**
 * Create a new condition node
 */
export function createConditionNode(
  position: XYPosition,
  label = 'Condition'
): WorkflowReactFlowNode {
  return {
    id: generateNodeId(),
    type: 'workflow-condition',
    position,
    data: {
      label,
      nodeType: 'condition',
      config: {
        condition: {
          type: 'simple',
          field: '',
          operator: 'eq',
          value: '',
        },
      },
    },
  };
}

/**
 * Create a new output node
 */
export function createOutputNode(
  position: XYPosition,
  label = 'Output'
): WorkflowReactFlowNode {
  return {
    id: generateNodeId(),
    type: 'workflow-output',
    position,
    data: {
      label,
      nodeType: 'output',
      config: {
        inputMapping: {},
      },
    },
  };
}

// =============================================================================
// SERIALIZATION
// =============================================================================

export interface WorkflowGraphData {
  nodes: WorkflowTemplateNode[];
  edges: WorkflowTemplateEdge[];
  viewport?: Viewport;
}

/**
 * Serialize workflow for storage
 */
export function serializeWorkflow(
  nodes: WorkflowReactFlowNode[],
  edges: WorkflowReactFlowEdge[],
  viewport?: Viewport
): WorkflowGraphData {
  return {
    nodes: fromReactFlowNodes(nodes),
    edges: fromReactFlowEdges(edges),
    viewport,
  };
}

/**
 * Deserialize workflow for React Flow
 */
export function deserializeWorkflow(data: WorkflowGraphData): {
  nodes: WorkflowReactFlowNode[];
  edges: WorkflowReactFlowEdge[];
  viewport?: Viewport;
} {
  return {
    nodes: toReactFlowNodes(data.nodes),
    edges: toReactFlowEdges(data.edges),
    viewport: data.viewport,
  };
}
