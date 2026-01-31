/**
 * MCP Request Context
 *
 * Provides request-scoped user context for MCP tools using AsyncLocalStorage.
 * This allows tools to access the authenticated user's ID without passing it
 * through every function call.
 */

import { AsyncLocalStorage } from "async_hooks"
import { prisma } from "../db"
import { hashApiKey, extractApiKey, isValidApiKeyFormat } from "./auth"

/**
 * MCP-specific context including user info and permissions
 */
export interface McpContext {
  /** Internal database user ID */
  userId: string
  /** API key ID used for authentication */
  apiKeyId: string
  /** Scopes granted to this API key */
  scopes: string[]
  /** User's email (for logging) */
  email?: string
  /** Tenant ID for multi-tenant scoping (from subdomain) */
  tenantId?: number
  /** Subdomain string for reference */
  subdomain?: string
}

// AsyncLocalStorage for request-scoped context
const mcpContextStorage = new AsyncLocalStorage<McpContext>()

/**
 * Validate an MCP API key and return context
 *
 * Accepts keys in format: cms_<32 base64url chars>
 * Via headers: X-API-Key or Authorization: Bearer
 */
export async function validateMcpApiKey(
  apiKeyOrHeader: string | null
): Promise<McpContext | null> {
  const apiKey = extractApiKey(apiKeyOrHeader)

  if (!apiKey || !isValidApiKeyFormat(apiKey)) {
    return null
  }

  const keyHash = hashApiKey(apiKey)

  try {
    const keyRecord = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    if (!keyRecord) {
      return null
    }

    // Update last_used_at asynchronously (don't await)
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    }).catch((err) =>
      console.error("Failed to update MCP API key last_used_at:", err)
    )

    return {
      userId: keyRecord.userId,
      apiKeyId: keyRecord.id,
      scopes: keyRecord.scopes || ["read", "write"],
      email: keyRecord.user.email
    }
  } catch (error) {
    console.error("MCP API key validation error:", error)
    return null
  }
}

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
export function runWithMcpContext<T>(
  context: McpContext,
  fn: () => T | Promise<T>
): T | Promise<T> {
  return mcpContextStorage.run(context, fn)
}

/**
 * Get the current MCP context
 *
 * @throws Error if called outside of MCP context
 */
export function getMcpContext(): McpContext {
  const context = mcpContextStorage.getStore()
  if (!context) {
    throw new Error("MCP context not available - called outside of MCP request")
  }
  return context
}

/**
 * Get the current MCP context (nullable version)
 *
 * Returns null if called outside of MCP context
 */
export function getMcpContextOrNull(): McpContext | null {
  return mcpContextStorage.getStore() || null
}

/**
 * Get the current user ID from MCP context
 *
 * @throws Error if called outside of MCP context
 */
export function getMcpUserId(): string {
  return getMcpContext().userId
}

/**
 * Check if the current MCP context has a specific scope
 */
export function hasMcpScope(scope: string): boolean {
  const context = getMcpContextOrNull()
  if (!context) return false
  return context.scopes.includes(scope)
}

/**
 * Require a specific scope, throwing if not present
 *
 * @throws Error if scope not present
 */
export function requireMcpScope(scope: string): void {
  if (!hasMcpScope(scope)) {
    throw new Error(`MCP operation requires '${scope}' scope`)
  }
}

/**
 * Get the current tenant ID from MCP context
 *
 * @throws Error if called outside of MCP context or no tenantId set
 */
export function getMcpTenantId(): number {
  const context = getMcpContext()
  if (context.tenantId === undefined) {
    throw new Error("MCP context has no tenantId - subdomain not resolved")
  }
  return context.tenantId
}

/**
 * Get the current tenant ID from MCP context (nullable version)
 *
 * Returns undefined if called outside of MCP context or no tenantId set
 */
export function getMcpTenantIdOrNull(): number | undefined {
  const context = getMcpContextOrNull()
  return context?.tenantId
}

/**
 * Get the current subdomain from MCP context
 */
export function getMcpSubdomain(): string | undefined {
  return getMcpContextOrNull()?.subdomain
}

/**
 * Get the current API key ID from MCP context
 *
 * @throws Error if called outside of MCP context
 */
export function getMcpApiKeyId(): string {
  return getMcpContext().apiKeyId
}

/**
 * Get the scopes for the current MCP context
 *
 * @throws Error if called outside of MCP context
 */
export function getMcpScopes(): string[] {
  return getMcpContext().scopes
}
