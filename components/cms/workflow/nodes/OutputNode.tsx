'use client';

/**
 * Output Node Component
 *
 * End/output nodes for workflows (return, log, notify, store)
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle, Terminal, Bell, Database } from 'lucide-react';
import type { OutputNodeData } from '../types';

interface OutputNodeProps {
  data: OutputNodeData;
  selected?: boolean;
}

const outputIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  return: CheckCircle,
  log: Terminal,
  notify: Bell,
  store: Database,
};

const outputColors: Record<string, { bg: string; border: string; text: string }> = {
  return: { bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-700' },
  log: { bg: 'bg-slate-50', border: 'border-slate-400', text: 'text-slate-700' },
  notify: { bg: 'bg-sky-50', border: 'border-sky-400', text: 'text-sky-700' },
  store: { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700' },
};

function OutputNode({ data, selected }: OutputNodeProps) {
  const Icon = outputIcons[data.outputType] || CheckCircle;
  const colors = outputColors[data.outputType] || outputColors.return;

  return (
    <div
      className={`
        min-w-[160px] rounded-lg border-2 shadow-md transition-all
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
    >
      {/* Input handle - outputs only have inputs */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Header with icon */}
      <div className="px-3 py-2 flex items-center gap-2">
        <div className={`p-1.5 rounded-md bg-white/80 ${colors.border} border`}>
          <Icon className={`h-4 w-4 ${colors.text}`} />
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${colors.text}`}>
            {data.name}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {data.outputType} output
          </span>
        </div>
      </div>

      {/* Config preview */}
      <div className="px-3 py-2 border-t border-dashed border-gray-200 space-y-1">
        {data.outputType === 'store' && data.config.destination && (
          <div className="text-xs text-gray-600 truncate">
            <span className="font-medium">Store:</span> {data.config.destination}
          </div>
        )}
        {data.outputType === 'notify' && data.config.destination && (
          <div className="text-xs text-gray-600 truncate">
            <span className="font-medium">To:</span> {data.config.destination}
          </div>
        )}
        {data.outputType === 'return' && (
          <div className="text-xs text-gray-500 italic">
            Returns workflow result
          </div>
        )}
        {data.outputType === 'log' && (
          <div className="text-xs text-gray-500 italic">
            Logs to console/file
          </div>
        )}
      </div>

      {/* End indicator */}
      <div className={`px-3 py-1.5 border-t ${colors.border} bg-white/50 rounded-b-lg`}>
        <span className={`text-xs ${colors.text} font-medium`}>
          End
        </span>
      </div>
    </div>
  );
}

export default memo(OutputNode);
