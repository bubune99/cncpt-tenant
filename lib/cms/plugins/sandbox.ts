/**
 * Sandbox - Isolated Execution Environment for Primitive Handlers
 *
 * Provides a restricted execution environment for user-provided code.
 * Security measures:
 * - No access to Node.js built-ins (fs, path, child_process, etc.)
 * - No access to global objects (process, global, globalThis)
 * - Limited JavaScript APIs (JSON, Math, Date, String, Number, etc.)
 * - Timeout enforcement
 * - Output size limits
 */

import type { ExecutionContext } from './types';

/**
 * Sandbox Configuration
 */
export interface SandboxConfig {
  timeout: number;         // Max execution time in ms
  allowAsync: boolean;     // Allow async operations
  maxOutputSize: number;   // Max output size in bytes
}

/**
 * Sandbox Execution Result
 */
export interface SandboxResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
  outputSize?: number;
}

/**
 * Default sandbox configuration
 */
const DEFAULT_CONFIG: SandboxConfig = {
  timeout: 30000,
  allowAsync: true,
  maxOutputSize: 1024 * 1024,  // 1MB
};

/**
 * Allowed globals in sandbox - safe JavaScript APIs only
 */
const SANDBOX_GLOBALS: Record<string, unknown> = {
  // Core JavaScript
  Object,
  Array,
  String,
  Number,
  Boolean,
  Date,
  RegExp,
  Error,
  TypeError,
  RangeError,
  SyntaxError,

  // JSON operations
  JSON,

  // Math operations
  Math,

  // Data structures
  Map,
  Set,
  WeakMap,
  WeakSet,

  // Utilities
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  encodeURIComponent,
  decodeURIComponent,
  encodeURI,
  decodeURI,

  // Promises (if async allowed)
  Promise,

  // Console (captured, not actual logging)
  console: {
    log: (..._args: unknown[]) => {},
    warn: (..._args: unknown[]) => {},
    error: (..._args: unknown[]) => {},
    info: (..._args: unknown[]) => {},
  },

  // URL parsing
  URL,
  URLSearchParams,

  // Typed arrays
  Uint8Array,
  Int8Array,
  Uint16Array,
  Int16Array,
  Uint32Array,
  Int32Array,
  Float32Array,
  Float64Array,
  ArrayBuffer,
  DataView,

  // Text encoding
  TextEncoder,
  TextDecoder,

  // Explicit undefined values
  undefined,
  NaN,
  Infinity,
};

