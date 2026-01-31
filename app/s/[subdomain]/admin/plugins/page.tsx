'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Puzzle,
  Plus,
  Search,
  Settings,
  Power,
  Trash2,
  ChevronRight,
  Code2,
  Workflow,
  Zap,
  Package,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';

// Mock data types
interface Plugin {
  id: string;
  name: string;
  slug: string;
  description?: string;
  version: string;
  icon?: string;
  color?: string;
  enabled: boolean;
  builtIn: boolean;
  primitiveCount: number;
  author?: string;
  createdAt: string;
}

interface Primitive {
  id: string;
  name: string;
  description: string;
  category?: string;
  icon?: string;
  enabled: boolean;
  mounted: boolean;
  builtIn: boolean;
}

interface Stats {
  primitiveCount: number;
  mountedCount: number;
  pluginCount: number;
  enabledPluginCount: number;
  workflowCount: number;
  totalExecutions: number;
}

// Mock data
const mockPlugins: Plugin[] = [
  {
    id: 'plug_1',
    name: 'Email Automation',
    slug: 'email-automation',
    description: 'Send transactional and marketing emails with templates',
    version: '1.0.0',
    icon: 'Mail',
    color: '#3B82F6',
    enabled: true,
    builtIn: false,
    primitiveCount: 4,
    author: 'System',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'plug_2',
    name: 'Webhook Integration',
    slug: 'webhook-integration',
    description: 'Send and receive webhooks for external integrations',
    version: '1.0.0',
    icon: 'Webhook',
    color: '#10B981',
    enabled: false,
    builtIn: false,
    primitiveCount: 2,
    author: 'System',
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'plug_3',
    name: 'Data Utilities',
    slug: 'data-utilities',
    description: 'Built-in data transformation and validation primitives',
    version: '1.0.0',
    icon: 'Database',
    color: '#8B5CF6',
    enabled: true,
    builtIn: true,
    primitiveCount: 6,
    author: 'System',
    createdAt: '2024-01-10T10:00:00Z',
  },
];

const mockPrimitives: Primitive[] = [
  { id: 'prim_1', name: 'transform_json', description: 'Transform JSON data', category: 'data', icon: 'Braces', enabled: true, mounted: true, builtIn: true },
  { id: 'prim_2', name: 'validate_data', description: 'Validate against schema', category: 'data', icon: 'CheckCircle', enabled: true, mounted: true, builtIn: true },
  { id: 'prim_3', name: 'format_text', description: 'Format text templates', category: 'text', icon: 'FileText', enabled: true, mounted: true, builtIn: true },
  { id: 'prim_4', name: 'send_email', description: 'Send transactional email', category: 'email', icon: 'Mail', enabled: true, mounted: true, builtIn: false },
  { id: 'prim_5', name: 'calculate', description: 'Math expressions', category: 'math', icon: 'Calculator', enabled: true, mounted: true, builtIn: true },
  { id: 'prim_6', name: 'conditional', description: 'If/else logic', category: 'logic', icon: 'GitBranch', enabled: true, mounted: false, builtIn: true },
];

const mockStats: Stats = {
  primitiveCount: 12,
  mountedCount: 10,
  pluginCount: 3,
  enabledPluginCount: 2,
  workflowCount: 5,
  totalExecutions: 1234,
};

export default function PluginsPage() {
  const [activeTab, setActiveTab] = useState<'plugins' | 'primitives' | 'workflows'>('plugins');
  const [searchQuery, setSearchQuery] = useState('');
  const [plugins, setPlugins] = useState<Plugin[]>(mockPlugins);
  const [primitives, setPrimitives] = useState<Primitive[]>(mockPrimitives);
  const [stats, setStats] = useState<Stats>(mockStats);
  const [loading, setLoading] = useState(false);

  // Filter items based on search
  const filteredPlugins = plugins.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrimitives = primitives.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePluginEnabled = async (pluginId: string) => {
    setPlugins(prev =>
      prev.map(p =>
        p.id === pluginId ? { ...p, enabled: !p.enabled } : p
      )
    );
    // TODO: API call to toggle plugin
  };

  const refreshStats = async () => {
    setLoading(true);
    // TODO: API call to refresh stats
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Puzzle className="w-7 h-7" />
            Plugin System
          </h1>
          <p className="text-gray-500 mt-1">
            Manage primitives, plugins, and workflows for the self-extending agent
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshStats}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/plugins/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Plugin
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.primitiveCount}</div>
          <div className="text-gray-500 text-sm flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Primitives
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.mountedCount}</div>
          <div className="text-gray-500 text-sm flex items-center gap-1">
            <Power className="w-4 h-4" />
            Mounted
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.pluginCount}</div>
          <div className="text-gray-500 text-sm flex items-center gap-1">
            <Package className="w-4 h-4" />
            Plugins
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.enabledPluginCount}</div>
          <div className="text-gray-500 text-sm flex items-center gap-1">
            <Power className="w-4 h-4" />
            Enabled
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.workflowCount}</div>
          <div className="text-gray-500 text-sm flex items-center gap-1">
            <Workflow className="w-4 h-4" />
            Workflows
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.totalExecutions.toLocaleString()}</div>
          <div className="text-gray-500 text-sm flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Executions
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {[
            { id: 'plugins', label: 'Plugins', icon: Package, count: stats.pluginCount },
            { id: 'primitives', label: 'Primitives', icon: Zap, count: stats.primitiveCount },
            { id: 'workflows', label: 'Workflows', icon: Workflow, count: stats.workflowCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'plugins' && (
        <div className="grid gap-4">
          {filteredPlugins.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No plugins found. Create your first plugin to get started.
            </div>
          ) : (
            filteredPlugins.map(plugin => (
              <div
                key={plugin.id}
                className="bg-white border rounded-lg p-4 flex items-center justify-between hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: plugin.color || '#E5E7EB' }}
                  >
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{plugin.name}</h3>
                      <span className="text-xs text-gray-400">v{plugin.version}</span>
                      {plugin.builtIn && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Built-in
                        </span>
                      )}
                      {plugin.enabled && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{plugin.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{plugin.primitiveCount} primitives</span>
                      <span>by {plugin.author}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePluginEnabled(plugin.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      plugin.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/plugins/${plugin.id}`}
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  {!plugin.builtIn && (
                    <button
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                      title="Delete plugin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <Link
                    href={`/plugins/${plugin.id}`}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'primitives' && (
        <div>
          {/* Category filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'data', 'text', 'math', 'logic', 'email', 'datetime'].map(cat => (
              <button
                key={cat}
                className="px-3 py-1 text-sm border rounded-full hover:bg-gray-50 capitalize"
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            {filteredPrimitives.map(prim => (
              <div
                key={prim.id}
                className="bg-white border rounded-lg p-4 flex items-center justify-between hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm font-medium">{prim.name}</code>
                      {prim.builtIn && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Built-in
                        </span>
                      )}
                      {prim.mounted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Mounted
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{prim.description}</p>
                    <span className="text-xs text-gray-400 capitalize">{prim.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      prim.mounted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                    title={prim.mounted ? 'Dismount' : 'Mount'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/plugins/primitives/${prim.id}`}
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <Code2 className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/plugins/primitives/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create Primitive
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="text-center py-12">
          <Workflow className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Visual Workflow Builder</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Compose primitives into automated workflows using a visual drag-and-drop builder.
          </p>
          <Link
            href="/plugins/workflows/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Workflow
          </Link>
        </div>
      )}
    </div>
  );
}
