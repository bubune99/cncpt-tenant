/**
 * Email Queue Service
 *
 * Async email queue with retry logic, rate limiting, and batch processing.
 * Uses in-memory queue with optional database persistence for reliability.
 */

import { prisma } from '../db'
import { sendEmail } from './core'
import type { EmailMessage, EmailSendResult } from './types'

// =============================================================================
// TYPES
// =============================================================================

export type EmailPriority = 'high' | 'normal' | 'low'
export type EmailStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'

export interface QueuedEmail {
  id: string
  message: EmailMessage
  priority: EmailPriority
  status: EmailStatus
  attempts: number
  maxAttempts: number
  scheduledFor?: Date
  lastAttemptAt?: Date
  lastError?: string
  createdAt: Date
  sentAt?: Date
  result?: EmailSendResult
}

export interface QueueOptions {
  /** Maximum concurrent sends */
  concurrency?: number
  /** Rate limit: max emails per second */
  rateLimit?: number
  /** Default max retry attempts */
  maxAttempts?: number
  /** Base delay between retries in ms (doubles each attempt) */
  retryDelay?: number
  /** Process interval in ms */
  processInterval?: number
  /** Enable database persistence */
  persistToDb?: boolean
}

export interface EnqueueOptions {
  priority?: EmailPriority
  maxAttempts?: number
  scheduledFor?: Date
  /** Unique key to prevent duplicates */
  deduplicationKey?: string
}

export interface QueueStats {
  pending: number
  processing: number
  sent: number
  failed: number
  total: number
  averageProcessingTime?: number
}

// =============================================================================
// EMAIL QUEUE CLASS
// =============================================================================

export class EmailQueue {
  private queue: Map<string, QueuedEmail> = new Map()
  private processing: Set<string> = new Set()
  private deduplicationKeys: Set<string> = new Set()
  private isProcessing = false
  private processTimer: NodeJS.Timeout | null = null
  private options: Required<QueueOptions>
  private lastSendTime = 0
  private sendCount = 0
  private totalProcessingTime = 0
  private processedCount = 0

  constructor(options: QueueOptions = {}) {
    this.options = {
      concurrency: options.concurrency ?? 5,
      rateLimit: options.rateLimit ?? 10, // 10 emails/second default
      maxAttempts: options.maxAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      processInterval: options.processInterval ?? 1000,
      persistToDb: options.persistToDb ?? false,
    }
  }

  /**
   * Enqueue an email for sending
   */
  async enqueue(message: EmailMessage, options: EnqueueOptions = {}): Promise<string> {
    const id = this.generateId()
    const now = new Date()

    // Check deduplication
    if (options.deduplicationKey) {
      if (this.deduplicationKeys.has(options.deduplicationKey)) {
        throw new Error(`Duplicate email: ${options.deduplicationKey}`)
      }
      this.deduplicationKeys.add(options.deduplicationKey)
    }

    const queuedEmail: QueuedEmail = {
      id,
      message,
      priority: options.priority ?? 'normal',
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.options.maxAttempts,
      scheduledFor: options.scheduledFor,
      createdAt: now,
    }

    this.queue.set(id, queuedEmail)

    // Persist to database if enabled
    if (this.options.persistToDb) {
      await this.persistEmail(queuedEmail)
    }

    // Start processing if not already running
    this.startProcessing()

    return id
  }

  /**
   * Enqueue multiple emails
   */
  async enqueueBatch(
    messages: EmailMessage[],
    options: EnqueueOptions = {}
  ): Promise<string[]> {
    const ids: string[] = []

    for (const message of messages) {
      const id = await this.enqueue(message, options)
      ids.push(id)
    }

    return ids
  }

  /**
   * Get email status by ID
   */
  getStatus(id: string): QueuedEmail | undefined {
    return this.queue.get(id)
  }

  /**
   * Cancel a pending email
   */
  cancel(id: string): boolean {
    const email = this.queue.get(id)
    if (!email || email.status !== 'pending') {
      return false
    }

    email.status = 'cancelled'
    return true
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const stats: QueueStats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      total: this.queue.size,
    }

