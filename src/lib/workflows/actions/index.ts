/**
 * Built-in Workflow Actions
 *
 * Pre-built actions that can be used in workflows without creating primitives.
 * These handle common operations like HTTP requests, data transformation,
 * notifications, and integrations.
 */

import type { ActionDefinition, WorkflowContext } from '../types';

// =============================================================================
// ACTION REGISTRY
// =============================================================================

const actionRegistry = new Map<string, ActionDefinition>();

/**
 * Register an action
 */
export function registerAction(action: ActionDefinition): void {
  actionRegistry.set(action.name, action);
}

/**
 * Get an action by name
 */
export function getAction(name: string): ActionDefinition | undefined {
  return actionRegistry.get(name);
}

/**
 * Get all registered actions
 */
export function getAllActions(): ActionDefinition[] {
  return Array.from(actionRegistry.values());
}

/**
 * Get actions by category
 */
export function getActionsByCategory(category: string): ActionDefinition[] {
  return getAllActions().filter((a) => a.category === category);
}

/**
 * Execute a built-in action
 */
export async function executeAction(
  name: string,
  input: Record<string, unknown>,
  context: WorkflowContext
): Promise<unknown> {
  const action = getAction(name);
  if (!action) {
    throw new Error(`Action not found: ${name}`);
  }

  return action.handler(input, context);
}

// =============================================================================
// HTTP ACTIONS
// =============================================================================

