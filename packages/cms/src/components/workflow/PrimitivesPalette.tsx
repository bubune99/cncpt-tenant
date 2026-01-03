'use client';

/**
 * Primitives Palette Component
 *
 * Sidebar showing available primitives that can be dragged onto the workflow canvas
 */

import { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, Box, ChevronDown, ChevronRight, Play, Clock, Webhook, Zap, CheckCircle, Terminal, Bell, Database, GitBranch } from 'lucide-react';
import type { AvailablePrimitive } from './types';

interface PrimitivesPaletteProps {
  primitives: AvailablePrimitive[];
  onDragStart: (event: React.DragEvent, type: string, data: unknown) => void;
}

// Category icons and colors
const categoryConfig: Record<string, { icon: string; color: string }> = {
  data: { icon: 'Database', color: 'text-blue-600' },
  text: { icon: 'FileText', color: 'text-green-600' },
  math: { icon: 'Calculator', color: 'text-purple-600' },
  logic: { icon: 'GitBranch', color: 'text-orange-600' },
  datetime: { icon: 'Calendar', color: 'text-pink-600' },
  api: { icon: 'Globe', color: 'text-cyan-600' },
};

// Trigger types
const triggers = [
  { type: 'manual', name: 'Manual Trigger', icon: Play, description: 'Run workflow manually' },
  { type: 'schedule', name: 'Schedule', icon: Clock, description: 'Run on a schedule (cron)' },
  { type: 'webhook', name: 'Webhook', icon: Webhook, description: 'Trigger via HTTP request' },
  { type: 'event', name: 'Event', icon: Zap, description: 'React to system events' },
];

// Output types
const outputs = [
  { type: 'return', name: 'Return', icon: CheckCircle, description: 'Return workflow result' },
  { type: 'log', name: 'Log', icon: Terminal, description: 'Log to console/file' },
  { type: 'notify', name: 'Notify', icon: Bell, description: 'Send notification' },
  { type: 'store', name: 'Store', icon: Database, description: 'Save to database' },
];

function NodeIcon({ iconName, className }: { iconName?: string; className?: string }) {
  if (!iconName) {
    return <Box className={className} />;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[iconName] as React.ComponentType<{ className?: string }> | undefined;
  return Icon ? <Icon className={className} /> : <Box className={className} />;
}

export default function PrimitivesPalette({ primitives, onDragStart }: PrimitivesPaletteProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['triggers', 'primitives']));

  // Group primitives by category
  const groupedPrimitives = useMemo(() => {
    const filtered = primitives.filter(
      p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );

    const groups: Record<string, AvailablePrimitive[]> = {};
    filtered.forEach(p => {
      const cat = p.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    return groups;
  }, [primitives, search]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleDragStartPrimitive = (e: React.DragEvent, primitive: AvailablePrimitive) => {
    onDragStart(e, 'primitive', {
      primitiveId: primitive.id,
      primitiveName: primitive.name,
      description: primitive.description,
      category: primitive.category,
      icon: primitive.icon,
      inputSchema: primitive.inputSchema,
      config: {},
      isConfigured: false,
    });
  };

  const handleDragStartTrigger = (e: React.DragEvent, triggerType: string) => {
    onDragStart(e, 'trigger', {
      triggerType,
      name: `${triggerType.charAt(0).toUpperCase() + triggerType.slice(1)} Trigger`,
      config: {},
    });
  };

  const handleDragStartOutput = (e: React.DragEvent, outputType: string) => {
    onDragStart(e, 'output', {
      outputType,
      name: `${outputType.charAt(0).toUpperCase() + outputType.slice(1)} Output`,
      config: {},
    });
  };

  const handleDragStartCondition = (e: React.DragEvent) => {
    onDragStart(e, 'condition', {
      name: 'Condition',
      expression: '',
    });
  };

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Palette content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Triggers */}
        <div className="space-y-1">
          <button
            onClick={() => toggleCategory('triggers')}
            className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {expandedCategories.has('triggers') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Zap className="h-4 w-4 text-emerald-600" />
            Triggers
          </button>
          {expandedCategories.has('triggers') && (
            <div className="pl-6 space-y-1">
              {triggers.map(trigger => (
                <div
                  key={trigger.type}
                  draggable
                  onDragStart={e => handleDragStartTrigger(e, trigger.type)}
                  className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 border border-emerald-200 cursor-grab hover:bg-emerald-100 transition-colors"
                >
                  <trigger.icon className="h-4 w-4 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700">{trigger.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Condition */}
        <div className="space-y-1">
          <button
            onClick={() => toggleCategory('logic-nodes')}
            className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {expandedCategories.has('logic-nodes') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <GitBranch className="h-4 w-4 text-orange-600" />
            Flow Control
          </button>
          {expandedCategories.has('logic-nodes') && (
            <div className="pl-6 space-y-1">
              <div
                draggable
                onDragStart={handleDragStartCondition}
                className="flex items-center gap-2 p-2 rounded-md bg-orange-50 border border-orange-200 cursor-grab hover:bg-orange-100 transition-colors"
              >
                <GitBranch className="h-4 w-4 text-orange-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700">Condition</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Outputs */}
        <div className="space-y-1">
          <button
            onClick={() => toggleCategory('outputs')}
            className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {expandedCategories.has('outputs') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <CheckCircle className="h-4 w-4 text-teal-600" />
            Outputs
          </button>
          {expandedCategories.has('outputs') && (
            <div className="pl-6 space-y-1">
              {outputs.map(output => (
                <div
                  key={output.type}
                  draggable
                  onDragStart={e => handleDragStartOutput(e, output.type)}
                  className="flex items-center gap-2 p-2 rounded-md bg-teal-50 border border-teal-200 cursor-grab hover:bg-teal-100 transition-colors"
                >
                  <output.icon className="h-4 w-4 text-teal-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700">{output.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primitives by category */}
        <div className="space-y-1">
          <button
            onClick={() => toggleCategory('primitives')}
            className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {expandedCategories.has('primitives') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Box className="h-4 w-4 text-blue-600" />
            Primitives
          </button>
          {expandedCategories.has('primitives') && (
            <div className="pl-2 space-y-2">
              {Object.entries(groupedPrimitives).map(([category, prims]) => {
                const config = categoryConfig[category] || { icon: 'Box', color: 'text-gray-600' };
                return (
                  <div key={category} className="space-y-1">
                    <button
                      onClick={() => toggleCategory(`primitives-${category}`)}
                      className="flex items-center gap-2 w-full text-left text-xs font-medium text-gray-600 hover:text-gray-800 pl-4"
                    >
                      {expandedCategories.has(`primitives-${category}`) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <NodeIcon iconName={config.icon} className={`h-3 w-3 ${config.color}`} />
                      <span className="capitalize">{category}</span>
                      <span className="text-gray-400">({prims.length})</span>
                    </button>
                    {expandedCategories.has(`primitives-${category}`) && (
                      <div className="pl-8 space-y-1">
                        {prims.map(primitive => (
                          <div
                            key={primitive.id}
                            draggable
                            onDragStart={e => handleDragStartPrimitive(e, primitive)}
                            className="flex items-center gap-2 p-2 rounded-md bg-gray-50 border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors"
                            title={primitive.description}
                          >
                            <NodeIcon iconName={primitive.icon} className={`h-4 w-4 ${config.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-700 truncate">
                                {primitive.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.keys(groupedPrimitives).length === 0 && (
                <div className="text-xs text-gray-500 italic pl-4">
                  No primitives found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Help text */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">
          Drag nodes onto the canvas to build your workflow
        </p>
      </div>
    </div>
  );
}
