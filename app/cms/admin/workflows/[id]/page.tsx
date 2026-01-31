'use client';

/**
 * Workflow Detail Page
 *
 * View workflow details, execution history, and logs
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Activity,
  Settings,
  FileText,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/cms/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/cms/ui/tabs';

interface WorkflowExecution {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface WorkflowLog {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  data: Record<string, unknown> | null;
  nodeId: string | null;
  createdAt: string;
}

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
  config: Record<string, unknown> | null;
  variables: Record<string, unknown> | null;
  lastRunAt: string | null;
  executionCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  executions: WorkflowExecution[];
  logs: WorkflowLog[];
  template: { id: string; name: string; category: string } | null;
  _count: {
    executions: number;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3.5 w-3.5" />,
  RUNNING: <RefreshCw className="h-3.5 w-3.5 animate-spin" />,
  COMPLETED: <CheckCircle className="h-3.5 w-3.5" />,
  FAILED: <XCircle className="h-3.5 w-3.5" />,
  CANCELLED: <AlertCircle className="h-3.5 w-3.5" />,
};

const logLevelColors: Record<string, string> = {
  DEBUG: 'text-gray-500',
  INFO: 'text-blue-600',
  WARN: 'text-yellow-600',
  ERROR: 'text-red-600',
};

export default function WorkflowDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  useEffect(() => {
    fetchWorkflow();
  }, [id]);

  async function fetchWorkflow() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/plugins/workflows/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Workflow not found');
        }
        throw new Error('Failed to fetch workflow');
      }
      const data = await response.json();
      setWorkflow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setIsLoading(false);
    }
  }

  async function executeWorkflow() {
    if (!workflow) return;

    try {
      setIsExecuting(true);
      const response = await fetch(`/api/plugins/workflows/${id}/execute`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Workflow executed!\n\nSuccess: ${data.success}\nDuration: ${data.duration}ms`);
        fetchWorkflow(); // Refresh to see new execution
      } else {
        alert(`Execution failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to execute workflow:', err);
      alert('Failed to execute workflow');
    } finally {
      setIsExecuting(false);
    }
  }

  async function toggleWorkflow() {
    if (!workflow) return;

    try {
      const response = await fetch(`/api/plugins/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !workflow.enabled }),
      });
      if (response.ok) {
        setWorkflow({ ...workflow, enabled: !workflow.enabled });
      }
    } catch (err) {
      console.error('Failed to toggle workflow:', err);
    }
  }

  async function deleteWorkflow() {
    if (!confirm('Are you sure you want to delete this workflow? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/plugins/workflows/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/admin/workflows');
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function formatDuration(start: string, end: string | null) {
    if (!end) return 'Running...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
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

  if (error || !workflow) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{error || 'Workflow not found'}</h3>
          <Link href="/admin/workflows">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflows
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const successRate = workflow.executionCount > 0
    ? Math.round((workflow.successCount / workflow.executionCount) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/admin/workflows" className="hover:text-foreground transition-colors">
            Workflows
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>{workflow.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {workflow.name}
              <button
                onClick={toggleWorkflow}
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
            </h1>
            {workflow.description && (
              <p className="text-muted-foreground mt-1">{workflow.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={executeWorkflow}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Now
            </Button>
            <Link href={`/admin/workflows/${id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={deleteWorkflow} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            Total Executions
          </div>
          <div className="text-2xl font-bold">{workflow.executionCount}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CheckCircle className="h-4 w-4" />
            Success Rate
          </div>
          <div className="text-2xl font-bold text-green-600">{successRate}%</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <XCircle className="h-4 w-4" />
            Failures
          </div>
          <div className="text-2xl font-bold text-red-600">{workflow.failureCount}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            Last Run
          </div>
          <div className="text-sm font-medium">{formatDate(workflow.lastRunAt)}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="executions">
        <TabsList>
          <TabsTrigger value="executions" className="gap-2">
            <Activity className="h-4 w-4" />
            Executions
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Executions Tab */}
        <TabsContent value="executions" className="mt-4">
          {workflow.executions.length === 0 ? (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No executions yet</h3>
              <p className="text-muted-foreground mb-4">
                Run the workflow to see execution history
              </p>
              <Button onClick={executeWorkflow} disabled={isExecuting}>
                <Play className="h-4 w-4 mr-2" />
                Run Workflow
              </Button>
            </div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Started</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Duration</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Error</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workflow.executions.map((execution) => (
                    <tr key={execution.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[execution.status]}`}>
                          {statusIcons[execution.status]}
                          {execution.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(execution.startedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDuration(execution.startedAt, execution.completedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">
                        {execution.error || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedExecution(execution)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          {workflow.logs.length === 0 ? (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No logs yet</h3>
              <p className="text-muted-foreground">
                Logs will appear here after workflow executions
              </p>
            </div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="divide-y divide-border">
                {workflow.logs.map((log) => (
                  <div key={log.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className={`text-xs font-mono font-medium ${logLevelColors[log.level]}`}>
                        [{log.level}]
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{log.message}</p>
                        {log.nodeId && (
                          <span className="text-xs text-muted-foreground">
                            Node: {log.nodeId}
                          </span>
                        )}
                        {log.data && (
                          <pre className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Trigger Configuration
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium">{workflow.triggerType}</dd>
                </div>
                {workflow.triggerConfig && Object.entries(workflow.triggerConfig).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-mono text-xs">{JSON.stringify(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Metadata
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Slug</dt>
                  <dd className="font-mono">{workflow.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatDate(workflow.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd>{formatDate(workflow.updatedAt)}</dd>
                </div>
                {workflow.template && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Template</dt>
                    <dd>{workflow.template.name}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Nodes</dt>
                  <dd>{workflow.nodes?.length || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Edges</dt>
                  <dd>{workflow.edges?.length || 0}</dd>
                </div>
              </dl>
            </div>

            {workflow.variables && Object.keys(workflow.variables).length > 0 && (
              <div className="bg-card border rounded-lg p-4 md:col-span-2">
                <h3 className="font-medium mb-3">Variables</h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(workflow.variables, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Execution Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedExecution(null)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedExecution.status]}`}>
                    {statusIcons[selectedExecution.status]}
                    {selectedExecution.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(selectedExecution.startedAt, selectedExecution.completedAt)}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Input</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedExecution.input, null, 2)}
                  </pre>
                </div>

                {selectedExecution.output && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Output</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedExecution.output, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedExecution.error && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-red-600">Error</h4>
                    <pre className="text-xs bg-red-50 text-red-700 p-3 rounded overflow-x-auto">
                      {selectedExecution.error}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
