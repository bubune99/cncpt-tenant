'use client';

/**
 * New Workflow Page
 *
 * Create a new workflow using the visual workflow builder
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { WorkflowBuilder } from '@/components/cms/workflow';
import type { WorkflowDefinition, AvailablePrimitive } from '@/components/cms/workflow';

export default function NewWorkflowPage() {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [primitives, setPrimitives] = useState<AvailablePrimitive[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch primitives from API
  useEffect(() => {
    async function fetchPrimitives() {
      try {
        const response = await fetch('/api/cms/admin/primitives');
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
      } finally {
        setLoading(false);
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
        router.push(`/plugins/workflows/${data.workflow.id}`);
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
      <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/plugins"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            placeholder="Workflow name"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">v1.0.0</span>
          {isSaving && (
            <span className="text-sm text-blue-600">Saving...</span>
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
