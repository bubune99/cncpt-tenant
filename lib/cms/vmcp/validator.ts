/**
 * VMCP Code Validator
 *
 * Static analysis of handler code strings before execution.
 * Blocks access to dangerous globals, network APIs, and prototype manipulation.
 */

const BLOCKED_GLOBALS = [
  'process',
  'require',
  'import',
  'eval',
  'Function',
  '__dirname',
  '__filename',
  'global',
  'globalThis',
];

const BLOCKED_PATTERNS = [
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'child_process',
  'fs.',
  'net.',
  'http.',
  'https.',
];

const BLOCKED_ACCESS = [
  'constructor.constructor',
  '__proto__',
  'prototype',
];

/**
 * Validate handler code for dangerous patterns before execution.
 */
export function validateHandler(code: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const blocked of BLOCKED_GLOBALS) {
    // Match the global as a standalone word (not part of another identifier)
    const regex = new RegExp(`\\b${escapeRegExp(blocked)}\\b`);
    if (regex.test(code)) {
      violations.push(`Blocked global: "${blocked}"`);
    }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (code.includes(pattern)) {
      violations.push(`Blocked pattern: "${pattern}"`);
    }
  }

  for (const access of BLOCKED_ACCESS) {
    if (code.includes(access)) {
      violations.push(`Blocked access: "${access}"`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
