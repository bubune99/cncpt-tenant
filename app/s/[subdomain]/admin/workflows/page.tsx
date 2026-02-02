'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import {
  Plus,
  Play,
  Pause,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  GitBranch,
  Trash2,
  Edit,
  Copy
} from 'lucide-react';
import { Button } from '@/components/cms/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/cms/ui/dropdown-menu';

interface Workflow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  enabled: boolean;
  triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT' | 'AI_AGENT';
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    executions: number;
  };
}

const triggerTypeLabels: Record<string, string> = {
  MANUAL: 'Manual',
  SCHEDULE: 'Scheduled',
  WEBHOOK: 'Webhook',
  EVENT: 'Event',
  AI_AGENT: 'AI Agent',
};

const triggerTypeColors: Record<string, string> = {
  MANUAL: 'bg-gray-100 text-gray-700',
  SCHEDULE: 'bg-blue-100 text-blue-700',
  WEBHOOK: 'bg-purple-100 text-purple-700',
  EVENT: 'bg-orange-100 text-orange-700',
  AI_AGENT: 'bg-green-100 text-green-700',
};

export default function WorkflowsPage() {
  const { buildPath } = useCMSConfig();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    try {
      const response = await fetch('/api/plugins/workflows');
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleWorkflow(id: string, enabled: boolean) {
    try {
      const response = await fetch(`/api/plugins/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (response.ok) {
        setWorkflows(workflows.map(w =>
          w.id === id ? { ...w, enabled: !enabled } : w
        ));
      }
    } catch (err) {
      console.error('Failed to toggle workflow:', err);
    }
  }

  async function deleteWorkflow(id: string) {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/plugins/workflows/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setWorkflows(workflows.filter(w => w.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  }

  async function executeWorkflow(id: string) {
    try {
      const response = await fetch(`/api/plugins/workflows/${id}/execute`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Workflow executed successfully!\n\nResult: ${JSON.stringify(data.result, null, 2)}`);
        fetchWorkflows(); // Refresh to update lastRunAt
      } else {
        alert(`Execution failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to execute workflow:', err);
      alert('Failed to execute workflow');
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8" data-help-key="admin.workflows.page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8" data-help-key="admin.workflows.header">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage automated workflows using visual builder
          </p>
        </div>
        <Link href={buildPath('/admin/workflows/new')} data-help-key="admin.workflows.new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" data-help-key="admin.workflows.error">
          {error}
        </div>
      )}

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center" data-help-key="admin.workflows.empty">
          <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first workflow to automate tasks using primitives
          </p>
          <Link href={buildPath('/admin/workflows/new')}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden" data-help-key="admin.workflows.table">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Trigger</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Last Run</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Executions</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <Link
                        href={buildPath(`/admin/workflows/${workflow.id}/edit`)}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {workflow.name}
                      </Link>
                      {workflow.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${triggerTypeColors[workflow.triggerType]}`}>
                      {triggerTypeLabels[workflow.triggerType]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleWorkflow(workflow.id, workflow.enabled)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        workflow.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {workflow.enabled ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Disabled
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(workflow.lastRunAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {workflow._count?.executions || 0}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => executeWorkflow(workflow.id)}
                        title="Run workflow"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={buildPath(`/admin/workflows/${workflow.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteWorkflow(workflow.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
