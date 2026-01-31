'use client';

/**
 * Edit Workflow Page
 *
 * Edit an existing workflow using the visual workflow builder
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { WorkflowBuilder } from '../../../../../components/workflow';
import type { WorkflowDefinition, AvailablePrimitive } from '../../../../../components/workflow';

// Default primitives for when API returns empty
const defaultPrimitives: AvailablePrimitive[] = [
  {
    id: 'prim-1',
    name: 'transform_json',
    description: 'Transform JSON data using a JavaScript expression',
    category: 'data',
    icon: 'Braces',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', description: 'The input data to transform' },
        expression: { type: 'string', description: 'JavaScript expression' },
      },
      required: ['data', 'expression'],
    },
    tags: ['data', 'transform'],
  },
  {
    id: 'prim-2',
    name: 'validate_data',
    description: 'Validate data against a JSON Schema',
    category: 'data',
    icon: 'CheckCircle',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', description: 'The data to validate' },
        schema: { type: 'object', description: 'JSON Schema' },
      },
      required: ['data', 'schema'],
    },
    tags: ['data', 'validation'],
  },
  {
    id: 'prim-3',
    name: 'format_text',
    description: 'Format text using template literals',
    category: 'text',
    icon: 'FileText',
    inputSchema: {
      type: 'object',
      properties: {
        template: { type: 'string', description: 'Template string' },
        variables: { type: 'object', description: 'Variables to interpolate' },
      },
      required: ['template', 'variables'],
    },
    tags: ['text', 'template'],
  },
  {
    id: 'prim-4',
    name: 'calculate',
    description: 'Evaluate a mathematical expression',
    category: 'math',
    icon: 'Calculator',
    inputSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Mathematical expression' },
        variables: { type: 'object', description: 'Variables' },
      },
      required: ['expression'],
    },
    tags: ['math', 'calculate'],
  },
  {
    id: 'prim-5',
    name: 'aggregate',
    description: 'Aggregate an array of numbers',
    category: 'math',
    icon: 'BarChart',
    inputSchema: {
      type: 'object',
      properties: {
        values: { type: 'array', description: 'Array of numbers' },
        operations: { type: 'array', description: 'Operations: sum, avg, min, max' },
      },
      required: ['values'],
    },
    tags: ['math', 'aggregate'],
  },
  {
    id: 'prim-6',
    name: 'format_date',
    description: 'Format a date using a format string',
    category: 'datetime',
    icon: 'Calendar',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date string' },
        format: { type: 'string', description: 'Format string (YYYY-MM-DD)' },
      },
      required: ['date'],
    },
    tags: ['date', 'format'],
  },
  {
    id: 'prim-7',
    name: 'conditional',
    description: 'Evaluate a condition and return different values',
    category: 'logic',
    icon: 'GitBranch',
    inputSchema: {
      type: 'object',
      properties: {
        condition: { type: 'string', description: 'JavaScript condition' },
        context: { type: 'object', description: 'Variables for condition' },
        thenValue: { description: 'Value if true' },
        elseValue: { description: 'Value if false' },
      },
      required: ['condition'],
    },
    tags: ['logic', 'condition'],
  },
];

interface Workflow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  enabled: boolean;
  triggerType: string;
  triggerConfig: Record<string, unknown> | null;
  nodes: unknown[];
  edges: unknown[];
  viewport: { x: number; y: number; zoom: number } | null;
  config: Record<string, unknown> | null;
  variables: Record<string, unknown> | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditWorkflowPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [primitives, setPrimitives] = useState<AvailablePrimitive[]>(defaultPrimitives);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch workflow and primitives in parallel
        const [workflowRes, primitivesRes] = await Promise.all([
          fetch(`/api/plugins/workflows/${id}`),
          fetch('/api/plugins/primitives'),
        ]);

        if (!workflowRes.ok) {
          if (workflowRes.status === 404) {
            throw new Error('Workflow not found');
          }
          throw new Error('Failed to fetch workflow');
        }

        const workflowData = await workflowRes.json();
        setWorkflow(workflowData);
        setWorkflowName(workflowData.name);

        if (primitivesRes.ok) {
          const primitivesData = await primitivesRes.json();
          if (primitivesData.primitives?.length > 0) {
            setPrimitives(
              primitivesData.primitives.map((p: Record<string, unknown>) => ({
                id: p.id,
                name: p.name,
                description: p.description || '',
                category: p.category || 'other',
                icon: p.icon,
                inputSchema: p.inputSchema || {},
                tags: p.tags || [],
              }))
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workflow');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleSave = async (workflowDef: WorkflowDefinition) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/plugins/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowName,
          nodes: workflowDef.nodes,
          edges: workflowDef.edges,
          triggerType: workflowDef.triggerType,
          triggerConfig: workflowDef.triggerConfig,
          config: workflowDef.config,
          variables: workflowDef.variables,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setWorkflow(updated);
      } else {
        const errorData = await response.json();
        alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
      alert('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async (workflowDef: WorkflowDefinition) => {
    // First save, then execute
    await handleSave(workflowDef);

    try {
      const response = await fetch(`/api/plugins/workflows/${id}/execute`, {
        method: 'POST',
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Workflow executed!\n\nSuccess: ${data.success}\nDuration: ${data.duration}ms\n\nResult: ${JSON.stringify(data.result, null, 2)}`);
      } else {
        alert(`Execution failed: ${data.error || 'Unknown error'}\n\nDetails: ${data.details || ''}`);
      }
    } catch (err) {
      console.error('Failed to execute workflow:', err);
      alert('Failed to execute workflow');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading workflow...</span>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">{error || 'Workflow not found'}</h2>
          <Link href="/admin/workflows">
            <button className="text-primary hover:underline">
              Back to Workflows
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Convert workflow to WorkflowDefinition format
  const initialWorkflow: WorkflowDefinition = {
    id: workflow.id,
    name: workflow.name,
    version: '1.0.0',
    nodes: workflow.nodes as WorkflowDefinition['nodes'],
    edges: workflow.edges as WorkflowDefinition['edges'],
    triggerType: workflow.triggerType as WorkflowDefinition['triggerType'],
    triggerConfig: (workflow.triggerConfig as Record<string, unknown>) || undefined,
    config: (workflow.config as Record<string, unknown>) || undefined,
    variables: (workflow.variables as Record<string, unknown>) || undefined,
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/workflows/${id}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-border" />
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            placeholder="Workflow name"
          />
        </div>
        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="text-sm text-primary flex items-center gap-1">
              <Save className="h-3 w-3" />
              Saving...
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${workflow.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {workflow.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Workflow Builder */}
      <div className="flex-1 min-h-0">
        <WorkflowBuilder
          primitives={primitives}
          workflow={initialWorkflow}
          onSave={handleSave}
          onExecute={handleExecute}
        />
      </div>
    </div>
  );
}
