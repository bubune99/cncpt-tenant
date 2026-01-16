/**
 * Library utilities exports
 */

// Database (Prisma client)
export { prisma, prisma as db } from '../lib/db'

// Analytics
export * from '../lib/analytics'

// Blog
export * from '../lib/blog'

// Cart
export * from '../lib/cart'

// Discounts
export * from '../lib/discounts'

// Email
export * from '../lib/email'

// Encryption
export * from '../lib/encryption'

// Forms
export * from '../lib/forms'

// Inventory
export * from '../lib/inventory'

// Media
export * from '../lib/media'

// Notifications
export * from '../lib/notifications'

// Permissions
export * from '../lib/permissions'

// Order Workflows (excluding WorkflowTemplate which conflicts with workflows)
export {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  getDefaultWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  assignWorkflowToOrder,
  initializeOrderWorkflow,
  type WorkflowCreateInput,
  type WorkflowUpdateInput,
  type WorkflowWithStages,
  type WorkflowStage,
  DEFAULT_WORKFLOW_TEMPLATES,
} from '../lib/order-workflows'

// Plugins (explicit exports to avoid conflicts)
export {
  PluginRegistry,
  getPluginRegistry,
  resetPluginRegistry,
  executePrimitive,
  executeByIdOrName,
  testPrimitive,
  getExecutionStats,
  getRecentExecutions,
  loadBuiltInPrimitives,
  validateHandlerSecurity,
  generateId,
  incrementVersion,
  slugify,
  type PrimitiveDefinition,
  type PluginDefinition,
  type ExecutionContext,
  type ExecutionResult,
  type CreatePrimitiveRequest,
  type CreatePluginRequest,
} from '../lib/plugins'

// Reviews
export * from '../lib/reviews'

// SEO
export * from '../lib/seo'

// Settings
export * from '../lib/settings'

// Site Settings
export * from '../lib/site-settings'

// Workflows (primary workflow exports)
export * from '../lib/workflows'

// Stripe (payments) - explicit exports to avoid RefundResponse conflict with shippo
export {
  getStripeSettings,
  clearStripeSettingsCache,
  createCheckoutSession,
  createPaymentIntent,
  capturePaymentIntent,
  cancelPaymentIntent,
  createCustomer,
  getOrCreateCustomer,
  createSubscription,
  cancelSubscription,
  createRefund,
  getCheckoutSession,
  getPaymentIntent,
  constructWebhookEvent,
  createBillingPortalSession,
  listPaymentMethods,
  listInvoices,
  getProduct,
  createProduct,
  createPrice,
  type StripeSettings,
  type PaymentStatus,
  type CreateCheckoutSessionRequest,
  type CreatePaymentIntentRequest,
  type CreateCustomerRequest,
  type CreateRefundRequest,
} from '../lib/stripe'

// Shippo (shipping)
export * from '../lib/shippo'

// Dashboard configuration
export * from '../lib/dashboard'

// Routes
export * from '../lib/routes'

// Utils
export { cn } from '../lib/utils'
