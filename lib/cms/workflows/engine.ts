/**
 * Workflow Execution Engine
 *
 * Executes workflows by traversing nodes, evaluating conditions,
 * and running primitives/actions.
 */

import { prisma } from '../db';
import type { Workflow, WorkflowExecution } from '@prisma/client';
import {
  createWorkflowContext,
  setNodeOutput,
  addError,
  evaluateCondition,
  resolveNodeInputs,
  createIterationContext,
} from './context';
import { executePrimitive } from './primitive-adapter';
import type {
  WorkflowContext,
  WorkflowExecutionResult,
  NodeExecutionResult,
  WorkflowTemplateNode,
  WorkflowTemplateEdge,
  WorkflowNodeConfig,
  WorkflowEvent,
} from './types';

// =============================================================================
// WORKFLOW EXECUTION
// =============================================================================

interface ExecuteWorkflowOptions {
  triggeredBy: 'manual' | 'schedule' | 'webhook' | 'event' | 'agent';
  userId?: string;
  agentId?: string;
  eventData?: unknown;
  variables?: Record<string, unknown>;
}

/**
 * Execute a workflow by ID
 */
export async function executeWorkflow(
  workflowId: string,
  options: ExecuteWorkflowOptions
): Promise<WorkflowExecutionResult> {
  // Load workflow
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      workflowNodes: {
        include: { primitive: true },
      },
    },
  });

  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  if (!workflow.enabled) {
    throw new Error(`Workflow is disabled: ${workflowId}`);
  }

  return executeWorkflowInstance(workflow, options);
}

/**
 * Execute a workflow instance
 */
export async function executeWorkflowInstance(
  workflow: Workflow,
  options: ExecuteWorkflowOptions
): Promise<WorkflowExecutionResult> {
  const nodes = workflow.nodes as unknown as WorkflowTemplateNode[];
  const edges = workflow.edges as unknown as WorkflowTemplateEdge[];
  const workflowVariables = workflow.variables as Record<string, unknown> | null;

  // Create execution record
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      triggeredBy: options.triggeredBy,
      userId: options.userId,
      agentId: options.agentId,
      eventData: options.eventData as never,
      status: 'RUNNING',
    },
  });

  // Create execution context
  let context = createWorkflowContext(
    workflow.id,
    {
      type: options.triggeredBy,
      data: options.eventData,
      event: options.eventData as WorkflowEvent | undefined,
    },
    { ...workflowVariables, ...options.variables }
  );

  // Override executionId to match DB record
  context = { ...context, executionId: execution.id };

  const nodeResults: NodeExecutionResult[] = [];
  const startTime = Date.now();

  try {
    // Find trigger node (starting point)
    const triggerNode = nodes.find((n) => n.data.nodeType === 'trigger');
    if (!triggerNode) {
      throw new Error('No trigger node found in workflow');
    }

    // Execute from trigger node
    const result = await executeNode(
      triggerNode,
      nodes,
      edges,
      context,
      nodeResults,
      workflow.id
    );

    // Update execution record
    const completedAt = new Date();
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        result: result.output as never,
        completedAt,
      },
    });

    // Update workflow lastRunAt
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { lastRunAt: completedAt },
    });

    return {
      executionId: execution.id,
      workflowId: workflow.id,
      status: 'COMPLETED',
      startedAt: execution.startedAt,
      completedAt,
      duration: Date.now() - startTime,
      result: result.output,
      nodeResults,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update execution record with error
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    return {
      executionId: execution.id,
      workflowId: workflow.id,
      status: 'FAILED',
      startedAt: execution.startedAt,
      completedAt: new Date(),
      duration: Date.now() - startTime,
      error: errorMessage,
      nodeResults,
    };
  }
}

// =============================================================================
// NODE EXECUTION
// =============================================================================

/**
 * Execute a node and its downstream nodes
 */