registerAction({
  name: 'http.request',
  description: 'Make an HTTP request',
  category: 'http',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Request URL' },
      method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
      headers: { type: 'object', description: 'Request headers' },
      body: { description: 'Request body' },
      timeout: { type: 'number', description: 'Timeout in ms' },
    },
    required: ['url'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { url, method = 'GET', headers = {}, body, timeout = 30000 } = input;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout as number);

    try {
      const response = await fetch(url as string, {
        method: method as string,
        headers: headers as HeadersInit,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data: unknown;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        ok: response.ok,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },
});

registerAction({
  name: 'http.webhook',
  description: 'Send a webhook notification',
  category: 'http',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Webhook URL' },
      payload: { type: 'object', description: 'Webhook payload' },
      secret: { type: 'string', description: 'Webhook secret for signing' },
    },
    required: ['url', 'payload'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { url, payload, secret } = input;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add signature if secret provided
    if (secret) {
      const crypto = await import('crypto');
      const signature = crypto
        .createHmac('sha256', secret as string)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(url as string, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return {
      status: response.status,
      success: response.ok,
    };
  },
});

// =============================================================================
// DATA TRANSFORMATION ACTIONS
// =============================================================================

registerAction({
  name: 'data.transform',
  description: 'Transform data using a mapping',
  category: 'data',
  inputSchema: {
    type: 'object',
    properties: {
      input: { description: 'Input data to transform' },
      mapping: { type: 'object', description: 'Field mapping' },
    },
    required: ['input', 'mapping'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { input: data, mapping } = input;

    if (!data || typeof data !== 'object') {
      return data;
    }

    const dataObj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [targetKey, sourceKey] of Object.entries(mapping as Record<string, string>)) {
      const value = sourceKey.split('.').reduce((obj: unknown, key) => {
        if (obj && typeof obj === 'object') {
          return (obj as Record<string, unknown>)[key];
        }
        return undefined;
      }, dataObj);

      result[targetKey] = value;
    }

    return result;
  },
});

registerAction({
  name: 'data.filter',
  description: 'Filter array data',
  category: 'data',
  inputSchema: {
    type: 'object',
    properties: {
      array: { type: 'array', description: 'Array to filter' },
      field: { type: 'string', description: 'Field to check' },
      operator: { type: 'string', enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains'] },
      value: { description: 'Value to compare' },
    },
    required: ['array', 'field', 'operator', 'value'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { array, field, operator, value } = input;

    if (!Array.isArray(array)) {
      return [];
    }

    return array.filter((item) => {
      const fieldValue = (item as Record<string, unknown>)[field as string];

      switch (operator) {
        case 'eq':
          return fieldValue === value;
        case 'neq':
          return fieldValue !== value;
        case 'gt':
          return typeof fieldValue === 'number' && fieldValue > (value as number);
        case 'gte':
          return typeof fieldValue === 'number' && fieldValue >= (value as number);
        case 'lt':
          return typeof fieldValue === 'number' && fieldValue < (value as number);
        case 'lte':
          return typeof fieldValue === 'number' && fieldValue <= (value as number);
        case 'contains':
          return typeof fieldValue === 'string' && fieldValue.includes(value as string);
        default:
          return true;
      }
    });
  },
});

registerAction({
  name: 'data.map',
  description: 'Map array data to new structure',
  category: 'data',
  inputSchema: {
    type: 'object',
    properties: {
      array: { type: 'array', description: 'Array to map' },
      mapping: { type: 'object', description: 'Field mapping for each item' },
    },
    required: ['array', 'mapping'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { array, mapping } = input;

    if (!Array.isArray(array)) {
      return [];
    }

    return array.map((item) => {
      const result: Record<string, unknown> = {};
      const itemObj = item as Record<string, unknown>;

      for (const [targetKey, sourceKey] of Object.entries(mapping as Record<string, string>)) {
        result[targetKey] = itemObj[sourceKey];
      }

      return result;
    });
  },
});

registerAction({
  name: 'data.aggregate',
  description: 'Aggregate array data',
  category: 'data',
  inputSchema: {
    type: 'object',
    properties: {
      array: { type: 'array', description: 'Array to aggregate' },
      operation: { type: 'string', enum: ['sum', 'avg', 'min', 'max', 'count'] },
      field: { type: 'string', description: 'Field to aggregate (for sum, avg, min, max)' },
    },
    required: ['array', 'operation'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { array, operation, field } = input;

    if (!Array.isArray(array)) {
      return null;
    }

    const values = field
      ? array.map((item) => (item as Record<string, unknown>)[field as string]).filter((v): v is number => typeof v === 'number')
      : array.filter((v): v is number => typeof v === 'number');

    switch (operation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'min':
        return values.length > 0 ? Math.min(...values) : null;
      case 'max':
        return values.length > 0 ? Math.max(...values) : null;
      case 'count':
        return array.length;
      default:
        return null;
    }
  },
});

// =============================================================================
// LOGIC ACTIONS
// =============================================================================

registerAction({
  name: 'logic.switch',
  description: 'Switch/case logic',
  category: 'logic',
  inputSchema: {
    type: 'object',
    properties: {
      value: { description: 'Value to switch on' },
      cases: { type: 'object', description: 'Case mappings (value -> result)' },
      default: { description: 'Default result if no case matches' },
    },
    required: ['value', 'cases'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { value, cases, default: defaultValue } = input;
    const casesObj = cases as Record<string, unknown>;

    const key = String(value);
    if (key in casesObj) {
      return casesObj[key];
    }

    return defaultValue;
  },
});

registerAction({
  name: 'logic.coalesce',
  description: 'Return first non-null value',
  category: 'logic',
  inputSchema: {
    type: 'object',
    properties: {
      values: { type: 'array', description: 'Array of values to check' },
    },
    required: ['values'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { values } = input;

    if (!Array.isArray(values)) {
      return null;
    }

    return values.find((v) => v !== null && v !== undefined) ?? null;
  },
});

// =============================================================================
// STRING ACTIONS
// =============================================================================

registerAction({
  name: 'string.template',
  description: 'Render a string template',
  category: 'string',
  inputSchema: {
    type: 'object',
    properties: {
      template: { type: 'string', description: 'Template string with {{placeholders}}' },
      data: { type: 'object', description: 'Data for placeholders' },
    },
    required: ['template', 'data'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { template, data } = input;
    const dataObj = data as Record<string, unknown>;

    return (template as string).replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const value = dataObj[key.trim()];
      return value !== undefined && value !== null ? String(value) : '';
    });
  },
});

registerAction({
  name: 'string.format',
  description: 'Format values (number, date, currency)',
  category: 'string',
  inputSchema: {
    type: 'object',
    properties: {
      value: { description: 'Value to format' },
      type: { type: 'string', enum: ['number', 'date', 'currency', 'percent'] },
      locale: { type: 'string', description: 'Locale for formatting' },
      options: { type: 'object', description: 'Format options' },
    },
    required: ['value', 'type'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { value, type, locale = 'en-US', options = {} } = input;

    switch (type) {
      case 'number':
        return new Intl.NumberFormat(locale as string, options as Intl.NumberFormatOptions).format(value as number);
      case 'date':
        return new Intl.DateTimeFormat(locale as string, options as Intl.DateTimeFormatOptions).format(new Date(value as string));
      case 'currency':
        return new Intl.NumberFormat(locale as string, {
          style: 'currency',
          currency: 'USD',
          ...(options as Intl.NumberFormatOptions),
        }).format(value as number);
      case 'percent':
        return new Intl.NumberFormat(locale as string, {
          style: 'percent',
          ...(options as Intl.NumberFormatOptions),
        }).format(value as number);
      default:
        return String(value);
    }
  },
});

// =============================================================================
// VARIABLE ACTIONS
// =============================================================================

registerAction({
  name: 'variable.set',
  description: 'Set a workflow variable',
  category: 'variable',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Variable name' },
      value: { description: 'Variable value' },
    },
    required: ['name', 'value'],
  },
  handler: async (input: Record<string, unknown>, context: WorkflowContext) => {
    const { name, value } = input;
    context.variables[name as string] = value;
    return value;
  },
});

registerAction({
  name: 'variable.get',
  description: 'Get a workflow variable',
  category: 'variable',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Variable name' },
      default: { description: 'Default value if not found' },
    },
    required: ['name'],
  },
  handler: async (input: Record<string, unknown>, context: WorkflowContext) => {
    const { name, default: defaultValue } = input;
    return context.variables[name as string] ?? defaultValue;
  },
});

// =============================================================================
// UTILITY ACTIONS
// =============================================================================

registerAction({
  name: 'util.log',
  description: 'Log a message (for debugging)',
  category: 'utility',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Log message' },
      data: { description: 'Additional data to log' },
      level: { type: 'string', enum: ['info', 'warn', 'error', 'debug'] },
    },
    required: ['message'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { message, data, level = 'info' } = input;

    const logFn = console[level as 'info' | 'warn' | 'error' | 'debug'] || console.log;
    logFn(`[Workflow] ${message}`, data || '');

    return { logged: true, message, level };
  },
});

registerAction({
  name: 'util.wait',
  description: 'Wait for a specified duration',
  category: 'utility',
  inputSchema: {
    type: 'object',
    properties: {
      duration: { type: 'number', description: 'Duration in milliseconds' },
    },
    required: ['duration'],
  },
  handler: async (input: Record<string, unknown>) => {
    const { duration } = input;
    await new Promise((resolve) => setTimeout(resolve, duration as number));
    return { waited: duration };
  },
});

registerAction({
  name: 'util.timestamp',
  description: 'Get current timestamp',
  category: 'utility',
  inputSchema: {
    type: 'object',
    properties: {
      format: { type: 'string', enum: ['iso', 'unix', 'date'] },
    },
  },
  handler: async (input: Record<string, unknown>) => {
    const { format = 'iso' } = input;
    const now = new Date();

    switch (format) {
      case 'unix':
        return Math.floor(now.getTime() / 1000);
      case 'date':
        return now.toDateString();
      default:
        return now.toISOString();
    }
  },
});

registerAction({
  name: 'util.uuid',
  description: 'Generate a UUID',
  category: 'utility',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    const { v4: uuidv4 } = await import('uuid');
    return uuidv4();
  },
});

// =============================================================================
// EXPORT ACTION CATEGORIES
// =============================================================================

export const actionCategories = [
  { id: 'http', label: 'HTTP', icon: 'Globe' },
  { id: 'data', label: 'Data', icon: 'Database' },
  { id: 'logic', label: 'Logic', icon: 'GitBranch' },
  { id: 'string', label: 'String', icon: 'Type' },
  { id: 'variable', label: 'Variables', icon: 'Variable' },
  { id: 'utility', label: 'Utility', icon: 'Wrench' },
];
