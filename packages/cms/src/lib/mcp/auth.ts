/**
 * MCP Auth Utilities
 *
 * Provides API key generation, hashing, and validation for MCP clients.
 * Keys use the format: cms_<32 base64url chars>
 */

import crypto from "crypto"

/**
 * Key prefix for CMS MCP API keys
 */
export const API_KEY_PREFIX = "cms_"

/**
 * Generate a new API key
 * Format: cms_<32 random base64url characters>
 *
 * @returns Object with raw key (show once) and hash (store in DB)
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  // Generate 24 random bytes = 32 base64url characters
  const randomBytes = crypto.randomBytes(24)
  const keyBody = randomBytes
    .toString("base64url")
    .replace(/[+/=]/g, (c) =>
      c === "+" ? "-" : c === "/" ? "_" : ""
    )

  const key = `${API_KEY_PREFIX}${keyBody}`
  const hash = hashApiKey(key)
  const prefix = key.substring(0, 8) // "cms_xxxx"

  return { key, hash, prefix }
}

/**
 * Hash an API key for storage/comparison
 * Uses SHA-256 for fast, secure hashing
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex")
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return false
  }

  // cms_ + 32 base64url chars = 36 total
  if (key.length < 36) {
    return false
  }

  return true
}

/**
 * Extract key from Authorization header
 * Supports: "Bearer cms_xxx" or just "cms_xxx"
 */
export function extractApiKey(authHeader: string | null): string | null {
  if (!authHeader) return null

  // Handle Bearer token format
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim()
  }

  // Handle raw key
  if (authHeader.startsWith(API_KEY_PREFIX)) {
    return authHeader.trim()
  }

  return null
}
