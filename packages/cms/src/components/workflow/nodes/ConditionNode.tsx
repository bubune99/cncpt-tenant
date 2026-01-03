'use client';

/**
 * Condition Node Component
 *
 * Branching node for conditional workflow paths
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import type { ConditionNodeData } from '../types';

interface ConditionNodeProps {
  data: ConditionNodeData;
  selected?: boolean;
}

function ConditionNode({ data, selected }: ConditionNodeProps) {
  const hasExpression = Boolean(data.expression?.trim());

  return (
    <div
      className={`
        min-w-[140px] transition-all
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Diamond shape container */}
      <div className="relative">
        {/* Diamond background */}
        <div
          className={`
            w-24 h-24 mx-auto transform rotate-45
            border-2 rounded-lg shadow-md
            ${hasExpression ? 'bg-orange-50 border-orange-400' : 'bg-gray-50 border-gray-300 border-dashed'}
          `}
        />

        {/* Content overlay (not rotated) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <GitBranch className={`h-5 w-5 ${hasExpression ? 'text-orange-600' : 'text-gray-400'}`} />
          <span className={`text-xs mt-1 font-medium ${hasExpression ? 'text-orange-700' : 'text-gray-500'}`}>
            {data.name || 'Condition'}
          </span>
        </div>
      </div>

      {/* True/False labels */}
      <div className="flex justify-between px-2 mt-2">
        <span className="text-xs text-green-600 font-medium">True</span>
        <span className="text-xs text-red-600 font-medium">False</span>
      </div>

      {/* Output handles - True (left) and False (right) */}
      <Handle
        type="source"
        position={Position.Left}
        id="true"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !-left-1.5"
        style={{ top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !-right-1.5"
        style={{ top: '50%' }}
      />
    </div>
  );
}

export default memo(ConditionNode);
