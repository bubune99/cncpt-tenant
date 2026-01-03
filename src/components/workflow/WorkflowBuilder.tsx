'use client';

/**
 * Workflow Builder Component
 *
 * Visual workflow builder using React Flow
 */

import { useCallback, useState, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Save, Play } from 'lucide-react';
import { nodeTypes } from './nodes';
import PrimitivesPalette from './PrimitivesPalette';
import NodeConfigPanel from './NodeConfigPanel';
import type {
  WorkflowNode,
  WorkflowDefinition,
  AvailablePrimitive,
} from './types';

interface WorkflowBuilderProps {
  workflow?: WorkflowDefinition;
  primitives: AvailablePrimitive[];
  onSave?: (workflow: WorkflowDefinition) => void;
  onExecute?: (workflow: WorkflowDefinition) => void;
  readOnly?: boolean;
}

// Generate unique ID
function generateId() {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function WorkflowBuilderInner({
  workflow,
  primitives,
  onSave,
  onExecute,
  readOnly = false,
}: WorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (workflow?.nodes || []) as Node[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (workflow?.edges || []) as Edge[]
  );
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
      setIsDirty(true);
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node as WorkflowNode);
    },
    []
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Handle drag start from palette
  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: string, data: unknown) => {
      event.dataTransfer.setData('application/reactflow-type', nodeType);
      event.dataTransfer.setData('application/reactflow-data', JSON.stringify(data));
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  // Handle drop on canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow-type');
      const dataStr = event.dataTransfer.getData('application/reactflow-data');

      if (!type || !dataStr) return;

      const data = JSON.parse(dataStr);
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();

      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 90, // Center the node
        y: event.clientY - reactFlowBounds.top - 30,
      };

      const newNode: Node = {
        id: generateId(),
        type,
        position,
        data: data as Record<string, unknown>,
      };

      setNodes((nds) => [...nds, newNode]);
      setIsDirty(true);
    },
    [setNodes]
  );

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Update node data
  const onUpdateNode = useCallback(
    (nodeId: string, newData: unknown) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: newData as WorkflowNode['data'] };
          }
          return node;
        })
      );
      setIsDirty(true);
    },
    [setNodes]
  );

  // Delete node
  const onDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setSelectedNode(null);
      setIsDirty(true);
    },
    [setNodes, setEdges]
  );

  // Save workflow
  const handleSave = useCallback(() => {
    const workflowDef: WorkflowDefinition = {
      id: workflow?.id || generateId(),
      name: workflow?.name || 'Untitled Workflow',
      description: workflow?.description,
      version: workflow?.version || '1.0.0',
      nodes,
      edges,
      metadata: {
        createdAt: workflow?.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    onSave?.(workflowDef);
    setIsDirty(false);
  }, [workflow, nodes, edges, onSave]);

  // Execute workflow
  const handleExecute = useCallback(() => {
    const workflowDef: WorkflowDefinition = {
      id: workflow?.id || generateId(),
      name: workflow?.name || 'Untitled Workflow',
      version: workflow?.version || '1.0.0',
      nodes,
      edges,
    };

    onExecute?.(workflowDef);
  }, [workflow, nodes, edges, onExecute]);

  // Node colors for minimap
  const nodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'trigger':
        return '#10b981';
      case 'primitive':
        return '#3b82f6';
      case 'condition':
        return '#f97316';
      case 'output':
        return '#14b8a6';
      default:
        return '#6b7280';
    }
  }, []);

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Primitives Palette */}
      {!readOnly && (
        <PrimitivesPalette primitives={primitives} onDragStart={onDragStart} />
      )}

      {/* Main Canvas */}
      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={nodeColor}
            maskColor="rgba(255, 255, 255, 0.8)"
            className="!bg-white !border !border-gray-200 !rounded-lg"
          />

          {/* Top toolbar */}
          <Panel position="top-center" className="bg-white rounded-lg shadow-md border border-gray-200 p-1 flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={!isDirty || readOnly}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save workflow"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <button
              onClick={handleExecute}
              disabled={nodes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Execute workflow"
            >
              <Play className="h-4 w-4" />
              Run
            </button>
          </Panel>

          {/* Status indicator */}
          <Panel position="bottom-center" className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1.5 text-xs text-gray-500">
            {nodes.length} nodes • {edges.length} connections
            {isDirty && <span className="text-amber-500 ml-2">• Unsaved changes</span>}
          </Panel>
        </ReactFlow>
      </div>

      {/* Right Sidebar - Node Config */}
      {selectedNode && !readOnly && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={onUpdateNode}
          onDelete={onDeleteNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

export default function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
