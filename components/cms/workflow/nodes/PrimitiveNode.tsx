'use client';

/**
 * Primitive Node Component
 *
 * Custom React Flow node for displaying primitives in the workflow builder
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';
import type { PrimitiveNodeData } from '../types';

interface PrimitiveNodeProps {
  data: PrimitiveNodeData;
  selected?: boolean;
}

// Dynamic icon component
function NodeIcon({ iconName, className }: { iconName?: string; className?: string }) {
  if (!iconName) {
    return <LucideIcons.Box className={className} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[iconName] as React.ComponentType<{ className?: string }> | undefined;
  if (!Icon) {
    return <LucideIcons.Box className={className} />;
  }

  return <Icon className={className} />;
}

// Category colors
const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  data: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  text: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  math: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  logic: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  datetime: { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700' },
  api: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700' },
  default: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' },
};

function PrimitiveNode({ data, selected }: PrimitiveNodeProps) {
  const colors = categoryColors[data.category || 'default'] || categoryColors.default;
  const inputFields = Object.entries(
    (data.inputSchema as { properties?: Record<string, unknown> })?.properties || {}
  );

  return (
    <div
      className={`
        min-w-[180px] rounded-lg border-2 shadow-md transition-all
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${!data.isConfigured ? 'border-dashed' : ''}
      `}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className={`px-3 py-2 border-b ${colors.border} flex items-center gap-2`}>
        <NodeIcon iconName={data.icon} className={`h-4 w-4 ${colors.text}`} />
        <span className={`text-sm font-medium ${colors.text} truncate`}>
          {data.primitiveName}
        </span>
      </div>

      {/* Body - show input fields */}
      <div className="px-3 py-2 space-y-1">
        {inputFields.slice(0, 4).map(([key, _prop]) => {
          const isConfigured = key in data.config;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConfigured ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-gray-600 truncate">{key}</span>
            </div>
          );
        })}
        {inputFields.length > 4 && (
          <div className="text-xs text-gray-400">
            +{inputFields.length - 4} more
          </div>
        )}
        {inputFields.length === 0 && (
          <div className="text-xs text-gray-400 italic">No inputs</div>
        )}
      </div>

      {/* Status indicator */}
      {!data.isConfigured && (
        <div className="px-3 py-1.5 border-t border-dashed border-gray-300 bg-yellow-50">
          <span className="text-xs text-yellow-600 flex items-center gap-1">
            <LucideIcons.AlertCircle className="h-3 w-3" />
            Needs configuration
          </span>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
}

export default memo(PrimitiveNode);
