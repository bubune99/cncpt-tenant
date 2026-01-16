"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _chunkH7VBPMCNjs = require('./chunk-H7VBPMCN.js');



var _chunkHY7GTCJMjs = require('./chunk-HY7GTCJM.js');

// src/lib/workflows/context.ts
var _uuid = require('uuid');
function createWorkflowContext(workflowId, trigger, initialVariables) {
  return {
    executionId: _uuid.v4.call(void 0, ),
    workflowId,
    startedAt: /* @__PURE__ */ new Date(),
    trigger,
    variables: initialVariables || {},
    nodeOutputs: {},
    executedNodes: [],
    errors: []
  };
}
function resolveValue(context, path) {
  const parts = path.split(".");
  let current = context;
  for (const part of parts) {
    if (current === null || current === void 0) {
      return void 0;
    }
    if (typeof current !== "object") {
      return void 0;
    }
    if (part === "trigger") {
      current = context.trigger;
    } else if (part === "variables") {
      current = context.variables;
    } else if (part === "nodes") {
      current = context.nodeOutputs;
    } else if (part === "event") {
      current = context.trigger.event;
    } else {
      current = current[part];
    }
  }
  return current;
}
function resolveInputMapping(mapping, context) {
  if (typeof mapping === "string") {
    if (mapping.includes("{{")) {
      return resolveTemplate(mapping, context);
    }
    return resolveValue(context, mapping);
  }
  switch (mapping.type) {
    case "static":
      return mapping.value;
    case "reference":
      return resolveValue(context, mapping.path || mapping.value);
    case "expression":
      return evaluateExpression(mapping.value, context);
    case "template":
      return resolveTemplate(mapping.value, context);
    default:
      return mapping.value;
  }
}
function resolveNodeInputs(inputMapping, context) {
  if (!inputMapping) return {};
  const resolved = {};
  for (const [key, mapping] of Object.entries(inputMapping)) {
    resolved[key] = resolveInputMapping(mapping, context);
  }
  return resolved;
}
function resolveTemplate(template, context) {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const value = resolveValue(context, path.trim());
    return value !== void 0 && value !== null ? String(value) : "";
  });
}
function evaluateExpression(expression, context) {
  const safeContext = {
    trigger: context.trigger,
    variables: context.variables,
    nodes: context.nodeOutputs,
    event: context.trigger.event,
    // Helper functions
    $get: (path) => resolveValue(context, path),
    $len: (arr) => Array.isArray(arr) ? arr.length : 0,
    $exists: (path) => resolveValue(context, path) !== void 0,
    $empty: (val) => val === void 0 || val === null || val === "" || Array.isArray(val) && val.length === 0,
    $now: () => (/* @__PURE__ */ new Date()).toISOString(),
    $lower: (str) => typeof str === "string" ? str.toLowerCase() : str,
    $upper: (str) => typeof str === "string" ? str.toUpperCase() : str,
    $trim: (str) => typeof str === "string" ? str.trim() : str,
    $number: (val) => Number(val),
    $string: (val) => String(val),
    $json: (val) => JSON.stringify(val),
    $parse: (str) => typeof str === "string" ? JSON.parse(str) : str
  };
  try {
    const fn = new Function(
      ...Object.keys(safeContext),
      `"use strict"; return (${expression});`
    );
    return fn(...Object.values(safeContext));
  } catch (error) {
    console.error("[WorkflowContext] Expression evaluation error:", error);
    return void 0;
  }
}
function evaluateCondition(condition, context) {
  switch (condition.type) {
    case "simple":
      return evaluateSimpleCondition(condition, context);
    case "expression":
      return Boolean(evaluateExpression(condition.expression || "false", context));
    case "all":
      return (condition.conditions || []).every((c) => evaluateCondition(c, context));
    case "any":
      return (condition.conditions || []).some((c) => evaluateCondition(c, context));
    case "none":
      return !(condition.conditions || []).some((c) => evaluateCondition(c, context));
    default:
      return true;
  }
}
function evaluateSimpleCondition(condition, context) {
  const fieldValue = condition.field ? resolveValue(context, condition.field) : void 0;
  const compareValue = condition.value;
  switch (condition.operator) {
    case "eq":
      return fieldValue === compareValue;
    case "neq":
      return fieldValue !== compareValue;
    case "gt":
      return typeof fieldValue === "number" && typeof compareValue === "number" && fieldValue > compareValue;
    case "gte":
      return typeof fieldValue === "number" && typeof compareValue === "number" && fieldValue >= compareValue;
    case "lt":
      return typeof fieldValue === "number" && typeof compareValue === "number" && fieldValue < compareValue;
    case "lte":
      return typeof fieldValue === "number" && typeof compareValue === "number" && fieldValue <= compareValue;
    case "contains":
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return fieldValue.includes(compareValue);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(compareValue);
      }
      return false;
    case "startsWith":
      return typeof fieldValue === "string" && typeof compareValue === "string" && fieldValue.startsWith(compareValue);
    case "endsWith":
      return typeof fieldValue === "string" && typeof compareValue === "string" && fieldValue.endsWith(compareValue);
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case "notIn":
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case "exists":
      return compareValue ? fieldValue !== void 0 && fieldValue !== null : fieldValue === void 0 || fieldValue === null;
    default:
      return true;
  }
}
function setNodeOutput(context, nodeId, output) {
  return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context), {
    nodeOutputs: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context.nodeOutputs), {
      [nodeId]: output
    }),
    executedNodes: [...context.executedNodes, nodeId],
    currentNodeId: nodeId
  });
}
function setVariable(context, name, value) {
  return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context), {
    variables: _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context.variables), {
      [name]: value
    })
  });
}
function addError(context, nodeId, error) {
  return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context), {
    errors: [
      ...context.errors,
      {
        nodeId,
        error,
        timestamp: /* @__PURE__ */ new Date()
      }
    ]
  });
}
function createIterationContext(context, itemVariable, item, indexVariable, index) {
  const variables = _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context.variables), {
    [itemVariable]: item
  });
  if (indexVariable) {
    variables[indexVariable] = index;
  }
  return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context), {
    variables
  });
}
function serializeContext(context) {
  return JSON.stringify(_chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context), {
    startedAt: context.startedAt.toISOString(),
    errors: context.errors.map((e) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, e), {
      timestamp: e.timestamp.toISOString()
    }))
  }));
}
function deserializeContext(serialized) {
  const parsed = JSON.parse(serialized);
  return _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, parsed), {
    startedAt: new Date(parsed.startedAt),
    errors: parsed.errors.map((e) => _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, e), {
      timestamp: new Date(e.timestamp)
    }))
  });
}
function getContextSummary(context) {
  return {
    executionId: context.executionId,
    workflowId: context.workflowId,
    triggerType: context.trigger.type,
    executedNodes: context.executedNodes.length,
    variableCount: Object.keys(context.variables).length,
    errorCount: context.errors.length,
    hasErrors: context.errors.length > 0
  };
}
function cloneContext(context) {
  return JSON.parse(JSON.stringify(context));
}

