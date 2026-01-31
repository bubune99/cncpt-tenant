/**
 * MCP Usage Analytics
 *
 * Track API key usage, tool calls, and performance metrics.
 */

import { prisma } from "../db"

/**
 * Usage event types
 */
export type UsageEventType = "request" | "tool_call" | "error" | "rate_limited"

/**
 * Usage event data
 */
export interface UsageEvent {
  apiKeyId: string
  eventType: UsageEventType
  toolName?: string
  statusCode?: number
  durationMs?: number
  errorMessage?: string
  metadata?: Record<string, unknown>
}

/**
 * Aggregated usage stats
 */
export interface UsageStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  rateLimitedRequests: number
  toolUsage: Record<string, number>
  avgResponseTimeMs: number
  periodStart: Date
  periodEnd: Date
}

/**
 * In-memory buffer for batching writes
 */
const usageBuffer: UsageEvent[] = []
const BUFFER_FLUSH_SIZE = 100
const BUFFER_FLUSH_INTERVAL_MS = 10000 // 10 seconds

/**
 * Track a usage event
 *
 * Events are buffered and flushed periodically to reduce database writes.
 */
export function trackUsage(event: UsageEvent): void {
  usageBuffer.push({
    ...event,
    metadata: {
      ...event.metadata,
      timestamp: new Date().toISOString(),
    },
  })

  // Flush if buffer is full
  if (usageBuffer.length >= BUFFER_FLUSH_SIZE) {
    flushUsageBuffer().catch(console.error)
  }
}

/**
 * Flush the usage buffer to the database
 */
export async function flushUsageBuffer(): Promise<void> {
  if (usageBuffer.length === 0) return

  const events = usageBuffer.splice(0, usageBuffer.length)

  try {
    // Group events by apiKeyId for efficient updates
    const keyStats = new Map<
      string,
      {
        requestCount: number
        successCount: number
        errorCount: number
        rateLimitCount: number
        totalDurationMs: number
        toolCounts: Record<string, number>
      }
    >()

    for (const event of events) {
      if (!keyStats.has(event.apiKeyId)) {
        keyStats.set(event.apiKeyId, {
          requestCount: 0,
          successCount: 0,
          errorCount: 0,
          rateLimitCount: 0,
          totalDurationMs: 0,
          toolCounts: {},
        })
      }

      const stats = keyStats.get(event.apiKeyId)!

      switch (event.eventType) {
        case "request":
          stats.requestCount++
          if (event.statusCode && event.statusCode >= 200 && event.statusCode < 400) {
            stats.successCount++
          }
          if (event.durationMs) {
            stats.totalDurationMs += event.durationMs
          }
          break
        case "tool_call":
          if (event.toolName) {
            stats.toolCounts[event.toolName] = (stats.toolCounts[event.toolName] || 0) + 1
          }
          break
        case "error":
          stats.errorCount++
          break
        case "rate_limited":
          stats.rateLimitCount++
          break
      }
    }

    // Update API key usage stats in database
    const updates = Array.from(keyStats.entries()).map(([apiKeyId, stats]) => {
      return prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          // These fields would need to be added to the ApiKey model
          // For now, just update lastUsedAt
          lastUsedAt: new Date(),
        },
      })
    })

    await Promise.allSettled(updates)

    // Store detailed analytics (if ApiKeyUsage table exists)
    // This is a simplified version - in production you'd want a separate analytics table
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const [apiKeyId, stats] of keyStats.entries()) {
      try {
        await prisma.apiKeyUsage.upsert({
          where: {
            apiKeyId_date: {
              apiKeyId,
              date: today,
            },
          },
          create: {
            apiKeyId,
            date: today,
            requestCount: stats.requestCount,
            successCount: stats.successCount,
            errorCount: stats.errorCount,
            rateLimitCount: stats.rateLimitCount,
            avgResponseTimeMs: stats.requestCount > 0
              ? Math.round(stats.totalDurationMs / stats.requestCount)
              : 0,
            toolUsage: stats.toolCounts,
          },
          update: {
            requestCount: { increment: stats.requestCount },
            successCount: { increment: stats.successCount },
            errorCount: { increment: stats.errorCount },
            rateLimitCount: { increment: stats.rateLimitCount },
            // Note: avgResponseTimeMs would need more complex calculation for updates
            toolUsage: stats.toolCounts, // This overwrites - would need JSON merge in production
          },
        })
      } catch (error) {
        // ApiKeyUsage table might not exist yet
        console.warn("[mcp-analytics] Could not store usage stats:", error)
      }
    }
  } catch (error) {
    console.error("[mcp-analytics] Failed to flush usage buffer:", error)
    // Put events back in buffer for retry (limit to prevent memory issues)
    if (usageBuffer.length < BUFFER_FLUSH_SIZE * 2) {
      usageBuffer.unshift(...events)
    }
  }
}

