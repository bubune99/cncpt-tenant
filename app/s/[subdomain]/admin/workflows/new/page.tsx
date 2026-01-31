'use client';

/**
 * New Workflow Page
 *
 * Create a new workflow using the visual workflow builder
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { WorkflowBuilder } from '@/components/cms/workflow';
import type { WorkflowDefinition, AvailablePrimitive } from '@/components/cms/workflow';

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

export default function NewWorkflowPage() {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [primitives, setPrimitives] = useState<AvailablePrimitive[]>(defaultPrimitives);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchPrimitives() {
      try {
        const response = await fetch('/api/plugins/primitives');
        if (response.ok) {
          const data = await response.json();
          if (data.primitives?.length > 0) {
            setPrimitives(
              data.primitives.map((p: Record<string, unknown>) => ({
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
      } catch (error) {
        console.error('Failed to fetch primitives:', error);
        // Keep using default primitives
      }
    }

    fetchPrimitives();
  }, []);

  const handleSave = async (workflow: WorkflowDefinition) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/plugins/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workflow,
          name: workflowName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/workflows/${data.workflow.id}/edit`);
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async (workflow: WorkflowDefinition) => {
    try {
      const response = await fetch('/api/plugins/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workflow,
          name: workflowName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Workflow executed successfully!\n\nResult: ${JSON.stringify(data.result, null, 2)}`);
      } else {
        alert(`Execution failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      alert('Failed to execute workflow');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workflows"
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">v1.0.0</span>
          {isSaving && (
            <span className="text-sm text-primary">Saving...</span>
          )}
        </div>
      </div>

      {/* Workflow Builder */}
      <div className="flex-1 min-h-0">
        <WorkflowBuilder
          primitives={primitives}
          onSave={handleSave}
          onExecute={handleExecute}
        />
      </div>
    </div>
  );
}