    for (const email of this.queue.values()) {
      switch (email.status) {
        case 'pending':
          stats.pending++
          break
        case 'processing':
          stats.processing++
          break
        case 'sent':
          stats.sent++
          break
        case 'failed':
          stats.failed++
          break
      }
    }

    if (this.processedCount > 0) {
      stats.averageProcessingTime = this.totalProcessingTime / this.processedCount
    }

    return stats
  }

  /**
   * Start queue processing
   */
  start(): void {
    this.startProcessing()
  }

  /**
   * Stop queue processing
   */
  stop(): void {
    this.isProcessing = false
    if (this.processTimer) {
      clearTimeout(this.processTimer)
      this.processTimer = null
    }
  }

  /**
   * Clear completed/failed emails from queue
   */
  clear(options: { keepPending?: boolean } = {}): number {
    const { keepPending = true } = options
    let cleared = 0

    for (const [id, email] of this.queue.entries()) {
      if (email.status === 'sent' || email.status === 'failed' || email.status === 'cancelled') {
        this.queue.delete(id)
        cleared++
      } else if (!keepPending && email.status === 'pending') {
        this.queue.delete(id)
        cleared++
      }
    }

    return cleared
  }

  /**
   * Retry failed emails
   */
  async retryFailed(): Promise<number> {
    let retriedCount = 0

    for (const email of this.queue.values()) {
      if (email.status === 'failed' && email.attempts < email.maxAttempts) {
        email.status = 'pending'
        email.lastError = undefined
        retriedCount++
      }
    }

    if (retriedCount > 0) {
      this.startProcessing()
    }

    return retriedCount
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private startProcessing(): void {
    if (this.isProcessing) return

    this.isProcessing = true
    this.scheduleProcess()
  }

  private scheduleProcess(): void {
    if (!this.isProcessing) return

    this.processTimer = setTimeout(async () => {
      await this.process()
      this.scheduleProcess()
    }, this.options.processInterval)
  }

  private async process(): Promise<void> {
    // Get pending emails sorted by priority
    const pending = this.getPendingEmails()

    if (pending.length === 0) {
      return
    }

    // Respect rate limiting
    const now = Date.now()
    if (now - this.lastSendTime < 1000) {
      if (this.sendCount >= this.options.rateLimit) {
        return // Rate limited
      }
    } else {
      this.sendCount = 0
      this.lastSendTime = now
    }

    // Process up to concurrency limit
    const toProcess = pending.slice(0, this.options.concurrency - this.processing.size)

    const promises = toProcess.map(email => this.processEmail(email))
    await Promise.allSettled(promises)
  }

  private getPendingEmails(): QueuedEmail[] {
    const now = new Date()
    const pending: QueuedEmail[] = []

    for (const email of this.queue.values()) {
      if (email.status !== 'pending') continue
      if (this.processing.has(email.id)) continue
      if (email.scheduledFor && email.scheduledFor > now) continue

      // Check retry delay
      if (email.lastAttemptAt) {
        const delay = this.calculateRetryDelay(email.attempts)
        const nextAttempt = new Date(email.lastAttemptAt.getTime() + delay)
        if (nextAttempt > now) continue
      }

      pending.push(email)
    }

    // Sort by priority (high > normal > low)
    const priorityOrder: Record<EmailPriority, number> = {
      high: 0,
      normal: 1,
      low: 2,
    }

    pending.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    return pending
  }

  private calculateRetryDelay(attempts: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return this.options.retryDelay * Math.pow(2, attempts)
  }

  private async processEmail(email: QueuedEmail): Promise<void> {
    if (this.processing.has(email.id)) return

    this.processing.add(email.id)
    email.status = 'processing'
    const startTime = Date.now()

    try {
      const result = await sendEmail(email.message)

      email.attempts++
      email.lastAttemptAt = new Date()
      email.result = result

      if (result.success) {
        email.status = 'sent'
        email.sentAt = new Date()
        this.sendCount++
      } else {
        email.lastError = result.error
        if (email.attempts >= email.maxAttempts) {
          email.status = 'failed'
        } else {
          email.status = 'pending' // Will retry
        }
      }

      // Update stats
      this.processedCount++
      this.totalProcessingTime += Date.now() - startTime

      // Update database if persisting
      if (this.options.persistToDb) {
        await this.updatePersistedEmail(email)
      }
    } catch (error) {
      email.attempts++
      email.lastAttemptAt = new Date()
      email.lastError = error instanceof Error ? error.message : 'Unknown error'

      if (email.attempts >= email.maxAttempts) {
        email.status = 'failed'
      } else {
        email.status = 'pending'
      }
    } finally {
      this.processing.delete(email.id)
    }
  }

  private async persistEmail(email: QueuedEmail): Promise<void> {
    try {
      await prisma.emailQueueItem.create({
        data: {
          id: email.id,
          message: email.message as never,
          priority: email.priority,
          status: email.status,
          attempts: email.attempts,
          maxAttempts: email.maxAttempts,
          scheduledFor: email.scheduledFor,
          createdAt: email.createdAt,
        },
      })
    } catch (error) {
      console.error('Failed to persist email to database:', error)
    }
  }

  private async updatePersistedEmail(email: QueuedEmail): Promise<void> {
    try {
      await prisma.emailQueueItem.update({
        where: { id: email.id },
        data: {
          status: email.status,
          attempts: email.attempts,
          lastAttemptAt: email.lastAttemptAt,
          lastError: email.lastError,
          sentAt: email.sentAt,
          result: email.result as never,
        },
      })
    } catch (error) {
      console.error('Failed to update persisted email:', error)
    }
  }

  /**
   * Load pending emails from database on startup
   */
  async loadFromDatabase(): Promise<number> {
    if (!this.options.persistToDb) return 0

    try {
      const items = await prisma.emailQueueItem.findMany({
        where: {
          status: { in: ['pending', 'processing'] },
        },
      })

      for (const item of items) {
        const queuedEmail: QueuedEmail = {
          id: item.id,
          message: item.message as unknown as EmailMessage,
          priority: item.priority as EmailPriority,
          status: 'pending', // Reset processing items to pending
          attempts: item.attempts,
          maxAttempts: item.maxAttempts,
          scheduledFor: item.scheduledFor ?? undefined,
          lastAttemptAt: item.lastAttemptAt ?? undefined,
          lastError: item.lastError ?? undefined,
          createdAt: item.createdAt,
        }

        this.queue.set(item.id, queuedEmail)
      }

      if (items.length > 0) {
        this.startProcessing()
      }

      return items.length
    } catch (error) {
      console.error('Failed to load emails from database:', error)
      return 0
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let queueInstance: EmailQueue | null = null

export function getEmailQueue(options?: QueueOptions): EmailQueue {
  if (!queueInstance) {
    queueInstance = new EmailQueue(options)
  }
  return queueInstance
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Queue an email for async sending
 */
export async function queueEmail(
  message: EmailMessage,
  options?: EnqueueOptions
): Promise<string> {
  const queue = getEmailQueue()
  return queue.enqueue(message, options)
}

/**
 * Queue multiple emails for async sending
 */
export async function queueEmails(
  messages: EmailMessage[],
  options?: EnqueueOptions
): Promise<string[]> {
  const queue = getEmailQueue()
  return queue.enqueueBatch(messages, options)
}

/**
 * Queue a high-priority email
 */
export async function queueUrgentEmail(
  message: EmailMessage,
  options?: Omit<EnqueueOptions, 'priority'>
): Promise<string> {
  return queueEmail(message, { ...options, priority: 'high' })
}

/**
 * Schedule an email for later
 */
export async function scheduleEmail(
  message: EmailMessage,
  sendAt: Date,
  options?: EnqueueOptions
): Promise<string> {
  return queueEmail(message, { ...options, scheduledFor: sendAt })
}

/**
 * Get queue status
 */
export function getQueueStats(): QueueStats {
  const queue = getEmailQueue()
  return queue.getStats()
}

/**
 * Check email status
 */
export function checkEmailStatus(id: string): QueuedEmail | undefined {
  const queue = getEmailQueue()
  return queue.getStatus(id)
}
