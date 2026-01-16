/**
 * MCP (Model Context Protocol) Server Utilities
 *
 * This module provides utilities for building MCP servers that expose
 * CMS functionality to AI agents (Claude Code, Cursor, Windsurf, etc.)
 *
 * Key exports:
 * - Auth: API key generation and validation
 * - Context: Request-scoped user context via AsyncLocalStorage
 * - Utils: Response formatting and token optimization helpers
 */

// Auth utilities
export {
  API_KEY_PREFIX,
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  extractApiKey
} from "./auth"

// Context utilities
export {
  type McpContext,
  validateMcpApiKey,
  runWithMcpContext,
  getMcpContext,
  getMcpContextOrNull,
  getMcpUserId,
  hasMcpScope,
  requireMcpScope
} from "./context"

// Response utilities
export {
  compactJson,
  truncate,
  pickFields,
  mcpResponse,
  mcpError,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  normalizePagination
} from "./utils"

// Stub implementations for MCP server management
// These functions provide safe defaults until full MCP integration is implemented

export interface McpServerStatus {
  name: string;
  connected: boolean;
  toolCount: number;
  source: 'file' | 'database';
}

export interface McpConfig {
  mcpServers: Record<string, unknown>;
}

/**
 * Load MCP configuration from file and database
 * Returns null if no MCP servers are configured
 */
export async function loadMcpConfig(): Promise<McpConfig | null> {
  // TODO: Implement MCP config loading from .mcp.json and database
  return null;
}

/**
 * Get status of all configured MCP servers
 */
export async function getMcpServerStatus(): Promise<McpServerStatus[]> {
  // TODO: Implement MCP server status checking
  return [];
}

/**
 * Get tools from all connected MCP servers
 * Returns an empty object if no MCP servers are connected
 */
export async function getMcpTools(): Promise<Record<string, unknown>> {
  // TODO: Implement MCP tool fetching
  return {};
}

/**
 * Invalidate cache for a specific MCP server
 * Called when server config is updated or deleted
 */
export async function invalidateMcpServerCache(_serverName: string): Promise<void> {
  // TODO: Implement cache invalidation
  return;
}
