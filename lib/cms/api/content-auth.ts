/**
 * Content API Authentication Middleware
 *
 * Provides API key authentication for the public content delivery API.
 * Used by external client projects to fetch CMS content.
 *
 * Supports three auth modes:
 * 1. API key via Authorization header (Bearer cms_xxx)
 * 2. API key via x-api-key header
 * 3. Public access (if route allows it)
 *
 * Always requires subdomain context (via x-subdomain header from middleware).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma, runWithTenant } from '@/lib/cms/db'
import {
  extractApiKey,
  hashApiKey,
  isValidApiKeyFormat,
} from '@/lib/cms/mcp/auth'
import { scopeGrantsPermission } from '@/lib/cms/mcp/scopes'
import {
  resolveCmsTenantContext,
  tenantRequiredResponse,
  type CmsTenantContext,
} from '@/lib/cms/tenant-context'

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

export interface ContentApiKey {
  id: string
  userId: string
  scopes: string[]
  rateLimitTier: string
}

export interface ContentAuthContext {
  tenant: CmsTenantContext
  apiKey: ContentApiKey | null
}

// ---------------------------------------------------------------------------
//  CORS helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, x-api-key, x-subdomain, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

/**
 * Attach CORS headers to a NextResponse.
 */
export function withCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

/**
 * Standard OPTIONS handler for CORS preflight.
 */
export function corsPreflightResponse(): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }))
}

// ---------------------------------------------------------------------------
//  API key validation
// ---------------------------------------------------------------------------

/**
 * Validate and resolve an API key from the request headers.
 * Returns the validated key info or null if no key provided.
 * Throws a NextResponse if the key is invalid/expired/revoked.
 */
async function resolveApiKey(
  request: NextRequest
): Promise<{ key: ContentApiKey | null; error?: NextResponse }> {
  // Try to extract key from headers
  const authHeader = request.headers.get('authorization')
  const xApiKeyHeader = request.headers.get('x-api-key')

  const rawKey = extractApiKey(authHeader) || xApiKeyHeader

  // No key provided - public access
  if (!rawKey) {
    return { key: null }
  }

  // Validate format
  if (!isValidApiKeyFormat(rawKey)) {
    return {
      key: null,
      error: withCors(
        NextResponse.json(
          { error: 'Invalid API key format' },
          { status: 401 }
        )
      ),
    }
  }

  // Hash and look up
  const keyHash = hashApiKey(rawKey)

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      userId: true,
      scopes: true,
      rateLimitTier: true,
      expiresAt: true,
      revokedAt: true,
    },
  })

  if (!apiKey) {
    return {
      key: null,
      error: withCors(
        NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      ),
    }
  }

  // Check revocation
  if (apiKey.revokedAt) {
    return {
      key: null,
      error: withCors(
        NextResponse.json(
          { error: 'API key has been revoked' },
          { status: 401 }
        )
      ),
    }
  }

  // Check expiry
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return {
      key: null,
      error: withCors(
        NextResponse.json(
          { error: 'API key has expired' },
          { status: 401 }
        )
      ),
    }
  }

  // Update lastUsedAt (fire-and-forget, don't block the response)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Silently ignore - non-critical update
    })

  return {
    key: {
      id: apiKey.id,
      userId: apiKey.userId,
      scopes: apiKey.scopes,
      rateLimitTier: apiKey.rateLimitTier,
    },
  }
}

// ---------------------------------------------------------------------------
//  Scope checking
// ---------------------------------------------------------------------------

/**
 * Check if the API key (or public access) grants a required scope.
 * For public access (no key), only explicitly public routes should pass null.
 */
export function hasScope(
  apiKey: ContentApiKey | null,
  requiredScope: string
): boolean {
  if (!apiKey) return false
  return scopeGrantsPermission(apiKey.scopes, requiredScope)
}

/**
 * Check if the API key has read access for content.
 * Accepts: read, content:read, pages:read, or * (wildcard).
 */
export function hasReadAccess(apiKey: ContentApiKey | null): boolean {
  if (!apiKey) return false
  return (
    scopeGrantsPermission(apiKey.scopes, 'read') ||
    scopeGrantsPermission(apiKey.scopes, 'content:read') ||
    scopeGrantsPermission(apiKey.scopes, 'pages:read')
  )
}

/**
 * Check if the API key has write access for content.
 * Accepts: write, content:write, pages:write, or * (wildcard).
 */
export function hasWriteAccess(apiKey: ContentApiKey | null): boolean {
  if (!apiKey) return false
  return (
    scopeGrantsPermission(apiKey.scopes, 'write') ||
    scopeGrantsPermission(apiKey.scopes, 'content:write') ||
    scopeGrantsPermission(apiKey.scopes, 'pages:write')
  )
}

/**
 * Check if the API key has admin scope.
 */
export function hasAdminAccess(apiKey: ContentApiKey | null): boolean {
  if (!apiKey) return false
  return scopeGrantsPermission(apiKey.scopes, '*')
}

// ---------------------------------------------------------------------------
//  Middleware wrapper
// ---------------------------------------------------------------------------

/**
 * Wrap a content API route handler with tenant resolution and optional API key auth.
 *
 * - Always resolves tenant context (returns 400 if missing)
 * - Optionally validates API key if one is provided
 * - Runs handler within runWithTenant() so Prisma queries are auto-scoped
 * - Attaches CORS headers to all responses
 *
 * Usage:
 * ```ts
 * export const GET = withContentAuth(async (request, context) => {
 *   // context.tenant: CmsTenantContext
 *   // context.apiKey: ContentApiKey | null
 *   const pages = await prisma.page.findMany()
 *   return NextResponse.json({ pages })
 * })
 * ```
 */
export function withContentAuth(
  handler: (
    request: NextRequest,
    context: ContentAuthContext,
    routeContext?: any
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, routeContext?: any): Promise<NextResponse> => {
    // Resolve tenant context
    const tenant = await resolveCmsTenantContext(request)
    if (!tenant) {
      return withCors(tenantRequiredResponse())
    }

    // Resolve API key (if provided)
    const { key: apiKey, error: authError } = await resolveApiKey(request)
    if (authError) {
      return authError // Already has CORS headers
    }

    // Run handler within tenant context
    const authContext: ContentAuthContext = { tenant, apiKey }

    return runWithTenant(tenant.tenantId, async () => {
      const response = await handler(request, authContext, routeContext)
      return withCors(response)
    })
  }
}

/**
 * Wrap a content API route handler that REQUIRES a valid API key.
 *
 * Same as withContentAuth but returns 401 if no API key is provided.
 */
export function withContentAuthRequired(
  handler: (
    request: NextRequest,
    context: ContentAuthContext,
    routeContext?: any
  ) => Promise<NextResponse>
) {
  return withContentAuth(async (request, context, routeContext) => {
    if (!context.apiKey) {
      return NextResponse.json(
        { error: 'API key required. Provide via Authorization: Bearer cms_xxx or x-api-key header.' },
        { status: 401 }
      )
    }
    return handler(request, context, routeContext)
  })
}
