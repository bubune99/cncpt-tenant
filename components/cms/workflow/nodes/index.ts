/**
 * Workflow Node Components Index
 */

export { default as PrimitiveNode } from './PrimitiveNode';
export { default as TriggerNode } from './TriggerNode';
export { default as ConditionNode } from './ConditionNode';
export { default as OutputNode } from './OutputNode';

import PrimitiveNode from './PrimitiveNode';
import TriggerNode from './TriggerNode';
import ConditionNode from './ConditionNode';
import OutputNode from './OutputNode';

/**
 * Node types map for React Flow
 */
export const nodeTypes = {
  primitive: PrimitiveNode,
  trigger: TriggerNode,
  condition: ConditionNode,
  output: OutputNode,
};
