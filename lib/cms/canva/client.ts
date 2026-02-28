/**
 * Canva Connect API Client
 *
 * Type-safe HTTP wrapper for Canva REST API v1.
 * No SDK available — uses raw fetch with proper auth headers.
 *
 * @see https://www.canva.dev/docs/connect/
 */

import { encrypt, decrypt } from "../encryption"
import { prisma } from "../db"
import type {
  CanvaConfig,
  CanvaTokenResponse,
  CanvaDesign,
  CanvaDesignListResponse,
  CanvaExportJob,
  CanvaExportFormat,
  CanvaUser,
  CanvaConnectionData,
} from "./types"
import { CANVA_SCOPES } from "./types"

const CANVA_API_BASE = "https://api.canva.com/rest/v1"
const CANVA_AUTH_URL = "https://www.canva.com/api/oauth/authorize"
const CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"

// =============================================================================
// CONFIG
// =============================================================================

export function getCanvaConfig(): CanvaConfig {
  const clientId = process.env.CANVA_CLIENT_ID
  const clientSecret = process.env.CANVA_CLIENT_SECRET
  const redirectUri =
    process.env.CANVA_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/canva/auth/callback`

  if (!clientId || !clientSecret) {
    throw new Error(
      "Canva integration not configured. Set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET."
    )
  }

  return { clientId, clientSecret, redirectUri }
}

// =============================================================================
// PKCE HELPERS
// =============================================================================

function base64urlEncode(input: Buffer | Uint8Array): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString("base64url")
}

export async function generatePKCE(): Promise<{
  codeVerifier: string
  codeChallenge: string
}> {
  const { randomBytes, createHash } = await import("crypto")
  const codeVerifier = base64urlEncode(randomBytes(32))
  const hash = createHash("sha256").update(codeVerifier).digest()
  const codeChallenge = base64urlEncode(hash)
  return { codeVerifier, codeChallenge }
}

export function generateState(): string {
  const { randomBytes } = require("crypto") as typeof import("crypto")
  return base64urlEncode(randomBytes(16))
}

// =============================================================================
// OAUTH FLOW
// =============================================================================

export function getAuthorizationUrl(
  state: string,
  codeChallenge: string
): string {
  const config = getCanvaConfig()
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: CANVA_SCOPES.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })
  return `${CANVA_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<CanvaTokenResponse> {
  const config = getCanvaConfig()
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64")

  const response = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Canva token exchange failed: ${response.status} ${errorText}`)
  }

  return response.json()
}

export async function refreshAccessToken(
  encryptedRefreshToken: string
): Promise<CanvaTokenResponse> {
  const config = getCanvaConfig()
  const refreshToken = decrypt(encryptedRefreshToken)
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64")

  const response = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Canva token refresh failed: ${response.status} ${errorText}`)
  }

  return response.json()
}

export async function revokeToken(encryptedToken: string): Promise<void> {
  const config = getCanvaConfig()
  const token = decrypt(encryptedToken)
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64")

  await fetch(`${CANVA_API_BASE}/oauth/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({ token }),
  })
}

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

/**
 * Get a valid access token for a user, auto-refreshing if expired.
 * Returns null if no connection exists.
 */
export async function getValidAccessToken(
  userId: string
): Promise<string | null> {
  const connection = await (prisma as any).canvaConnection.findUnique({
    where: { userId },
  })

  if (!connection) return null

  // Check if token is still valid (with 5-minute buffer)
  const now = new Date()
  const expiresAt = new Date(connection.tokenExpiresAt)
  const bufferMs = 5 * 60 * 1000

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    // Token still valid
    return decrypt(connection.accessToken)
  }

  // Token expired or about to expire — refresh
  try {
    const tokens = await refreshAccessToken(connection.refreshToken)

    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    await (prisma as any).canvaConnection.update({
      where: { userId },
      data: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiresAt: newExpiresAt,
        scopes: tokens.scope ? tokens.scope.split(" ") : connection.scopes,
      },
    })

    return tokens.access_token
  } catch (error) {
    console.error("[canva] Token refresh failed:", error)
    // Delete stale connection
    await (prisma as any).canvaConnection.delete({ where: { userId } })
    return null
  }
}

/**
 * Store tokens after initial OAuth flow
 */
export async function storeCanvaConnection(
  userId: string,
  tokens: CanvaTokenResponse,
  userInfo?: CanvaUser
): Promise<void> {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
  const scopes = tokens.scope ? tokens.scope.split(" ") : []

  await (prisma as any).canvaConnection.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiresAt: expiresAt,
      canvaUserId: userInfo?.user_id || null,
      canvaTeamId: userInfo?.team_id || null,
      scopes,
    },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiresAt: expiresAt,
      canvaUserId: userInfo?.user_id || null,
      canvaTeamId: userInfo?.team_id || null,
      scopes,
    },
  })
}

/**
 * Remove Canva connection (revoke tokens + delete record)
 */
export async function removeCanvaConnection(userId: string): Promise<void> {
  const connection = await (prisma as any).canvaConnection.findUnique({
    where: { userId },
  })

  if (!connection) return

  // Revoke tokens (best-effort)
  try {
    await revokeToken(connection.accessToken)
  } catch {
    // Ignore revocation errors
  }

  await (prisma as any).canvaConnection.delete({ where: { userId } })
}

// =============================================================================
// API CALLS
// =============================================================================

async function canvaFetch<T>(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${CANVA_API_BASE}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Canva API error ${response.status}: ${errorText}`)
  }

  return response.json()
}