/**
 * Security patterns - blocked code patterns
 */
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /\bprocess\b/, message: 'Access to process object' },
  { pattern: /\brequire\s*\(/, message: 'CommonJS require' },
  { pattern: /\bimport\s*\(/, message: 'Dynamic import' },
  { pattern: /\bglobal\b/, message: 'Access to global object' },
  { pattern: /\bglobalThis\b/, message: 'Access to globalThis' },
  { pattern: /\beval\s*\(/, message: 'Use of eval()' },
  { pattern: /\bFunction\s*\(/, message: 'Function constructor' },
  { pattern: /\bchild_process\b/, message: 'child_process module' },
  { pattern: /\b__proto__\b/, message: 'Prototype manipulation' },
  { pattern: /\.constructor\s*\(/, message: 'Constructor access' },
  { pattern: /\bProxy\b/, message: 'Proxy object' },
  { pattern: /\bReflect\b/, message: 'Reflect object' },
  { pattern: /\bfetch\b/, message: 'fetch API (use HTTP primitive instead)' },
  { pattern: /\bXMLHttpRequest\b/, message: 'XMLHttpRequest (use HTTP primitive instead)' },
];

/**
 * Warning patterns - not blocked but flagged
 */
const WARNING_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /\bwhile\s*\(\s*true\s*\)/, message: 'Potential infinite loop' },
  { pattern: /\bfor\s*\(\s*;\s*;\s*\)/, message: 'Potential infinite loop' },
  { pattern: /\bsetTimeout\b/, message: 'Use of setTimeout' },
  { pattern: /\bsetInterval\b/, message: 'Use of setInterval' },
  { pattern: /\.prototype\b/, message: 'Prototype access' },
];

/**
 * Validate handler code for security issues
 */
export function validateHandlerSecurity(code: string): {
  safe: boolean;
  warnings: string[];
  blocked: string[];
} {
  const warnings: string[] = [];
  const blocked: string[] = [];

  // Check blocked patterns
  for (const { pattern, message } of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      blocked.push(message);
    }
  }

  // Check warning patterns
  for (const { pattern, message } of WARNING_PATTERNS) {
    if (pattern.test(code)) {
      warnings.push(message);
    }
  }

  return {
    safe: blocked.length === 0,
    warnings,
    blocked,
  };
}

/**
 * Create a sandbox function with restricted globals
 */
export function createSandboxFunction(
  code: string,
  config: Partial<SandboxConfig> = {}
): (args: unknown, context: ExecutionContext) => unknown {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { allowAsync: _allowAsync } = { ...DEFAULT_CONFIG, ...config };

  // Wrap code in strict mode
  const wrappedCode = `
    "use strict";
    ${code}
  `;

  // Get global names and values for shadowing
  const globalNames = Object.keys(SANDBOX_GLOBALS);
  const globalValues = Object.values(SANDBOX_GLOBALS);

  try {
    // Create the sandbox function with shadowed globals
    const sandboxFn = new Function(
      'args',
      'context',
      ...globalNames,
      // Add dummy parameters for blocked globals (shadowing)
      '__blocked_process__',
      '__blocked_require__',
      '__blocked_global__',
      '__blocked_globalThis__',
      '__blocked_eval__',
      '__blocked_Function__',
      // The actual code
      wrappedCode
    );

    // Return wrapped executor
    return (args: unknown, context: ExecutionContext) => {
      return sandboxFn(
        args,
        context,
        ...globalValues,
        // Pass undefined for blocked globals
        undefined,  // process
        undefined,  // require
        undefined,  // global
        undefined,  // globalThis
        undefined,  // eval
        undefined,  // Function
      );
    };
  } catch (e) {
    throw new Error(`Failed to compile handler: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Execute function with timeout
 */
async function executeWithTimeout<T>(
  fn: () => T | Promise<T>,
  timeout: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Execution timeout after ${timeout}ms`));
    }, timeout);

    try {
      const result = fn();

      if (result instanceof Promise) {
        result
          .then((value) => {
            clearTimeout(timeoutId);
            resolve(value);
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            reject(err);
          });
      } else {
        clearTimeout(timeoutId);
        resolve(result);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      reject(e);
    }
  });
}

/**
 * Get the size of output in bytes
 */
function getOutputSize(output: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(output)).length;
  } catch {
    return 0;
  }
}

/**
 * Execute code in sandbox with timeout
 */
export async function executeSandbox(
  code: string,
  args: unknown,
  context: ExecutionContext,
  config: Partial<SandboxConfig> = {}
): Promise<SandboxResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  try {
    // Validate security first
    const securityCheck = validateHandlerSecurity(code);
    if (!securityCheck.safe) {
      return {
        success: false,
        error: `Security validation failed: ${securityCheck.blocked.join(', ')}`,
        executionTime: Date.now() - startTime,
      };
    }

    // Create sandbox function
    const sandboxFn = createSandboxFunction(code, fullConfig);

    // Execute with timeout
    const result = await executeWithTimeout(
      () => sandboxFn(args, context),
      fullConfig.timeout
    );

    // Check output size
    const outputSize = getOutputSize(result);
    if (outputSize > fullConfig.maxOutputSize) {
      return {
        success: false,
        error: `Output too large: ${outputSize} bytes (max: ${fullConfig.maxOutputSize})`,
        executionTime: Date.now() - startTime,
        outputSize,
      };
    }

    return {
      success: true,
      result,
      executionTime: Date.now() - startTime,
      outputSize,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Handler cache for compiled functions
 */
const handlerCache = new Map<string, (args: unknown, context: ExecutionContext) => unknown>();

/**
 * Get or compile a handler function (cached)
 */
export function getOrCompileHandler(
  primitiveId: string,
  code: string,
  config: Partial<SandboxConfig> = {}
): (args: unknown, context: ExecutionContext) => unknown {
  const cacheKey = `${primitiveId}:${hashCode(code)}`;

  let handler = handlerCache.get(cacheKey);
  if (!handler) {
    handler = createSandboxFunction(code, config);
    handlerCache.set(cacheKey, handler);
  }

  return handler;
}

/**
 * Invalidate cached handler for a primitive
 */
export function invalidateHandler(primitiveId: string): void {
  for (const key of handlerCache.keys()) {
    if (key.startsWith(`${primitiveId}:`)) {
      handlerCache.delete(key);
    }
  }
}

/**
 * Clear all cached handlers
 */
export function clearHandlerCache(): void {
  handlerCache.clear();
}

/**
 * Simple hash function for cache keys
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
