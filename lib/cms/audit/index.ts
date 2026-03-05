/**
 * Audit Logging Utility
 *
 * Provides helpers for computing diffs between old/new values
 * and sanitizing sensitive fields before storing audit entries.
 */

import { NextRequest } from 'next/server'
import { logAuditEvent } from '../permissions'
import type { AuditAction } from '../permissions/types'

// Fields that should never appear in audit log details
const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'secret',
  'secretKey',
  'accessToken',
  'refreshToken',
  'token',
  'apiKey',
  'apiSecret',
  'encryptionKey',
  'privateKey',
  'stripeSecretKey',
  'stripeWebhookSecret',
  'sendgridApiKey',
  'resendApiKey',
  'mailgunApiKey',
  'awsSecretAccessKey',
  'databaseUrl',
  'connectionString',
  'smtpPassword',
  'webhookSecret',
])

// Fields with large payloads that should be summarized rather than stored in full
const LARGE_FIELDS = new Set([
  'content',
  'pageContent',
  'customHeader',
  'customFooter',
  'customAnnouncement',
  'descriptionHtml',
  'bundleItems',
])

/**
 * Sanitize a value object by removing sensitive fields and summarizing large fields
 */
export function sanitizeForAudit(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    // Skip sensitive fields
    if (SENSITIVE_FIELDS.has(key) || SENSITIVE_FIELDS.has(lowerKey)) {
      result[key] = '[REDACTED]'
      continue
    }

    // Summarize large fields
    if (LARGE_FIELDS.has(key)) {
      if (value === null || value === undefined) {
        result[key] = null
      } else if (typeof value === 'string') {
        result[key] = value.length > 200 ? `[${value.length} chars]` : value
      } else if (typeof value === 'object') {
        result[key] = '[JSON object]'
      } else {
        result[key] = value
      }
      continue
    }

    result[key] = value
  }

  return result
}

/**
 * Compute a diff between old and new values, showing only changed fields.
 * Returns { field: { from: oldValue, to: newValue } } for each changed field.
 */
export function computeDiff(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> | null {
  const diff: Record<string, { from: unknown; to: unknown }> = {}

  for (const [key, newVal] of Object.entries(newValues)) {
    const oldVal = oldValues[key]

    // Skip if values are identical (simple comparison)
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) {
      continue
    }

    diff[key] = { from: oldVal, to: newVal }
  }

  return Object.keys(diff).length > 0 ? diff : null
}

/**
 * Extract IP address and user agent from a NextRequest
 */
export function extractRequestMeta(request: NextRequest): {
  ipAddress: string | undefined
  userAgent: string | undefined
} {
  const forwarded = request.headers.get('x-forwarded-for')
  const ipAddress = forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined
  const userAgent = request.headers.get('user-agent') || undefined

  return { ipAddress, userAgent }
}

/**
 * High-level audit logging helper that sanitizes data, computes diffs,
 * and extracts request metadata before writing the audit entry.
 */
export async function auditLog(params: {
  userId: string
  userEmail: string
  action: AuditAction
  entityType: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  details?: Record<string, unknown>
  request?: NextRequest
}): Promise<void> {
  const { userId, userEmail, action, entityType, entityId, before, after, details, request } = params

  // Compute diff if both before and after are provided
  let changeDetails: Record<string, unknown> = {}

  if (before && after) {
    const sanitizedBefore = sanitizeForAudit(before)
    const sanitizedAfter = sanitizeForAudit(after)
    const diff = computeDiff(sanitizedBefore, sanitizedAfter)
    if (diff) {
      changeDetails.changes = diff
    }
  } else if (after) {
    changeDetails = sanitizeForAudit(after)
  } else if (details) {
    changeDetails = sanitizeForAudit(details)
  }

  // Extract request metadata
  const meta = request
    ? extractRequestMeta(request)
    : { ipAddress: undefined, userAgent: undefined }

  await logAuditEvent({
    userId,
    userEmail,
    action,
    targetType: entityType,
    targetId: entityId,
    details: changeDetails,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  })
}