/**
 * Get usage stats for an API key
 */
export async function getApiKeyUsageStats(
  apiKeyId: string,
  days: number = 30
): Promise<UsageStats | null> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  try {
    const usage = await prisma.apiKeyUsage.findMany({
      where: {
        apiKeyId,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    })

    if (usage.length === 0) {
      return null
    }

    // Aggregate stats
    let totalRequests = 0
    let successfulRequests = 0
    let failedRequests = 0
    let rateLimitedRequests = 0
    let totalResponseTime = 0
    const toolUsage: Record<string, number> = {}

    for (const day of usage) {
      totalRequests += day.requestCount
      successfulRequests += day.successCount
      failedRequests += day.errorCount
      rateLimitedRequests += day.rateLimitCount
      totalResponseTime += day.avgResponseTimeMs * day.requestCount

      // Merge tool usage
      const dayToolUsage = day.toolUsage as Record<string, number> | null
      if (dayToolUsage) {
        for (const [tool, count] of Object.entries(dayToolUsage)) {
          toolUsage[tool] = (toolUsage[tool] || 0) + count
        }
      }
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      rateLimitedRequests,
      toolUsage,
      avgResponseTimeMs: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
      periodStart: startDate,
      periodEnd: new Date(),
    }
  } catch (error) {
    console.error("[mcp-analytics] Failed to get usage stats:", error)
    return null
  }
}

/**
 * Get usage stats for all API keys of a user
 */
export async function getUserUsageStats(
  userId: string,
  days: number = 30
): Promise<{
  keys: Array<{ apiKeyId: string; name: string; stats: UsageStats | null }>
  totals: UsageStats
}> {
  const keys = await prisma.apiKey.findMany({
    where: { userId, revokedAt: null },
    select: { id: true, name: true },
  })

  const keyStats = await Promise.all(
    keys.map(async (key) => ({
      apiKeyId: key.id,
      name: key.name,
      stats: await getApiKeyUsageStats(key.id, days),
    }))
  )

  // Calculate totals
  const totals: UsageStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitedRequests: 0,
    toolUsage: {},
    avgResponseTimeMs: 0,
    periodStart: new Date(),
    periodEnd: new Date(),
  }

  let totalResponseTime = 0
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  for (const key of keyStats) {
    if (key.stats) {
      totals.totalRequests += key.stats.totalRequests
      totals.successfulRequests += key.stats.successfulRequests
      totals.failedRequests += key.stats.failedRequests
      totals.rateLimitedRequests += key.stats.rateLimitedRequests
      totalResponseTime += key.stats.avgResponseTimeMs * key.stats.totalRequests

      for (const [tool, count] of Object.entries(key.stats.toolUsage)) {
        totals.toolUsage[tool] = (totals.toolUsage[tool] || 0) + count
      }
    }
  }

  totals.avgResponseTimeMs =
    totals.totalRequests > 0 ? Math.round(totalResponseTime / totals.totalRequests) : 0
  totals.periodStart = startDate
  totals.periodEnd = new Date()

  return { keys: keyStats, totals }
}

// Periodic flush
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    flushUsageBuffer().catch(console.error)
  }, BUFFER_FLUSH_INTERVAL_MS)
}

// Flush on process exit
if (typeof process !== "undefined" && process.on) {
  process.on("beforeExit", () => {
    flushUsageBuffer().catch(console.error)
  })
}