async function executeNode(
  node: WorkflowTemplateNode,
  allNodes: WorkflowTemplateNode[],
  allEdges: WorkflowTemplateEdge[],
  context: WorkflowContext,
  nodeResults: NodeExecutionResult[],
  workflowId: string
): Promise<{ output: unknown; context: WorkflowContext }> {
  const nodeStartTime = Date.now();
  const config = node.data.config as WorkflowNodeConfig | undefined;

  let output: unknown;
  let updatedContext = context;

  try {
    // Execute based on node type
    switch (node.data.nodeType) {
      case 'trigger':
        // Trigger nodes just pass through the trigger data
        output = context.trigger.data;
        break;

      case 'primitive':
        output = await executePrimitiveNode(node, config, context, workflowId);
        break;

      case 'condition':
        output = await executeConditionNode(node, config, context);
        break;

      case 'loop':
        const loopResult = await executeLoopNode(
          node,
          config,
          allNodes,
          allEdges,
          context,
          nodeResults,
          workflowId
        );
        output = loopResult.output;
        updatedContext = loopResult.context;
        break;

      case 'delay':
        output = await executeDelayNode(config);
        break;

      case 'parallel':
        output = await executeParallelNode(
          node,
          allNodes,
          allEdges,
          context,
          nodeResults,
          workflowId
        );
        break;

      case 'output':
        // Output nodes collect final results
        output = resolveNodeInputs(config?.inputMapping, context);
        break;

      default:
        output = null;
    }

    // Update context with node output
    updatedContext = setNodeOutput(updatedContext, node.id, output);

    // Record success
    nodeResults.push({
      nodeId: node.id,
      success: true,
      output,
      duration: Date.now() - nodeStartTime,
    });

    // Find and execute downstream nodes
    const outgoingEdges = allEdges.filter((e) => e.source === node.id);

    for (const edge of outgoingEdges) {
      // Check edge condition if present
      if (edge.data?.condition) {
        const conditionMet = evaluateCondition(edge.data.condition, updatedContext);
        if (!conditionMet) continue;
      }

      // For condition nodes, check the sourceHandle
      if (node.data.nodeType === 'condition' && edge.sourceHandle) {
        const conditionResult = output as boolean;
        if (edge.sourceHandle === 'true' && !conditionResult) continue;
        if (edge.sourceHandle === 'false' && conditionResult) continue;
      }

      const targetNode = allNodes.find((n) => n.id === edge.target);
      if (targetNode) {
        const result = await executeNode(
          targetNode,
          allNodes,
          allEdges,
          updatedContext,
          nodeResults,
          workflowId
        );
        updatedContext = result.context;
        // Use last node's output as final output
        output = result.output;
      }
    }

    return { output, context: updatedContext };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    nodeResults.push({
      nodeId: node.id,
      success: false,
      error: errorMessage,
      duration: Date.now() - nodeStartTime,
    });

    updatedContext = addError(updatedContext, node.id, errorMessage);
    throw error;
  }
}

// =============================================================================
// NODE TYPE HANDLERS
// =============================================================================

/**
 * Execute a primitive node
 */
async function executePrimitiveNode(
  node: WorkflowTemplateNode,
  config: WorkflowNodeConfig | undefined,
  context: WorkflowContext,
  workflowId: string
): Promise<unknown> {
  const primitiveId = node.data.primitiveId;
  if (!primitiveId) {
    throw new Error(`Primitive node ${node.id} has no primitive assigned`);
  }

  // Resolve inputs from context
  const inputs = resolveNodeInputs(config?.inputMapping, context);

  // Merge with static config
  const finalInputs = {
    ...config?.primitiveConfig,
    ...inputs,
  };

  // Execute primitive
  return executePrimitive(primitiveId, finalInputs, {
    workflowExecutionId: context.executionId,
    workflowId,
  });
}

/**
 * Execute a condition node
 */
async function executeConditionNode(
  node: WorkflowTemplateNode,
  config: WorkflowNodeConfig | undefined,
  context: WorkflowContext
): Promise<boolean> {
  if (!config?.condition) {
    return true;
  }

  return evaluateCondition(config.condition, context);
}

/**
 * Execute a loop node
 */
async function executeLoopNode(
  node: WorkflowTemplateNode,
  config: WorkflowNodeConfig | undefined,
  allNodes: WorkflowTemplateNode[],
  allEdges: WorkflowTemplateEdge[],
  context: WorkflowContext,
  nodeResults: NodeExecutionResult[],
  workflowId: string
): Promise<{ output: unknown[]; context: WorkflowContext }> {
  if (!config?.loop) {
    return { output: [], context };
  }

  const { collection, itemVariable, indexVariable } = config.loop;

  // Get collection from context
  const items = context.variables[collection] as unknown[];
  if (!Array.isArray(items)) {
    throw new Error(`Loop collection "${collection}" is not an array`);
  }

  // Find loop body nodes (nodes connected from this loop node)
  const loopBodyEdges = allEdges.filter(
    (e) => e.source === node.id && e.sourceHandle === 'body'
  );

  const results: unknown[] = [];
  let currentContext = context;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Create iteration context
    const iterContext = createIterationContext(
      currentContext,
      itemVariable,
      item,
      indexVariable,
      i
    );

    // Execute loop body
    for (const edge of loopBodyEdges) {
      const bodyNode = allNodes.find((n) => n.id === edge.target);
      if (bodyNode) {
        const result = await executeNode(
          bodyNode,
          allNodes,
          allEdges,
          iterContext,
          nodeResults,
          workflowId
        );
        results.push(result.output);
        // Carry forward context changes (except iteration variables)
        currentContext = {
          ...result.context,
          variables: {
            ...result.context.variables,
            [itemVariable]: undefined,
            ...(indexVariable ? { [indexVariable]: undefined } : {}),
          },
        };
      }
    }
  }

  return { output: results, context: currentContext };
}

/**
 * Execute a delay node
 */
