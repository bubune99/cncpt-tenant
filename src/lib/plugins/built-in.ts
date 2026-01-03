/**
 * Built-in Primitives
 *
 * System primitives that come pre-installed with the CMS.
 * These provide essential functionality and serve as examples.
 */

import { prisma } from '@/lib/db';
import type { CreatePrimitiveRequest, JSONSchema } from './types';
import { getPluginRegistry } from './registry';
import { DOMAIN_PRIMITIVES } from './primitives';

/**
 * Core utility primitives (data, text, math, logic, datetime)
 */
const CORE_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // DATA PRIMITIVES
  // ============================================================================
  {
    name: 'transform_json',
    description: 'Transform JSON data using a JavaScript expression. Useful for mapping, filtering, and reshaping data.',
    category: 'data',
    tags: ['data', 'transform', 'json'],
    icon: 'Braces',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'The input data to transform',
        },
        expression: {
          type: 'string',
          description: 'JavaScript expression to transform the data. Use `data` to reference input.',
        },
      },
      required: ['data', 'expression'],
    },
    handler: `
      // Transform JSON data using expression
      const result = eval(args.expression);
      return result;
    `,
  },
  {
    name: 'validate_data',
    description: 'Validate data against a JSON Schema and return validation results.',
    category: 'data',
    tags: ['data', 'validation', 'schema'],
    icon: 'CheckCircle',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'The data to validate',
        },
        schema: {
          type: 'object',
          description: 'JSON Schema to validate against',
        },
      },
      required: ['data', 'schema'],
    },
    handler: `
      const errors = [];
      const schema = args.schema;
      const data = args.data;

      // Check required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in data)) {
            errors.push({ field, message: 'Required field missing' });
          }
        }
      }

      // Check types
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          if (key in data) {
            const value = data[key];
            const expectedType = prop.type;
            const actualType = Array.isArray(value) ? 'array' : typeof value;

            if (expectedType !== actualType && !(expectedType === 'null' && value === null)) {
              errors.push({ field: key, message: 'Type mismatch: expected ' + expectedType + ', got ' + actualType });
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        data: errors.length === 0 ? data : undefined
      };
    `,
  },

  // ============================================================================
  // TEXT PRIMITIVES
  // ============================================================================
  {
    name: 'format_text',
    description: 'Format text using template literals. Supports variable interpolation.',
    category: 'text',
    tags: ['text', 'template', 'format'],
    icon: 'FileText',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          description: 'Template string with {{variable}} placeholders',
        },
        variables: {
          type: 'object',
          description: 'Variables to interpolate into the template',
        },
      },
      required: ['template', 'variables'],
    },
    handler: `
      let result = args.template;
      for (const [key, value] of Object.entries(args.variables)) {
        result = result.replace(new RegExp('{{' + key + '}}', 'g'), String(value));
      }
      return result;
    `,
  },
  {
    name: 'parse_csv',
    description: 'Parse CSV text into an array of objects.',
    category: 'text',
    tags: ['text', 'csv', 'parse'],
    icon: 'Table',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        csv: {
          type: 'string',
          description: 'CSV text to parse',
        },
        delimiter: {
          type: 'string',
          description: 'Column delimiter (default: comma)',
          default: ',',
        },
        hasHeader: {
          type: 'boolean',
          description: 'First row is header (default: true)',
          default: true,
        },
      },
      required: ['csv'],
    },
    handler: `
      const delimiter = args.delimiter || ',';
      const hasHeader = args.hasHeader !== false;
      const lines = args.csv.trim().split('\\n');

      if (lines.length === 0) return [];

      const headers = hasHeader
        ? lines[0].split(delimiter).map(h => h.trim())
        : lines[0].split(delimiter).map((_, i) => 'column' + i);

      const dataLines = hasHeader ? lines.slice(1) : lines;

      return dataLines.map(line => {
        const values = line.split(delimiter);
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i]?.trim() || '';
        });
        return obj;
      });
    `,
  },

  // ============================================================================
  // MATH PRIMITIVES
  // ============================================================================
  {
    name: 'calculate',
    description: 'Evaluate a mathematical expression safely.',
    category: 'math',
    tags: ['math', 'calculate', 'expression'],
    icon: 'Calculator',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate (e.g., "2 + 2 * 3")',
        },
        variables: {
          type: 'object',
          description: 'Variables to use in the expression',
        },
      },
      required: ['expression'],
    },
    handler: `
      // Safe math evaluation - only allows numbers and math operators
      let expr = args.expression;

      // Replace variables
      if (args.variables) {
        for (const [key, value] of Object.entries(args.variables)) {
          expr = expr.replace(new RegExp('\\\\b' + key + '\\\\b', 'g'), String(value));
        }
      }

      // Validate expression contains only safe characters
      if (!/^[\\d\\s+\\-*/().]+$/.test(expr)) {
        throw new Error('Invalid expression: only numbers and math operators allowed');
      }

      return eval(expr);
    `,
  },
  {
    name: 'aggregate',
    description: 'Aggregate an array of numbers (sum, avg, min, max, count).',
    category: 'math',
    tags: ['math', 'aggregate', 'statistics'],
    icon: 'BarChart',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        values: {
          type: 'array',
          description: 'Array of numbers to aggregate',
        },
        operations: {
          type: 'array',
          description: 'Operations to perform: sum, avg, min, max, count',
          default: ['sum', 'avg', 'min', 'max', 'count'],
        },
      },
      required: ['values'],
    },
    handler: `
      const nums = args.values.filter(v => typeof v === 'number');
      const ops = args.operations || ['sum', 'avg', 'min', 'max', 'count'];
      const result = {};

      if (ops.includes('sum')) result.sum = nums.reduce((a, b) => a + b, 0);
      if (ops.includes('avg')) result.avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      if (ops.includes('min')) result.min = nums.length ? Math.min(...nums) : null;
      if (ops.includes('max')) result.max = nums.length ? Math.max(...nums) : null;
      if (ops.includes('count')) result.count = nums.length;

      return result;
    `,
  },

  // ============================================================================
  // LOGIC PRIMITIVES
  // ============================================================================
  {
    name: 'conditional',
    description: 'Evaluate a condition and return different values based on result.',
    category: 'logic',
    tags: ['logic', 'condition', 'if-else'],
    icon: 'GitBranch',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        condition: {
          type: 'string',
          description: 'JavaScript expression that evaluates to boolean',
        },
        context: {
          type: 'object',
          description: 'Variables available in the condition',
        },
        thenValue: {
          description: 'Value to return if condition is true',
        },
        elseValue: {
          description: 'Value to return if condition is false',
        },
      },
      required: ['condition'],
    },
    handler: `
      // Build context for eval
      const ctx = args.context || {};
      const contextKeys = Object.keys(ctx);
      const contextValues = Object.values(ctx);

      // Create function with context variables
      const evalFn = new Function(...contextKeys, 'return ' + args.condition);
      const result = evalFn(...contextValues);

      return result ? args.thenValue : args.elseValue;
    `,
  },
  {
    name: 'switch_case',
    description: 'Match a value against multiple cases and return the corresponding result.',
    category: 'logic',
    tags: ['logic', 'switch', 'match'],
    icon: 'Route',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        value: {
          description: 'Value to match against cases',
        },
        cases: {
          type: 'object',
          description: 'Object mapping case values to results',
        },
        default: {
          description: 'Default value if no case matches',
        },
      },
      required: ['value', 'cases'],
    },
    handler: `
      const value = String(args.value);
      if (value in args.cases) {
        return args.cases[value];
      }
      return args.default;
    `,
  },

  // ============================================================================
  // DATE/TIME PRIMITIVES
  // ============================================================================
  {
    name: 'format_date',
    description: 'Format a date using a format string.',
    category: 'datetime',
    tags: ['date', 'time', 'format'],
    icon: 'Calendar',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date string or timestamp to format',
        },
        format: {
          type: 'string',
          description: 'Format string (YYYY, MM, DD, HH, mm, ss)',
          default: 'YYYY-MM-DD',
        },
        timezone: {
          type: 'string',
          description: 'Timezone (e.g., "America/New_York")',
        },
      },
      required: ['date'],
    },
    handler: `
      const d = new Date(args.date);
      const format = args.format || 'YYYY-MM-DD';

      const pad = (n) => String(n).padStart(2, '0');

      return format
        .replace('YYYY', d.getFullYear())
        .replace('MM', pad(d.getMonth() + 1))
        .replace('DD', pad(d.getDate()))
        .replace('HH', pad(d.getHours()))
        .replace('mm', pad(d.getMinutes()))
        .replace('ss', pad(d.getSeconds()));
    `,
  },
  {
    name: 'date_diff',
    description: 'Calculate the difference between two dates.',
    category: 'datetime',
    tags: ['date', 'time', 'difference'],
    icon: 'Clock',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date',
        },
        endDate: {
          type: 'string',
          description: 'End date',
        },
        unit: {
          type: 'string',
          description: 'Unit: days, hours, minutes, seconds',
          enum: ['days', 'hours', 'minutes', 'seconds'],
          default: 'days',
        },
      },
      required: ['startDate', 'endDate'],
    },
    handler: `
      const start = new Date(args.startDate);
      const end = new Date(args.endDate);
      const diffMs = end - start;

      const unit = args.unit || 'days';
      const divisors = {
        days: 86400000,
        hours: 3600000,
        minutes: 60000,
        seconds: 1000,
      };

      return Math.floor(diffMs / divisors[unit]);
    `,
  },
];

