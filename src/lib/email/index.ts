/**
 * Email Service
 *
 * Multi-provider email sending abstraction with tracking support
 */

// Re-export types
export * from './types'

// Re-export utilities
export * from './merge-tags'
export * from './tracking'
export * from './webhooks'

// Re-export subscription management
export * from './subscriptions'

// Re-export queue functionality
export * from './queue'

// Re-export core email service (EmailService class, sendEmail, sendBulkEmail, etc.)
export * from './core'
