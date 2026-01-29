/**
 * MCP Auth Utilities
 *
 * Provides API key generation, hashing, and validation for MCP clients.
 * Keys use the format: cms_<32 base64url chars>
 */
/**
 * Key prefix for CMS MCP API keys
 */
declare const API_KEY_PREFIX = "cms_";
/**
 * Generate a new API key
 * Format: cms_<32 random base64url characters>
 *
 * @returns Object with raw key (show once) and hash (store in DB)
 */
declare function generateApiKey(): {
    key: string;
    hash: string;
    prefix: string;
};
/**
 * Hash an API key for storage/comparison
 * Uses SHA-256 for fast, secure hashing
 */
declare function hashApiKey(key: string): string;
/**
 * Validate API key format
 */
declare function isValidApiKeyFormat(key: string): boolean;
/**
 * Extract key from Authorization header
 * Supports: "Bearer cms_xxx" or just "cms_xxx"
 */
declare function extractApiKey(authHeader: string | null): string | null;

/**
 * MCP Request Context
 *
 * Provides request-scoped user context for MCP tools using AsyncLocalStorage.
 * This allows tools to access the authenticated user's ID without passing it
 * through every function call.
 */
/**
 * MCP-specific context including user info and permissions
 */
interface McpContext {
    /** Internal database user ID */
    userId: string;
    /** API key ID used for authentication */
    apiKeyId: string;
    /** Scopes granted to this API key */
    scopes: string[];
    /** User's email (for logging) */
    email?: string;
}
/**
 * Validate an MCP API key and return context
 *
 * Accepts keys in format: cms_<32 base64url chars>
 * Via headers: X-API-Key or Authorization: Bearer
 */
declare function validateMcpApiKey(apiKeyOrHeader: string | null): Promise<McpContext | null>;
/**
 * Run a function with MCP context
 *
 * Usage:
 * ```ts
 * await runWithMcpContext(context, async () => {
 *   // Tools can call getMcpContext() here
 * });
 * ```
 */
declare function runWithMcpContext<T>(context: McpContext, fn: () => T | Promise<T>): T | Promise<T>;
/**
 * Get the current MCP context
 *
 * @throws Error if called outside of MCP context
 */
declare function getMcpContext(): McpContext;
/**
 * Get the current MCP context (nullable version)
 *
 * Returns null if called outside of MCP context
 */
declare function getMcpContextOrNull(): McpContext | null;
/**
 * Get the current user ID from MCP context
 *
 * @throws Error if called outside of MCP context
 */
declare function getMcpUserId(): string;
/**
 * Check if the current MCP context has a specific scope
 */
declare function hasMcpScope(scope: string): boolean;
/**
 * Require a specific scope, throwing if not present
 *
 * @throws Error if scope not present
 */
declare function requireMcpScope(scope: string): void;

/**
 * MCP Utility Functions
 *
 * Token optimization and response helpers for MCP tools.
 */
/**
 * Compact JSON response - removes whitespace for ~30-40% token savings
 */
declare function compactJson(data: unknown): string;
/**
 * Truncate string to max length with ellipsis
 */
declare function truncate(str: string | null | undefined, maxLength: number): string | null;
/**
 * Pick only specified fields from an object
 */
declare function pickFields<T extends Record<string, unknown>>(obj: T, fields: string[]): Partial<T>;
/**
 * Standard MCP response wrapper - always compact
 */
declare function mcpResponse(data: unknown): {
    content: {
        type: "text";
        text: string;
    }[];
};
/**
 * Standard MCP error response
 */
declare function mcpError(message: string): {
    content: {
        type: "text";
        text: string;
    }[];
};
declare const DEFAULT_LIMIT = 20;
declare const MAX_LIMIT = 100;
/**
 * Normalize pagination parameters
 */
declare function normalizePagination(limit?: number, offset?: number): {
    limit: number;
    offset: number;
};

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

interface McpServerStatus {
    name: string;
    connected: boolean;
    toolCount: number;
    source: 'file' | 'database';
}
interface McpConfig {
    mcpServers: Record<string, unknown>;
}
/**
 * Load MCP configuration from file and database
 * Returns null if no MCP servers are configured
 */
declare function loadMcpConfig(): Promise<McpConfig | null>;
/**
 * Get status of all configured MCP servers
 */
declare function getMcpServerStatus(): Promise<McpServerStatus[]>;
/**
 * Get tools from all connected MCP servers
 * Returns an empty object if no MCP servers are connected
 */
declare function getMcpTools(): Promise<Record<string, unknown>>;
/**
 * Invalidate cache for a specific MCP server
 * Called when server config is updated or deleted
 */
declare function invalidateMcpServerCache(_serverName: string): Promise<void>;

export { API_KEY_PREFIX, DEFAULT_LIMIT, MAX_LIMIT, type McpConfig, type McpContext, type McpServerStatus, compactJson, extractApiKey, generateApiKey, getMcpContext, getMcpContextOrNull, getMcpServerStatus, getMcpTools, getMcpUserId, hasMcpScope, hashApiKey, invalidateMcpServerCache, isValidApiKeyFormat, loadMcpConfig, mcpError, mcpResponse, normalizePagination, pickFields, requireMcpScope, runWithMcpContext, truncate, validateMcpApiKey };