async function executeDelayNode(
  config: WorkflowNodeConfig | undefined
): Promise<{ delayed: boolean; duration: number }> {
  if (!config?.delay) {
    return { delayed: false, duration: 0 };
  }

  const { duration, unit } = config.delay;
  let ms = duration;

  switch (unit) {
    case 'minutes':
      ms = duration * 60 * 1000;
      break;
    case 'hours':
      ms = duration * 60 * 60 * 1000;
      break;
    case 'days':
      ms = duration * 24 * 60 * 60 * 1000;
      break;
    default:
      ms = duration * 1000;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));

  return { delayed: true, duration: ms };
}

/**
 * Execute a parallel node (fan-out)
 */
async function executeParallelNode(
  node: WorkflowTemplateNode,
  allNodes: WorkflowTemplateNode[],
  allEdges: WorkflowTemplateEdge[],
  context: WorkflowContext,
  nodeResults: NodeExecutionResult[],
  workflowId: string
): Promise<unknown[]> {
  // Find all outgoing edges from parallel node
  const outgoingEdges = allEdges.filter((e) => e.source === node.id);

  // Execute all branches in parallel
  const promises = outgoingEdges.map(async (edge) => {
    const targetNode = allNodes.find((n) => n.id === edge.target);
    if (!targetNode) return null;

    const result = await executeNode(
      targetNode,
      allNodes,
      allEdges,
      context,
      nodeResults,
      workflowId
    );
    return result.output;
  });

  const results = await Promise.all(promises);
  return results.filter((r) => r !== null);
}

// =============================================================================
// WORKFLOW MANAGEMENT
// =============================================================================

/**
 * Cancel a running workflow execution
 */
export async function cancelWorkflowExecution(executionId: string): Promise<void> {
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      status: 'CANCELLED',
      completedAt: new Date(),
    },
  });
}

/**
 * Get workflow execution status
 */
export async function getWorkflowExecutionStatus(
  executionId: string
): Promise<WorkflowExecution | null> {
  return prisma.workflowExecution.findUnique({
    where: { id: executionId },
  });
}

/**
 * Get recent workflow executions
 */
export async function getWorkflowExecutions(
  workflowId: string,
  options?: {
    limit?: number;
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  }
): Promise<WorkflowExecution[]> {
  return prisma.workflowExecution.findMany({
    where: {
      workflowId,
      ...(options?.status && { status: options.status }),
    },
    orderBy: { startedAt: 'desc' },
    take: options?.limit || 50,
  });
}

// =============================================================================
// WORKFLOW TRIGGER HELPERS
// =============================================================================

/**
 * Trigger a workflow manually
 */
export async function triggerWorkflowManually(
  workflowId: string,
  data?: unknown,
  userId?: string
): Promise<WorkflowExecutionResult> {
  return executeWorkflow(workflowId, {
    triggeredBy: 'manual',
    userId,
    eventData: data,
  });
}

/**
 * Trigger a workflow via webhook
 */
export async function triggerWorkflowByWebhook(
  workflowSlug: string,
  payload: unknown
): Promise<WorkflowExecutionResult> {
  const workflow = await prisma.workflow.findUnique({
    where: { slug: workflowSlug },
  });

  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowSlug}`);
  }

  if (workflow.triggerType !== 'WEBHOOK') {
    throw new Error(`Workflow ${workflowSlug} is not configured for webhook triggers`);
  }

  return executeWorkflow(workflow.id, {
    triggeredBy: 'webhook',
    eventData: payload,
  });
}

/**
 * Find workflows that should run on schedule
 */
export async function getScheduledWorkflows(): Promise<Workflow[]> {
  return prisma.workflow.findMany({
    where: {
      enabled: true,
      triggerType: 'SCHEDULE',
    },
  });
}

/**
 * Check if a workflow should run based on cron schedule
 */
export function shouldRunScheduledWorkflow(
  workflow: Workflow,
  now: Date = new Date()
): boolean {
  const config = workflow.triggerConfig as { cron?: string } | null;
  if (!config?.cron) return false;

  // Parse cron expression (simplified - for production use a library like cron-parser)
  // Format: minute hour dayOfMonth month dayOfWeek
  const [minute, hour, dayOfMonth, month, dayOfWeek] = config.cron.split(' ');

  const matches = (pattern: string, value: number): boolean => {
    if (pattern === '*') return true;
    if (pattern.includes(',')) {
      return pattern.split(',').some((p) => matches(p, value));
    }
    if (pattern.includes('-')) {
      const [start, end] = pattern.split('-').map(Number);
      return value >= start && value <= end;
    }
    if (pattern.includes('/')) {
      const [, step] = pattern.split('/').map(Number);
      return value % step === 0;
    }
    return parseInt(pattern, 10) === value;
  };

  return (
    matches(minute, now.getMinutes()) &&
    matches(hour, now.getHours()) &&
    matches(dayOfMonth, now.getDate()) &&
    matches(month, now.getMonth() + 1) &&
    matches(dayOfWeek, now.getDay())
  );
}