/**
 * All built-in primitives (core utilities + domain-specific)
 */
const BUILT_IN_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  ...CORE_PRIMITIVES,
  ...DOMAIN_PRIMITIVES,
];

// Export for external use
export { BUILT_IN_PRIMITIVES, CORE_PRIMITIVES, DOMAIN_PRIMITIVES };

/**
 * Load built-in primitives into the database
 */
export async function loadBuiltInPrimitives(): Promise<{
  loaded: number;
  skipped: number;
  errors: string[];
}> {
  let loaded = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const primitive of BUILT_IN_PRIMITIVES) {
    try {
      // Check if already exists
      const existing = await prisma.primitive.findUnique({
        where: { name: primitive.name },
      });

      if (existing) {
        // Update if version changed
        if (existing.builtIn) {
          skipped++;
          continue;
        }
      }

      // Create or update
      await prisma.primitive.upsert({
        where: { name: primitive.name },
        create: {
          name: primitive.name,
          description: primitive.description,
          inputSchema: primitive.inputSchema as object,
          handler: primitive.handler,
          category: primitive.category,
          tags: primitive.tags || [],
          icon: primitive.icon,
          timeout: primitive.timeout || 30000,
          enabled: true,
          builtIn: true,
        },
        update: {
          description: primitive.description,
          inputSchema: primitive.inputSchema as object,
          handler: primitive.handler,
          category: primitive.category,
          tags: primitive.tags || [],
          icon: primitive.icon,
          timeout: primitive.timeout || 30000,
        },
      });

      loaded++;
    } catch (e) {
      errors.push(`Failed to load ${primitive.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Initialize registry after loading
  const registry = getPluginRegistry();
  await registry.initialize();

  return { loaded, skipped, errors };
}

/**
 * Get list of built-in primitive names
 */
export function getBuiltInPrimitiveNames(): string[] {
  return BUILT_IN_PRIMITIVES.map(p => p.name);
}