/**
 * Get current user info
 */
export async function getCanvaUser(
  accessToken: string
): Promise<CanvaUser> {
  return canvaFetch<CanvaUser>(accessToken, "/users/me")
}

/**
 * List user's Canva designs
 */
export async function listDesigns(
  accessToken: string,
  options: {
    query?: string
    continuation?: string
    limit?: number
  } = {}
): Promise<CanvaDesignListResponse> {
  const params = new URLSearchParams()
  if (options.query) params.set("query", options.query)
  if (options.continuation) params.set("continuation", options.continuation)
  if (options.limit) params.set("limit", String(Math.min(options.limit, 100)))

  const qs = params.toString()
  return canvaFetch<CanvaDesignListResponse>(
    accessToken,
    `/designs${qs ? `?${qs}` : ""}`
  )
}

/**
 * Get a single design by ID
 */
export async function getDesign(
  accessToken: string,
  designId: string
): Promise<CanvaDesign> {
  const response = await canvaFetch<{ design: CanvaDesign }>(
    accessToken,
    `/designs/${designId}`
  )
  return response.design
}

/**
 * Create an export job for a design
 */
export async function createExportJob(
  accessToken: string,
  request: {
    designId: string
    format: CanvaExportFormat
    width?: number
    height?: number
    quality?: number
    lossless?: boolean
  }
): Promise<CanvaExportJob> {
  const formatConfig: Record<string, unknown> = {
    type: request.format,
  }

  if (request.width) formatConfig.width = request.width
  if (request.height) formatConfig.height = request.height
  if (request.format === "jpg" && request.quality) {
    formatConfig.export_quality = request.quality
  }
  if (request.format === "png" && request.lossless !== undefined) {
    formatConfig.lossless = request.lossless
  }

  const body = {
    design_id: request.designId,
    format: formatConfig,
  }

  const response = await canvaFetch<{ job: CanvaExportJob }>(
    accessToken,
    "/exports",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  )

  return response.job
}

/**
 * Poll export job status
 */
export async function getExportJob(
  accessToken: string,
  exportId: string
): Promise<CanvaExportJob> {
  const response = await canvaFetch<{ job: CanvaExportJob }>(
    accessToken,
    `/exports/${exportId}`
  )
  return response.job
}

/**
 * Poll export until complete (with exponential backoff)
 */
export async function waitForExport(
  accessToken: string,
  exportId: string,
  maxWaitMs: number = 120000
): Promise<CanvaExportJob> {
  const startTime = Date.now()
  let delay = 1000 // Start with 1s

  while (Date.now() - startTime < maxWaitMs) {
    const job = await getExportJob(accessToken, exportId)

    if (job.status === "success" || job.status === "failed") {
      return job
    }

    // Wait with exponential backoff (max 10s)
    await new Promise((resolve) => setTimeout(resolve, delay))
    delay = Math.min(delay * 1.5, 10000)
  }

  throw new Error("Export job timed out")
}

/**
 * Download exported file from Canva's temporary URL
 */
export async function downloadExport(
  downloadUrl: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(downloadUrl)

  if (!response.ok) {
    throw new Error(`Failed to download export: ${response.status}`)
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream"
  const arrayBuffer = await response.arrayBuffer()

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  }
}

// =============================================================================
// CONNECTION STATUS
// =============================================================================

export async function getConnectionStatus(
  userId: string
): Promise<{ connected: boolean; canvaUserId?: string; scopes?: string[] }> {
  const connection = await (prisma as any).canvaConnection.findUnique({
    where: { userId },
    select: {
      canvaUserId: true,
      scopes: true,
      tokenExpiresAt: true,
    },
  })

  if (!connection) {
    return { connected: false }
  }

  return {
    connected: true,
    canvaUserId: connection.canvaUserId || undefined,
    scopes: connection.scopes || [],
  }
}
