'use client';

/**
 * Trigger Node Component
 *
 * Entry point nodes for workflows (manual, schedule, webhook, event)
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Clock, Webhook, Zap } from 'lucide-react';
import type { TriggerNodeData } from '../types';

interface TriggerNodeProps {
  data: TriggerNodeData;
  selected?: boolean;
}

const triggerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  manual: Play,
  schedule: Clock,
  webhook: Webhook,
  event: Zap,
};

const triggerColors: Record<string, { bg: string; border: string; text: string }> = {
  manual: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' },
  schedule: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  webhook: { bg: 'bg-violet-50', border: 'border-violet-400', text: 'text-violet-700' },
  event: { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700' },
};

function TriggerNode({ data, selected }: TriggerNodeProps) {
  const Icon = triggerIcons[data.triggerType] || Play;
  const colors = triggerColors[data.triggerType] || triggerColors.manual;

  return (
    <div
      className={`
        min-w-[160px] rounded-lg border-2 shadow-md transition-all
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
    >
      {/* Header with icon */}
      <div className={`px-3 py-2 flex items-center gap-2`}>
        <div className={`p-1.5 rounded-md bg-white/80 ${colors.border} border`}>
          <Icon className={`h-4 w-4 ${colors.text}`} />
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${colors.text}`}>
            {data.name}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {data.triggerType} trigger
          </span>
        </div>
      </div>

      {/* Config preview */}
      <div className="px-3 py-2 border-t border-dashed border-gray-200 space-y-1">
        {data.triggerType === 'schedule' && data.config.schedule && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Schedule:</span> {data.config.schedule}
          </div>
        )}
        {data.triggerType === 'webhook' && data.config.webhookPath && (
          <div className="text-xs text-gray-600 truncate">
            <span className="font-medium">Path:</span> {data.config.webhookPath}
          </div>
        )}
        {data.triggerType === 'event' && data.config.eventType && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Event:</span> {data.config.eventType}
          </div>
        )}
        {data.triggerType === 'manual' && (
          <div className="text-xs text-gray-500 italic">
            Click to run manually
          </div>
        )}
      </div>

      {/* Output handle - triggers only have outputs */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
}

export default memo(TriggerNode);