// src/lib/workflows/primitive-adapter.ts
var _ajv = require('ajv'); var _ajv2 = _interopRequireDefault(_ajv);
var primitiveCache = /* @__PURE__ */ new Map();
var ajv = new (0, _ajv2.default)({ allErrors: true, useDefaults: true });
function clearPrimitiveCache() {
  primitiveCache.clear();
}
async function getPrimitive(primitiveId) {
  if (primitiveCache.has(primitiveId)) {
    return primitiveCache.get(primitiveId);
  }
  const primitive = await _chunkH7VBPMCNjs.prisma.primitive.findUnique({
    where: { id: primitiveId }
  });
  if (primitive) {
    primitiveCache.set(primitiveId, primitive);
  }
  return primitive;
}
async function getPrimitiveByName(name) {
  for (const primitive2 of primitiveCache.values()) {
    if (primitive2.name === name) {
      return primitive2;
    }
  }
  const primitive = await _chunkH7VBPMCNjs.prisma.primitive.findUnique({
    where: { name }
  });
  if (primitive) {
    primitiveCache.set(primitive.id, primitive);
  }
  return primitive;
}
async function getPrimitivesByCategory(category) {
  return _chunkH7VBPMCNjs.prisma.primitive.findMany({
    where: {
      category,
      enabled: true
    },
    orderBy: { name: "asc" }
  });
}
async function getAllPrimitives() {
  return _chunkH7VBPMCNjs.prisma.primitive.findMany({
    where: { enabled: true },
    orderBy: { category: "asc" }
  });
}
function validatePrimitiveInput(primitive, input) {
  const schema = primitive.inputSchema;
  if (!schema || Object.keys(schema).length === 0) {
    return { valid: true };
  }
  try {
    const validate = ajv.compile(schema);
    const valid = validate(input);
    if (!valid && validate.errors) {
      return {
        valid: false,
        errors: validate.errors.map(
          (e) => `${e.instancePath || "input"} ${e.message}`
        )
      };
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: [`Schema validation error: ${error instanceof Error ? error.message : "Unknown"}`]
    };
  }
}
async function executePrimitive(primitiveId, input, context) {
  var _a;
  const startedAt = /* @__PURE__ */ new Date();
  const startTime = Date.now();
  const primitive = await getPrimitive(primitiveId);
  if (!primitive) {
    throw new Error(`Primitive not found: ${primitiveId}`);
  }
  if (!primitive.enabled) {
    throw new Error(`Primitive is disabled: ${primitive.name}`);
  }
  const validation = validatePrimitiveInput(primitive, input);
  if (!validation.valid) {
    throw new Error(`Invalid input: ${(_a = validation.errors) == null ? void 0 : _a.join(", ")}`);
  }
  let output;
  let success = true;
  let errorMessage;
  try {
    output = await executeHandler(primitive, input);
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw error;
  } finally {
    const completedAt = /* @__PURE__ */ new Date();
    const executionTime = Date.now() - startTime;
    await logPrimitiveExecution({
      primitiveId,
      workflowExecutionId: context == null ? void 0 : context.workflowExecutionId,
      userId: context == null ? void 0 : context.userId,
      agentId: context == null ? void 0 : context.agentId,
      input,
      output,
      success,
      error: errorMessage,
      startedAt,
      completedAt,
      executionTime
    });
  }
  return output;
}
async function executePrimitiveByName(name, input, context) {
  const primitive = await getPrimitiveByName(name);
  if (!primitive) {
    throw new Error(`Primitive not found: ${name}`);
  }
  return executePrimitive(primitive.id, input, context);
}
async function executeHandler(primitive, input) {
  const handler = primitive.handler;
  const context = createExecutionContext(primitive);
  try {
    const AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    const fn = new AsyncFunction("input", "context", handler);
    const result = await Promise.race([
      fn(input, context),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Execution timeout")), primitive.timeout)
      )
    ]);
    return result;
  } catch (error) {
    console.error(`[PrimitiveAdapter] Handler error for ${primitive.name}:`, error);
    throw error;
  }
}
function createExecutionContext(primitive) {
  return {
    // Primitive metadata
    primitiveId: primitive.id,
    primitiveName: primitive.name,
    primitiveVersion: primitive.version,
    // Utilities
    log: (...args) => console.log(`[${primitive.name}]`, ...args),
    error: (...args) => console.error(`[${primitive.name}]`, ...args),
    // HTTP helpers (if needed by handler)
    fetch: globalThis.fetch,
    // Environment (filtered for security)
    env: {
      NODE_ENV: process.env.NODE_ENV
    }
  };
}
async function logPrimitiveExecution(params) {
  return _chunkH7VBPMCNjs.prisma.primitiveExecution.create({
    data: {
      primitiveId: params.primitiveId,
      workflowExecutionId: params.workflowExecutionId,
      userId: params.userId,
      agentId: params.agentId,
      input: params.input,
      output: params.output,
      success: params.success,
      error: params.error,
      startedAt: params.startedAt,
      completedAt: params.completedAt,
      executionTime: params.executionTime
    }
  });
}
async function getPrimitiveExecutionHistory(primitiveId, options) {
  return _chunkH7VBPMCNjs.prisma.primitiveExecution.findMany({
    where: _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      primitiveId
    }, (options == null ? void 0 : options.success) !== void 0 && { success: options.success }), (options == null ? void 0 : options.workflowExecutionId) && {
      workflowExecutionId: options.workflowExecutionId
    }),
    orderBy: { startedAt: "desc" },
    take: (options == null ? void 0 : options.limit) || 50
  });
}
async function getPrimitiveCategories() {
  const primitives = await _chunkH7VBPMCNjs.prisma.primitive.findMany({
    where: { enabled: true },
    select: { category: true },
    distinct: ["category"]
  });
  return primitives.map((p) => p.category).filter((c) => c !== null).sort();
}
async function isPrimitiveAvailable(primitiveId) {
  const primitive = await getPrimitive(primitiveId);
  return primitive !== null && primitive.enabled;
}
async function getPrimitiveInputSchema(primitiveId) {
  const primitive = await getPrimitive(primitiveId);
  if (!primitive) return null;
  return primitive.inputSchema;
}

