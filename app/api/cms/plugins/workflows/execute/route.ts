/**
 * Workflow Execute API
 *
 * Execute a workflow definition
 */

import { NextResponse } from 'next/server';
import { executeByIdOrName } from '@/lib/cms/plugins';

export const dynamic = 'force-dynamic'

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    primitiveName?: string;
    primitiveId?: string;
    config?: Record<string, unknown>;
    triggerType?: string;
    expression?: string;
    context?: Record<string, unknown>;
    outputType?: string;
    thenValue?: unknown;
    elseValue?: unknown;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nodes, edges } = body as { nodes: WorkflowNode[]; edges: WorkflowEdge[] };

    if (!nodes || nodes.length === 0) {
      return NextResponse.json(
        { error: 'Workflow must have at least one node' },
        { status: 400 }
      );
    }

    // Find trigger node(s)
    const triggerNodes = nodes.filter(n => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      return NextResponse.json(
        { error: 'Workflow must have at least one trigger' },
        { status: 400 }
      );
    }

    // Build execution graph
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const edgesBySource = new Map<string, WorkflowEdge[]>();
    edges.forEach(e => {
      if (!edgesBySource.has(e.source)) {
        edgesBySource.set(e.source, []);
      }
      edgesBySource.get(e.source)!.push(e);
    });

    // Execute workflow starting from trigger
    const results: Record<string, unknown> = {};
    const executionOrder: string[] = [];

    async function executeNode(
      nodeId: string,
      inputData: Record<string, unknown>
    ): Promise<unknown> {
      const node = nodeMap.get(nodeId);
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      executionOrder.push(nodeId);
      let result: unknown;

      switch (node.type) {
        case 'trigger':
          // Triggers just pass through
          result = inputData;
          break;

        case 'primitive':
          // Execute the primitive
          if (!node.data.primitiveName && !node.data.primitiveId) {
            throw new Error(`Primitive node ${nodeId} has no primitive assigned`);
          }

          const primitiveId = node.data.primitiveId || node.data.primitiveName!;
          const primitiveInput = {
            ...node.data.config,
            ...inputData,
          };

          const execResult = await executeByIdOrName(primitiveId, primitiveInput);
          if (!execResult.success) {
            throw new Error(execResult.error || 'Primitive execution failed');
          }

          result = execResult.result;
          break;

        case 'condition':
          // Evaluate condition
          const expression = node.data.expression;
          if (!expression) {
            throw new Error(`Condition node ${nodeId} has no expression`);
          }

          const context = { ...node.data.context, data: inputData };
          const contextKeys = Object.keys(context);
          const contextValues = Object.values(context);

          try {
            const evalFn = new Function(...contextKeys, `return ${expression}`);
            result = evalFn(...contextValues);
          } catch (e) {
            throw new Error(`Failed to evaluate condition: ${e}`);
          }
          break;

        case 'output':
          // Output nodes return the final result
          result = inputData;
          break;

        default:
          result = inputData;
      }

      // Store result
      results[nodeId] = result;

      // Find and execute connected nodes
      const outgoingEdges = edgesBySource.get(nodeId) || [];

      for (const edge of outgoingEdges) {
        // For condition nodes, check the handle
        if (node.type === 'condition') {
          const conditionResult = result as boolean;
          const shouldFollow =
            (edge.sourceHandle === 'true' && conditionResult) ||
            (edge.sourceHandle === 'false' && !conditionResult);

          if (shouldFollow) {
            await executeNode(edge.target, { data: inputData, conditionResult });
          }
        } else {
          // Normal execution flow
          await executeNode(edge.target, result as Record<string, unknown> || {});
        }
      }

      return result;
    }

    // Start execution from first trigger
    const startTime = Date.now();
    await executeNode(triggerNodes[0].id, {});
    const executionTime = Date.now() - startTime;

    // Find output nodes and their results
    const outputNodes = nodes.filter(n => n.type === 'output');
    const outputs = outputNodes.map(n => ({
      nodeId: n.id,
      type: n.data.outputType,
      result: results[n.id],
    }));

    return NextResponse.json({
      success: true,
      executionTime,
      executionOrder,
      results,
      outputs,
      result: outputs.length > 0 ? outputs[0].result : results[executionOrder[executionOrder.length - 1]],
    });
  } catch (error) {
    console.error('Workflow execution failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow execution failed',
      },
      { status: 500 }
    );
  }
}
