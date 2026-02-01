'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Play,
  Code2,
  Settings,
  History,
  Trash2,
  Power,
  Check,
  X,
  AlertTriangle,
  Copy,
  Terminal,
} from 'lucide-react';

interface Primitive {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  icon: string;
  handler: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  timeout: number;
  enabled: boolean;
  mounted: boolean;
  builtIn: boolean;
}

interface TestResult {
  success: boolean;
  result?: any;
  error?: string;
  validationErrors?: string[];
  securityWarnings?: string[];
  executionTime: number;
}

// Default empty primitive for new primitives
const emptyPrimitive: Primitive = {
  id: '',
  name: '',
  description: '',
  version: '1.0.0',
  category: 'custom',
  tags: [],
  icon: 'Code2',
  timeout: 30000,
  enabled: true,
  mounted: false,
  builtIn: false,
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: `// Handler receives 'args' (input) and 'context' (execution context)
// Return the result of the primitive

return { message: "Hello from primitive!" };`,
};

export default function PrimitiveEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';

  const [primitive, setPrimitive] = useState<Primitive>(emptyPrimitive);
  const [loading, setLoading] = useState(!isNew);
  const [activeTab, setActiveTab] = useState<'handler' | 'schema' | 'settings' | 'history'>('handler');
  const [testInput, setTestInput] = useState('{\n  "key": "value"\n}');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentExecutions, setRecentExecutions] = useState<Array<{ id: string; success: boolean; executionTime: number; startedAt: string; error?: string }>>([]);

  // Fetch primitive data if editing existing
  useEffect(() => {
    if (!isNew) {
      const fetchPrimitive = async () => {
        try {
          const response = await fetch(`/api/cms/admin/primitives/${id}`);
          if (response.ok) {
            const data = await response.json();
            setPrimitive(data.primitive);
            if (data.executions) {
              setRecentExecutions(data.executions);
            }
          }
        } catch (error) {
          console.error('Error fetching primitive:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPrimitive();
    }
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    // TODO: API call to save primitive
    setTimeout(() => {
      setSaving(false);
      setHasChanges(false);
    }, 500);
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const input = JSON.parse(testInput);
      // TODO: API call to test primitive
      setTimeout(() => {
        setTestResult({
          success: true,
          result: { transformed: 'JOHN' },
          executionTime: 12,
          securityWarnings: ['Use of eval()'],
        });
        setIsTesting(false);
      }, 500);
    } catch (e) {
      setTestResult({
        success: false,
        error: e instanceof Error ? e.message : 'Invalid JSON input',
        executionTime: 0,
      });
      setIsTesting(false);
    }
  };

  const handleToggleMount = () => {
    setPrimitive(prev => ({ ...prev, mounted: !prev.mounted }));
    setHasChanges(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/plugins"
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <code className="font-mono text-lg font-bold">{primitive.name || 'New Primitive'}</code>
              <span className="text-sm text-gray-400">v{primitive.version}</span>
              {primitive.builtIn && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  Built-in
                </span>
              )}
              {primitive.mounted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Mounted
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{primitive.description || 'Add a description...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMount}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              primitive.mounted
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Power className="w-4 h-4" />
            {primitive.mounted ? 'Mounted' : 'Mount'}
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6 shrink-0">
        <nav className="flex gap-6">
          {[
            { id: 'handler', label: 'Handler', icon: Code2 },
            { id: 'schema', label: 'Input Schema', icon: Settings },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'history', label: 'Execution History', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors text-sm ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'handler' && (
          <>
            {/* Code Editor */}
            <div className="flex-1 flex flex-col border-r">
              <div className="bg-gray-800 text-gray-300 px-4 py-2 text-sm font-mono flex items-center justify-between">
                <span>handler.js</span>
                <button
                  onClick={() => navigator.clipboard.writeText(primitive.handler)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Copy code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 bg-gray-900 p-4 overflow-auto">
                <textarea
                  value={primitive.handler}
                  onChange={(e) => {
                    setPrimitive(prev => ({ ...prev, handler: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full h-full bg-transparent text-green-400 font-mono text-sm resize-none focus:outline-none"
                  spellCheck={false}
                  disabled={primitive.builtIn}
                />
              </div>
              {primitive.builtIn && (
                <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2 text-sm text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Built-in primitives cannot be edited
                </div>
              )}
            </div>

            {/* Test Panel */}
            <div className="w-96 flex flex-col bg-white">
              <div className="p-4 border-b">
                <h3 className="font-medium flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Test Primitive
                </h3>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Input */}
                <div className="p-4 border-b">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Input (JSON)
                  </label>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    spellCheck={false}
                  />
                </div>

                {/* Run Button */}
                <div className="p-4 border-b">
                  <button
                    onClick={handleTest}
                    disabled={isTesting}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {isTesting ? 'Running...' : 'Run Test'}
                  </button>
                </div>

                {/* Result */}
                <div className="flex-1 overflow-auto p-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Result
                  </label>
                  {testResult ? (
                    <div className="space-y-3">
                      <div className={`flex items-center gap-2 text-sm ${
                        testResult.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResult.success ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        {testResult.success ? 'Success' : 'Failed'}
                        <span className="text-gray-400">
                          ({testResult.executionTime}ms)
                        </span>
                      </div>

                      {testResult.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          {testResult.error}
                        </div>
                      )}

                      {testResult.securityWarnings && testResult.securityWarnings.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                          <div className="font-medium flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Security Warnings
                          </div>
                          <ul className="mt-1 list-disc list-inside">
                            {testResult.securityWarnings.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {testResult.result !== undefined && (
                        <pre className="p-3 bg-gray-100 rounded-lg text-sm overflow-auto max-h-48">
                          {JSON.stringify(testResult.result, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">
                      Run a test to see results
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'schema' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl">
              <h2 className="text-lg font-medium mb-4">Input Schema</h2>
              <p className="text-gray-500 mb-6">
                Define the input parameters this primitive accepts using JSON Schema.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Schema (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(primitive.inputSchema, null, 2)}
                    onChange={(e) => {
                      try {
                        const schema = JSON.parse(e.target.value);
                        setPrimitive(prev => ({ ...prev, inputSchema: schema }));
                        setHasChanges(true);
                      } catch {}
                    }}
                    className="w-full h-64 p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    spellCheck={false}
                    disabled={primitive.builtIn}
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Properties</h4>
                  {Object.entries(primitive.inputSchema.properties).map(([key, prop]: [string, any]) => (
                    <div key={key} className="flex items-start gap-4 py-2 border-b last:border-0">
                      <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                        {key}
                      </code>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600">{prop.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Type: {prop.type}
                          {primitive.inputSchema.required?.includes(key) && (
                            <span className="ml-2 text-red-500">Required</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={primitive.name}
                  onChange={(e) => {
                    setPrimitive(prev => ({ ...prev, name: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="my_primitive"
                  disabled={primitive.builtIn}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use snake_case. This is the name used to invoke the primitive.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Description
                </label>
                <textarea
                  value={primitive.description}
                  onChange={(e) => {
                    setPrimitive(prev => ({ ...prev, description: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this primitive does..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Category
                  </label>
                  <select
                    value={primitive.category}
                    onChange={(e) => {
                      setPrimitive(prev => ({ ...prev, category: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="data">Data</option>
                    <option value="text">Text</option>
                    <option value="math">Math</option>
                    <option value="logic">Logic</option>
                    <option value="datetime">Date/Time</option>
                    <option value="email">Email</option>
                    <option value="webhook">Webhook</option>
                    <option value="ai">AI</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={primitive.timeout}
                    onChange={(e) => {
                      setPrimitive(prev => ({ ...prev, timeout: parseInt(e.target.value) }));
                      setHasChanges(true);
                    }}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={1000}
                    max={300000}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={primitive.tags.join(', ')}
                  onChange={(e) => {
                    setPrimitive(prev => ({
                      ...prev,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                    }));
                    setHasChanges(true);
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              {!primitive.builtIn && (
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
                  <button
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Primitive
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl">
              <h2 className="text-lg font-medium mb-4">Execution History</h2>

              <div className="bg-white border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                      <th className="text-left p-3 font-medium text-sm">Time</th>
                      <th className="text-left p-3 font-medium text-sm">Duration</th>
                      <th className="text-left p-3 font-medium text-sm">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExecutions.map(exec => (
                      <tr key={exec.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-3">
                          {exec.success ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <Check className="w-4 h-4" />
                              Success
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 text-sm">
                              <X className="w-4 h-4" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(exec.startedAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {exec.executionTime}ms
                        </td>
                        <td className="p-3 text-sm text-red-600">
                          {exec.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