// src/lib/workflows/engine.ts
async function executeWorkflow(workflowId, options) {
  const workflow = await _chunkH7VBPMCNjs.prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      workflowNodes: {
        include: { primitive: true }
      }
    }
  });
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }
  if (!workflow.enabled) {
    throw new Error(`Workflow is disabled: ${workflowId}`);
  }
  return executeWorkflowInstance(workflow, options);
}
async function executeWorkflowInstance(workflow, options) {
  const nodes = workflow.nodes;
  const edges = workflow.edges;
  const workflowVariables = workflow.variables;
  const execution = await _chunkH7VBPMCNjs.prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      triggeredBy: options.triggeredBy,
      userId: options.userId,
      agentId: options.agentId,
      eventData: options.eventData,
      status: "RUNNING"
    }
  });
  let context = createWorkflowContext(
    workflow.id,
    {
      type: options.triggeredBy,
      data: options.eventData,
      event: options.eventData
    },
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, workflowVariables), options.variables)
  );
  context = _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context), { executionId: execution.id });
  const nodeResults = [];
  const startTime = Date.now();
  try {
    const triggerNode = nodes.find((n) => n.data.nodeType === "trigger");
    if (!triggerNode) {
      throw new Error("No trigger node found in workflow");
    }
    const result = await executeNode(
      triggerNode,
      nodes,
      edges,
      context,
      nodeResults,
      workflow.id
    );
    const completedAt = /* @__PURE__ */ new Date();
    await _chunkH7VBPMCNjs.prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: "COMPLETED",
        result: result.output,
        completedAt
      }
    });
    await _chunkH7VBPMCNjs.prisma.workflow.update({
      where: { id: workflow.id },
      data: { lastRunAt: completedAt }
    });
    return {
      executionId: execution.id,
      workflowId: workflow.id,
      status: "COMPLETED",
      startedAt: execution.startedAt,
      completedAt,
      duration: Date.now() - startTime,
      result: result.output,
      nodeResults
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await _chunkH7VBPMCNjs.prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: "FAILED",
        error: errorMessage,
        completedAt: /* @__PURE__ */ new Date()
      }
    });
    return {
      executionId: execution.id,
      workflowId: workflow.id,
      status: "FAILED",
      startedAt: execution.startedAt,
      completedAt: /* @__PURE__ */ new Date(),
      duration: Date.now() - startTime,
      error: errorMessage,
      nodeResults
    };
  }
}
async function executeNode(node, allNodes, allEdges, context, nodeResults, workflowId) {
  var _a;
  const nodeStartTime = Date.now();
  const config = node.data.config;
  let output;
  let updatedContext = context;
  try {
    switch (node.data.nodeType) {
      case "trigger":
        output = context.trigger.data;
        break;
      case "primitive":
        output = await executePrimitiveNode(node, config, context, workflowId);
        break;
      case "condition":
        output = await executeConditionNode(node, config, context);
        break;
      case "loop":
        const loopResult = await executeLoopNode(
          node,
          config,
          allNodes,
          allEdges,
          context,
          nodeResults,
          workflowId
        );
        output = loopResult.output;
        updatedContext = loopResult.context;
        break;
      case "delay":
        output = await executeDelayNode(config);
        break;
      case "parallel":
        output = await executeParallelNode(
          node,
          allNodes,
          allEdges,
          context,
          nodeResults,
          workflowId
        );
        break;
      case "output":
        output = resolveNodeInputs(config == null ? void 0 : config.inputMapping, context);
        break;
      default:
        output = null;
    }
    updatedContext = setNodeOutput(updatedContext, node.id, output);
    nodeResults.push({
      nodeId: node.id,
      success: true,
      output,
      duration: Date.now() - nodeStartTime
    });
    const outgoingEdges = allEdges.filter((e) => e.source === node.id);
    for (const edge of outgoingEdges) {
      if ((_a = edge.data) == null ? void 0 : _a.condition) {
        const conditionMet = evaluateCondition(edge.data.condition, updatedContext);
        if (!conditionMet) continue;
      }
      if (node.data.nodeType === "condition" && edge.sourceHandle) {
        const conditionResult = output;
        if (edge.sourceHandle === "true" && !conditionResult) continue;
        if (edge.sourceHandle === "false" && conditionResult) continue;
      }
      const targetNode = allNodes.find((n) => n.id === edge.target);
      if (targetNode) {
        const result = await executeNode(
          targetNode,
          allNodes,
          allEdges,
          updatedContext,
          nodeResults,
          workflowId
        );
        updatedContext = result.context;
        output = result.output;
      }
    }
    return { output, context: updatedContext };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    nodeResults.push({
      nodeId: node.id,
      success: false,
      error: errorMessage,
      duration: Date.now() - nodeStartTime
    });
    updatedContext = addError(updatedContext, node.id, errorMessage);
    throw error;
  }
}
async function executePrimitiveNode(node, config, context, workflowId) {
  const primitiveId = node.data.primitiveId;
  if (!primitiveId) {
    throw new Error(`Primitive node ${node.id} has no primitive assigned`);
  }
  const inputs = resolveNodeInputs(config == null ? void 0 : config.inputMapping, context);
  const finalInputs = _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, config == null ? void 0 : config.primitiveConfig), inputs);
  return executePrimitive(primitiveId, finalInputs, {
    workflowExecutionId: context.executionId,
    workflowId
  });
}
async function executeConditionNode(node, config, context) {
  if (!(config == null ? void 0 : config.condition)) {
    return true;
  }
  return evaluateCondition(config.condition, context);
}
async function executeLoopNode(node, config, allNodes, allEdges, context, nodeResults, workflowId) {
  if (!(config == null ? void 0 : config.loop)) {
    return { output: [], context };
  }
  const { collection, itemVariable, indexVariable } = config.loop;
  const items = context.variables[collection];
  if (!Array.isArray(items)) {
    throw new Error(`Loop collection "${collection}" is not an array`);
  }
  const loopBodyEdges = allEdges.filter(
    (e) => e.source === node.id && e.sourceHandle === "body"
  );
  const results = [];
  let currentContext = context;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const iterContext = createIterationContext(
      currentContext,
      itemVariable,
      item,
      indexVariable,
      i
    );
    for (const edge of loopBodyEdges) {
      const bodyNode = allNodes.find((n) => n.id === edge.target);
      if (bodyNode) {
        const result = await executeNode(
          bodyNode,
          allNodes,
          allEdges,
          iterContext,
          nodeResults,
          workflowId
        );
        results.push(result.output);
        currentContext = _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, result.context), {
          variables: _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, result.context.variables), {
            [itemVariable]: void 0
          }), indexVariable ? { [indexVariable]: void 0 } : {})
        });
      }
    }
  }
  return { output: results, context: currentContext };
}
async function executeDelayNode(config) {
  if (!(config == null ? void 0 : config.delay)) {
    return { delayed: false, duration: 0 };
  }
  const { duration, unit } = config.delay;
  let ms = duration;
  switch (unit) {
    case "minutes":
      ms = duration * 60 * 1e3;
      break;
    case "hours":
      ms = duration * 60 * 60 * 1e3;
      break;
    case "days":
      ms = duration * 24 * 60 * 60 * 1e3;
      break;
    default:
      ms = duration * 1e3;
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
  return { delayed: true, duration: ms };
}
async function executeParallelNode(node, allNodes, allEdges, context, nodeResults, workflowId) {
  const outgoingEdges = allEdges.filter((e) => e.source === node.id);
  const promises = outgoingEdges.map(async (edge) => {
    const targetNode = allNodes.find((n) => n.id === edge.target);
    if (!targetNode) return null;
    const result = await executeNode(
      targetNode,
      allNodes,
      allEdges,
      context,
      nodeResults,
      workflowId
    );
    return result.output;
  });
  const results = await Promise.all(promises);
  return results.filter((r) => r !== null);
}
async function cancelWorkflowExecution(executionId) {
  await _chunkH7VBPMCNjs.prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      status: "CANCELLED",
      completedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function getWorkflowExecutionStatus(executionId) {
  return _chunkH7VBPMCNjs.prisma.workflowExecution.findUnique({
    where: { id: executionId }
  });
}
async function getWorkflowExecutions(workflowId, options) {
  return _chunkH7VBPMCNjs.prisma.workflowExecution.findMany({
    where: _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      workflowId
    }, (options == null ? void 0 : options.status) && { status: options.status }),
    orderBy: { startedAt: "desc" },
    take: (options == null ? void 0 : options.limit) || 50
  });
}
async function triggerWorkflowManually(workflowId, data, userId) {
  return executeWorkflow(workflowId, {
    triggeredBy: "manual",
    userId,
    eventData: data
  });
}
async function triggerWorkflowByWebhook(workflowSlug, payload) {
  const workflow = await _chunkH7VBPMCNjs.prisma.workflow.findUnique({
    where: { slug: workflowSlug }
  });
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowSlug}`);
  }
  if (workflow.triggerType !== "WEBHOOK") {
    throw new Error(`Workflow ${workflowSlug} is not configured for webhook triggers`);
  }
  return executeWorkflow(workflow.id, {
    triggeredBy: "webhook",
    eventData: payload
  });
}
async function getScheduledWorkflows() {
  return _chunkH7VBPMCNjs.prisma.workflow.findMany({
    where: {
      enabled: true,
      triggerType: "SCHEDULE"
    }
  });
}
function shouldRunScheduledWorkflow(workflow, now = /* @__PURE__ */ new Date()) {
  const config = workflow.triggerConfig;
  if (!(config == null ? void 0 : config.cron)) return false;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = config.cron.split(" ");
  const matches = (pattern, value) => {
    if (pattern === "*") return true;
    if (pattern.includes(",")) {
      return pattern.split(",").some((p) => matches(p, value));
    }
    if (pattern.includes("-")) {
      const [start, end] = pattern.split("-").map(Number);
      return value >= start && value <= end;
    }
    if (pattern.includes("/")) {
      const [, step] = pattern.split("/").map(Number);
      return value % step === 0;
    }
    return parseInt(pattern, 10) === value;
  };
  return matches(minute, now.getMinutes()) && matches(hour, now.getHours()) && matches(dayOfMonth, now.getDate()) && matches(month, now.getMonth() + 1) && matches(dayOfWeek, now.getDay());
}





































exports.createWorkflowContext = createWorkflowContext; exports.resolveValue = resolveValue; exports.resolveInputMapping = resolveInputMapping; exports.resolveNodeInputs = resolveNodeInputs; exports.resolveTemplate = resolveTemplate; exports.evaluateExpression = evaluateExpression; exports.evaluateCondition = evaluateCondition; exports.setNodeOutput = setNodeOutput; exports.setVariable = setVariable; exports.addError = addError; exports.createIterationContext = createIterationContext; exports.serializeContext = serializeContext; exports.deserializeContext = deserializeContext; exports.getContextSummary = getContextSummary; exports.cloneContext = cloneContext; exports.clearPrimitiveCache = clearPrimitiveCache; exports.getPrimitive = getPrimitive; exports.getPrimitiveByName = getPrimitiveByName; exports.getPrimitivesByCategory = getPrimitivesByCategory; exports.getAllPrimitives = getAllPrimitives; exports.validatePrimitiveInput = validatePrimitiveInput; exports.executePrimitiveByName = executePrimitiveByName; exports.getPrimitiveExecutionHistory = getPrimitiveExecutionHistory; exports.getPrimitiveCategories = getPrimitiveCategories; exports.isPrimitiveAvailable = isPrimitiveAvailable; exports.getPrimitiveInputSchema = getPrimitiveInputSchema; exports.executeWorkflow = executeWorkflow; exports.executeWorkflowInstance = executeWorkflowInstance; exports.cancelWorkflowExecution = cancelWorkflowExecution; exports.getWorkflowExecutionStatus = getWorkflowExecutionStatus; exports.getWorkflowExecutions = getWorkflowExecutions; exports.triggerWorkflowManually = triggerWorkflowManually; exports.triggerWorkflowByWebhook = triggerWorkflowByWebhook; exports.getScheduledWorkflows = getScheduledWorkflows; exports.shouldRunScheduledWorkflow = shouldRunScheduledWorkflow;
//# sourceMappingURL=chunk-I4IEN4KN.js.map