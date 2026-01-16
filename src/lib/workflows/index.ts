/**
 * Workflow System
 *
 * Event-driven, toggleable workflow engine for automating business processes.
 * Integrates with React Flow for visual workflow building.
 *
 * @example Basic workflow execution
 * ```ts
 * import { executeWorkflow, triggerWorkflowManually } from './';
 *
 * // Execute by ID
 * const result = await triggerWorkflowManually('workflow-id', { orderId: '123' });
 *
 * // Execute by webhook
 * const result = await triggerWorkflowByWebhook('order-confirmation', payload);
 * ```
 *
 * @example Event-driven workflows
 * ```ts
 * import { events, emit } from './';
 *
 * // Emit predefined events
 * await events.order.created(order);
 * await events.user.subscribed(user, 'newsletter');
 *
 * // Emit custom events
 * await emit('custom.event', { data: 'payload' });
 * ```
 *
 * @example React Flow integration
 * ```tsx
 * import {
 *   toReactFlowNodes,
 *   toReactFlowEdges,
 *   validateWorkflow,
 *   serializeWorkflow,
 * } from './';
 *
 * // Load workflow for editor
 * const { nodes, edges } = deserializeWorkflow(workflow);
 *
 * // Save workflow
 * const data = serializeWorkflow(nodes, edges, viewport);
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Event types
  WorkflowEventType,
  WorkflowEvent,
  EventSubscription,

  // Node types
  WorkflowNodeType,
  WorkflowNodeConfig,
  InputMapping,
  WorkflowCondition,

  // Execution types
  WorkflowExecutionStatus,
  WorkflowContext,
  NodeExecutionResult,
  WorkflowExecutionResult,

  // Template types
  WorkflowTemplate,
  WorkflowTemplateCategory,
  WorkflowTemplateNode,
  WorkflowTemplateEdge,

  // Action types
  ActionHandler,
  ActionDefinition,

  // Database types
  WorkflowWithNodes,
  WorkflowExecutionWithDetails,

  // API types
  CreateWorkflowInput,
  UpdateWorkflowInput,
  TriggerWorkflowInput,
  WorkflowListOptions,
} from './types';

// =============================================================================
// EVENT BUS
// =============================================================================

export {
  eventBus,
  emit,
  emitAsync,
  subscribe,
  unsubscribe,
  events,
} from './event-bus';

// =============================================================================
// WORKFLOW ENGINE
// =============================================================================

export {
  executeWorkflow,
  executeWorkflowInstance,
  cancelWorkflowExecution,
  getWorkflowExecutionStatus,
  getWorkflowExecutions,
  triggerWorkflowManually,
  triggerWorkflowByWebhook,
  getScheduledWorkflows,
  shouldRunScheduledWorkflow,
} from './engine';

// =============================================================================
// CONTEXT
// =============================================================================

export {
  createWorkflowContext,
  resolveValue,
  resolveInputMapping,
  resolveNodeInputs,
  resolveTemplate,
  evaluateExpression,
  evaluateCondition,
  setNodeOutput,
  setVariable,
  addError,
  createIterationContext,
  serializeContext,
  deserializeContext,
  getContextSummary,
  cloneContext,
} from './context';

// =============================================================================
// PRIMITIVE ADAPTER
// =============================================================================

export {
  getPrimitive,
  getPrimitiveByName,
  getPrimitivesByCategory,
  getAllPrimitives,
  validatePrimitiveInput,
  executePrimitive,
  executePrimitiveByName,
  getPrimitiveExecutionHistory,
  getPrimitiveCategories,
  isPrimitiveAvailable,
  getPrimitiveInputSchema,
  clearPrimitiveCache,
} from './primitive-adapter';

// =============================================================================
// REACT FLOW INTEGRATION
// =============================================================================

export {
  // Types
  type XYPosition,
  type Viewport,
  type Node,
  type Edge,
  type WorkflowNodeData,
  type WorkflowEdgeData,
  type WorkflowReactFlowNode,
  type WorkflowReactFlowEdge,
  type NodeTypeDefinition,
  type WorkflowValidationResult,
  type WorkflowValidationError,
  type WorkflowValidationWarning,
  type WorkflowGraphData,

  // Constants
  nodeTypeDefinitions,

  // Conversion utilities
  toReactFlowNodes,
  toReactFlowEdges,
  fromReactFlowNodes,
  fromReactFlowEdges,

  // Validation
  validateWorkflow,

  // Layout
  autoLayoutNodes,

  // Node creation
  generateNodeId,
  generateEdgeId,
  createTriggerNode,
  createPrimitiveNode,
  createConditionNode,
  createOutputNode,

  // Serialization
  serializeWorkflow,
  deserializeWorkflow,
} from './react-flow';

// =============================================================================
// BUILT-IN ACTIONS
// =============================================================================

export {
  registerAction,
  getAction,
  getAllActions,
  getActionsByCategory,
  executeAction,
  actionCategories,
} from './actions';

// =============================================================================
// WORKFLOW TEMPLATES
// =============================================================================

export {
  // Types
  type WorkflowTemplateWithDetails,
  type TemplateStepDefinition,
  type InstallTemplateOptions,
  type InstallResult,

  // Template queries
  getWorkflowTemplates,
  getWorkflowTemplate,
  getTemplatesByCategory,
  getPopularTemplates,
  getRecommendedTemplates,

  // Template installation
  installWorkflowTemplate,

  // Template management
  createTemplateFromWorkflow,
  updateTemplate,
  deleteTemplate,

  // Statistics
  getTemplateStats,
  getCategoryStats,
} from './templates';

// =============================================================================
// WORKFLOW TOGGLE
// =============================================================================

export {
  // Types
  type ToggleResult,
  type BulkToggleResult,
  type WorkflowStatus,

  // Single workflow toggle
  enableWorkflow,
  disableWorkflow,
  toggleWorkflow,

  // Bulk operations
  enableWorkflows,
  disableWorkflows,
  disableAllWorkflows,
  enableWorkflowsByCategory,
  disableWorkflowsByTrigger,

  // Validation
  canEnableWorkflow,

  // Status queries
  getWorkflowStatus,
  getAllWorkflowStatuses,
  getEnabledWorkflowCounts,

  // Initialization
  initializeEventWorkflows,
  cleanupAllSubscriptions,
} from './toggle';
