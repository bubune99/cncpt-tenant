/**
 * Workflow Templates Seed Data
 *
 * Pre-built workflow templates for common e-commerce automation scenarios.
 * These templates can be installed with one click and customized.
 */

import { WorkflowTemplateCategory, WorkflowTrigger, WorkflowStepType } from '@prisma/client'
import { prisma } from '../../src/lib/db'

interface StepDefinition {
  name: string
  type: WorkflowStepType
  order: number
  config?: Record<string, unknown>
  conditions?: Record<string, unknown>
}

interface WorkflowTemplateData {
  name: string
  slug: string
  description: string
  category: WorkflowTemplateCategory
  trigger: WorkflowTrigger
  triggerConfig?: Record<string, unknown>
  steps: StepDefinition[]
  icon: string
  color: string
  tags: string[]
  documentation: string
  exampleUseCase: string
  isSystem: boolean
  version: string
}

const workflowTemplates: WorkflowTemplateData[] = [
  // 1. Order Confirmation
  {
    name: 'Order Confirmation',
    slug: 'order-confirmation',
    description: 'Automatically send order confirmation emails when a new order is placed.',
    category: 'ORDER',
    trigger: 'EVENT',
    triggerConfig: {
      eventType: 'order.created',
      filters: {}
    },
    steps: [
      {
        name: 'Order Created Trigger',
        type: 'TRIGGER',
        order: 0,
        config: {
          eventType: 'order.created'
        }
      },
      {
        name: 'Load Order Details',
        type: 'DATABASE',
        order: 1,
        config: {
          operation: 'findUnique',
          model: 'Order',
          include: ['items', 'user', 'shippingAddress']
        }
      },
      {
        name: 'Format Email Content',
        type: 'TRANSFORM',
        order: 2,
        config: {
          template: 'order-confirmation',
          variables: ['orderNumber', 'items', 'total', 'shippingAddress']
        }
      },
      {
        name: 'Send Confirmation Email',
        type: 'ACTION',
        order: 3,
        config: {
          action: 'sendEmail',
          template: 'order-confirmation',
          to: '{{order.user.email}}',
          subject: 'Order Confirmation #{{order.orderNumber}}'
        }
      },
      {
        name: 'Log Completion',
        type: 'END',
        order: 4,
        config: {
          logMessage: 'Order confirmation sent for order {{order.orderNumber}}'
        }
      }
    ],
    icon: 'ShoppingBag',
    color: '#10B981',
    tags: ['order', 'email', 'notification', 'essential'],
    documentation: `
# Order Confirmation Workflow

Automatically sends a professional order confirmation email when a customer places an order.

## Trigger
- **Event**: \`order.created\`
- Fires immediately when a new order is placed

## Actions
1. Loads full order details including items and customer info
2. Formats the email using the order-confirmation template
3. Sends the email to the customer

## Customization
- Edit the email template in Email Templates
- Add conditions to filter by order value or customer type
- Add SMS notification step for high-value orders
    `,
    exampleUseCase: 'A customer places an order for $150. The workflow triggers, loads order details, and sends a beautifully formatted confirmation email within seconds.',
    isSystem: true,
    version: '1.0.0'
  },

  // 2. Cart Abandonment Recovery
  {
    name: 'Cart Abandonment Recovery',
    slug: 'cart-abandonment',
    description: 'Send recovery emails to customers who abandon their shopping cart.',
    category: 'CART',
    trigger: 'SCHEDULE',
    triggerConfig: {
      cron: '0 */6 * * *', // Every 6 hours
      timezone: 'UTC'
    },
    steps: [
      {
        name: 'Scheduled Trigger',
        type: 'TRIGGER',
        order: 0,
        config: {
          schedule: '0 */6 * * *'
        }
      },
      {
        name: 'Find Abandoned Carts',
        type: 'DATABASE',
        order: 1,
        config: {
          operation: 'findMany',
          model: 'Cart',
          where: {
            updatedAt: { lte: '{{now - 1 hour}}' },
            checkedOut: false,
            reminderSent: false
          },
          include: ['user', 'items']
        }
      },
      {
        name: 'Check Cart Has Items',
        type: 'CONDITION',
        order: 2,
        conditions: {
          if: '{{carts.length > 0}}',
          then: 'continue',
          else: 'end'
        }
      },
      {
        name: 'Loop Through Carts',
        type: 'LOOP',
        order: 3,
        config: {
          items: '{{carts}}',
          itemVariable: 'cart'
        }
      },
      {
        name: 'Send Recovery Email',
        type: 'ACTION',
        order: 4,
        config: {
          action: 'sendEmail',
          template: 'cart-abandonment',
          to: '{{cart.user.email}}',
          subject: 'You left something behind!'
        }
      },
      {
        name: 'Mark Reminder Sent',
        type: 'DATABASE',
        order: 5,
        config: {
          operation: 'update',
          model: 'Cart',
          where: { id: '{{cart.id}}' },
          data: { reminderSent: true }
        }
      },
      {
        name: 'Log Completion',
        type: 'END',
        order: 6,
        config: {
          logMessage: 'Processed {{carts.length}} abandoned carts'
        }
      }
    ],
    icon: 'ShoppingCart',
    color: '#F59E0B',
    tags: ['cart', 'recovery', 'email', 'marketing', 'revenue'],
    documentation: `
# Cart Abandonment Recovery Workflow

Automatically reaches out to customers who leave items in their cart without completing purchase.

## Trigger
- **Schedule**: Every 6 hours
- Looks for carts abandoned for more than 1 hour

## Actions
1. Finds all abandoned carts with items
2. Loops through each cart
3. Sends personalized recovery email
4. Marks cart as reminder sent to avoid duplicates

## Customization
- Adjust timing (1 hour, 24 hours, etc.)
- Add discount code for high-value carts
- Set up multi-email sequence (reminder 1, 2, 3)
- Filter by customer segment
    `,
    exampleUseCase: 'A customer adds $200 worth of items to their cart but gets distracted. After 1 hour, they receive a friendly reminder email with their cart items and a link to complete checkout.',
    isSystem: true,
    version: '1.0.0'
  },

  // 3. Low Stock Alert
  {
    name: 'Low Stock Alert',
    slug: 'low-stock-alert',
    description: 'Alert administrators when product inventory falls below threshold.',
    category: 'INVENTORY',
    trigger: 'EVENT',
    triggerConfig: {
      eventType: 'inventory.low',
      filters: {}
    },
    steps: [
      {
        name: 'Inventory Event Trigger',
        type: 'TRIGGER',
        order: 0,
        config: {
          eventType: 'inventory.low'
        }
      },
      {
        name: 'Load Product Details',
        type: 'DATABASE',
        order: 1,
        config: {
          operation: 'findUnique',
          model: 'Product',
          where: { id: '{{event.productId}}' },
          include: ['variants']
        }
      },
      {
        name: 'Check Stock Level',
        type: 'CONDITION',
        order: 2,
        conditions: {
          if: '{{product.stock <= product.lowStockThreshold}}',
          then: 'continue',
          else: 'end'
        }
      },
      {
        name: 'Notify Admin Team',
        type: 'NOTIFICATION',
        order: 3,
        config: {
          channel: 'admin',
          type: 'warning',
          title: 'Low Stock Alert',
          message: '{{product.name}} is running low ({{product.stock}} remaining)'
        }
      },
      {
        name: 'Send Email to Inventory Manager',
        type: 'ACTION',
        order: 4,
        config: {
          action: 'sendEmail',
          template: 'low-stock-alert',
          to: '{{settings.inventoryManagerEmail}}',
          subject: 'Low Stock: {{product.name}}'
        }
      },
      {
        name: 'Log Alert',
        type: 'END',
        order: 5,
        config: {
          logMessage: 'Low stock alert sent for {{product.name}}'
        }
      }
    ],
    icon: 'AlertTriangle',
    color: '#EF4444',
    tags: ['inventory', 'alert', 'notification', 'essential'],
    documentation: `
# Low Stock Alert Workflow

Proactively notifies your team when inventory runs low to prevent stockouts.

## Trigger
- **Event**: \`inventory.low\`
- Fires when product stock falls below threshold

## Actions
1. Loads product details
2. Verifies stock is actually low (double-check)
3. Sends admin notification
4. Emails inventory manager

## Customization
- Set different thresholds per product category
- Add Slack/Discord notification
- Create auto-reorder workflow for critical items
- Add supplier notification step
    `,
    exampleUseCase: 'Your best-selling product drops to 5 units. The workflow immediately alerts the admin dashboard and sends an email to the inventory manager to reorder.',
    isSystem: true,
    version: '1.0.0'
  },

  // 4. Review Moderation
  {
    name: 'Review Moderation',
    slug: 'review-moderation',
    description: 'Automatically moderate product reviews using AI and rules.',
    category: 'REVIEW',
    trigger: 'EVENT',
    triggerConfig: {
      eventType: 'review.created',
      filters: {}
    },
    steps: [
      {
        name: 'Review Submitted Trigger',
        type: 'TRIGGER',
        order: 0,
        config: {
          eventType: 'review.created'
        }
      },
      {
        name: 'Load Review Details',
        type: 'DATABASE',
        order: 1,
        config: {
          operation: 'findUnique',
          model: 'Review',
          where: { id: '{{event.reviewId}}' },
          include: ['user', 'product']
        }
      },
      {
        name: 'Check for Spam Keywords',
        type: 'CONDITION',
        order: 2,
        conditions: {
          if: '{{containsSpam(review.content)}}',
          then: 'flagForReview',
          else: 'checkSentiment'
        }
      },
      {
        name: 'Analyze Sentiment',
        type: 'HTTP',
        order: 3,
        config: {
          action: 'analyzeText',
          provider: 'openai',
          input: '{{review.content}}',
          outputVariable: 'sentiment'
        }
      },
      {
        name: 'Auto-Approve or Flag',
        type: 'CONDITION',
        order: 4,
        conditions: {
          if: '{{sentiment.score >= 0.3 && !sentiment.toxic}}',
          then: 'approve',
          else: 'flagForReview'
        }
      },
      {
        name: 'Approve Review',
        type: 'DATABASE',
        order: 5,
        config: {
          operation: 'update',
          model: 'Review',
          where: { id: '{{review.id}}' },
          data: { status: 'APPROVED', moderatedAt: '{{now}}' }
        }
      },
      {
        name: 'Flag for Manual Review',
        type: 'DATABASE',
        order: 6,
        config: {
          operation: 'update',
          model: 'Review',
          where: { id: '{{review.id}}' },
          data: { status: 'PENDING_REVIEW', flagReason: '{{flagReason}}' }
        }
      },
      {
        name: 'Notify Moderators',
        type: 'NOTIFICATION',
        order: 7,
        config: {
          channel: 'moderators',
          type: 'info',
          title: 'Review Needs Attention',
          message: 'New review for {{product.name}} requires manual review'
        }
      },
      {
        name: 'Log Result',
        type: 'END',
        order: 8,
        config: {
          logMessage: 'Review {{review.id}} processed: {{result}}'
        }
      }
    ],
    icon: 'MessageSquare',
    color: '#8B5CF6',
    tags: ['review', 'moderation', 'ai', 'content'],
    documentation: `
# Review Moderation Workflow

Automatically screens product reviews using AI and rule-based moderation.

## Trigger
- **Event**: \`review.created\`
- Fires when a customer submits a review

## Actions
1. Loads review and product details
2. Checks for spam keywords
3. Analyzes sentiment with AI
4. Auto-approves clean reviews or flags for manual review
5. Notifies moderators when manual review needed

## Customization
- Adjust sentiment threshold
- Add custom spam word list
- Auto-respond to positive reviews
- Reward customers for quality reviews
    `,
    exampleUseCase: 'A customer leaves a 5-star review with helpful content. The AI detects positive sentiment and auto-approves it instantly. Another review contains spam links - it gets flagged for manual review.',
    isSystem: true,
    version: '1.0.0'
  },

  // 5. Shipping Notification
  {
    name: 'Shipping Notification',
    slug: 'shipping-notification',
    description: 'Send shipping updates when order status changes.',
    category: 'SHIPPING',
    trigger: 'EVENT',
    triggerConfig: {
      eventType: 'shipment.updated',
      filters: {}
    },
    steps: [
      {
        name: 'Shipment Update Trigger',
        type: 'TRIGGER',
        order: 0,
        config: {
          eventType: 'shipment.updated'
        }
      },
      {
        name: 'Load Shipment Details',
        type: 'DATABASE',
        order: 1,
        config: {
          operation: 'findUnique',
          model: 'Shipment',
          where: { id: '{{event.shipmentId}}' },
          include: ['order', 'order.user']
        }
      },
      {
        name: 'Check Status Change',
        type: 'CONDITION',
        order: 2,
        conditions: {
          if: '{{shipment.status !== event.previousStatus}}',
          then: 'continue',
          else: 'end'
        }
      },
      {
        name: 'Determine Email Template',
        type: 'TRANSFORM',
        order: 3,
        config: {
          mapping: {
            'LABEL_CREATED': 'shipping-label-created',
            'IN_TRANSIT': 'shipping-in-transit',
            'OUT_FOR_DELIVERY': 'shipping-out-for-delivery',
            'DELIVERED': 'shipping-delivered'
          },
          input: '{{shipment.status}}',
          output: 'emailTemplate'
        }
      },
      {
        name: 'Send Status Email',
        type: 'ACTION',
        order: 4,
        config: {
          action: 'sendEmail',
          template: '{{emailTemplate}}',
          to: '{{shipment.order.user.email}}',
          subject: 'Shipping Update for Order #{{shipment.order.orderNumber}}'
        }
      },
      {
        name: 'Send SMS for Delivery',
        type: 'CONDITION',
        order: 5,
        conditions: {
          if: '{{shipment.status === "OUT_FOR_DELIVERY" || shipment.status === "DELIVERED"}}',
          then: 'sendSms',
          else: 'end'
        }
      },
      {
        name: 'Send SMS Notification',
        type: 'ACTION',
        order: 6,
        config: {
          action: 'sendSms',
          to: '{{shipment.order.user.phone}}',
          message: 'Your order #{{shipment.order.orderNumber}} is {{statusMessage}}!'
        }
      },
      {
        name: 'Log Notification',
        type: 'END',
        order: 7,
        config: {
          logMessage: 'Shipping notification sent for {{shipment.trackingNumber}}'
        }
      }
    ],
    icon: 'Truck',
    color: '#3B82F6',
    tags: ['shipping', 'notification', 'email', 'sms', 'essential'],
    documentation: `
# Shipping Notification Workflow

Keeps customers informed with real-time shipping updates via email and SMS.

## Trigger
- **Event**: \`shipment.updated\`
- Fires when shipping status changes

## Actions
1. Loads shipment and order details
2. Determines appropriate email template
3. Sends email notification
4. Sends SMS for critical updates (out for delivery, delivered)

## Customization
- Adjust which statuses trigger notifications
- Enable/disable SMS
- Add push notifications
- Include product images in emails
    `,
    exampleUseCase: 'An order ships and the tracking shows "Out for Delivery". The customer receives both an email and SMS letting them know their package will arrive today.',
    isSystem: true,
    version: '1.0.0'
  },

  // 6. Refund Processing
  {
    name: 'Refund Processing',
    slug: 'refund-processing',
    description: 'Automate refund approval and processing workflow.',
    category: 'ORDER',
    trigger: 'EVENT',
    triggerConfig: {
      eventType: 'refund.requested',
      filters: {}
    },
    steps: [
      {
        name: 'Refund Request Trigger',
        type: 'TRIGGER',
        order: 0,
        config: {
          eventType: 'refund.requested'
        }
      },
      {
        name: 'Load Refund Details',
        type: 'DATABASE',
        order: 1,
        config: {
          operation: 'findUnique',
          model: 'Refund',
          where: { id: '{{event.refundId}}' },
          include: ['order', 'order.user', 'order.items']
        }
      },
      {
        name: 'Check Auto-Approval Rules',
        type: 'CONDITION',
        order: 2,
        conditions: {
          if: '{{refund.amount <= settings.autoApproveLimit && order.daysSincePurchase <= 30}}',
          then: 'autoApprove',
          else: 'manualReview'
        }
      },
      {
        name: 'Process Refund via Stripe',
        type: 'HTTP',
        order: 3,
        config: {
          provider: 'stripe',
          action: 'createRefund',
          paymentIntentId: '{{order.stripePaymentIntentId}}',
          amount: '{{refund.amount}}'
        }
      },
      {
        name: 'Update Refund Status',
        type: 'DATABASE',
        order: 4,
        config: {
          operation: 'update',
          model: 'Refund',
          where: { id: '{{refund.id}}' },
          data: { status: 'PROCESSED', processedAt: '{{now}}' }
        }
      },
      {
        name: 'Send Refund Confirmation',
        type: 'ACTION',
        order: 5,
        config: {
          action: 'sendEmail',
          template: 'refund-processed',
          to: '{{order.user.email}}',
          subject: 'Your refund has been processed'
        }
      },
      {
        name: 'Flag for Manual Review',
        type: 'DATABASE',
        order: 6,
        config: {
          operation: 'update',
          model: 'Refund',
          where: { id: '{{refund.id}}' },
          data: { status: 'PENDING_REVIEW' }
        }
      },
      {
        name: 'Notify Admin',
        type: 'NOTIFICATION',
        order: 7,
        config: {
          channel: 'admin',
          type: 'warning',
          title: 'Refund Needs Review',
          message: 'Refund request for ${{refund.amount}} requires approval'
        }
      },
      {
        name: 'Log Result',
        type: 'END',
        order: 8,
        config: {
          logMessage: 'Refund {{refund.id}} processed: {{result}}'
        }
      }
    ],
    icon: 'DollarSign',
    color: '#10B981',
    tags: ['refund', 'order', 'payment', 'automation'],
    documentation: `
# Refund Processing Workflow

Automates refund approval based on rules, with escalation for edge cases.

## Trigger
- **Event**: \`refund.requested\`
- Fires when customer requests a refund

## Actions
1. Loads refund and order details
2. Checks auto-approval rules (amount, days since purchase)
3. Auto-approves small refunds within return window
4. Processes via Stripe and sends confirmation
5. Escalates large/old refunds to admin

## Customization
- Adjust auto-approval threshold
- Set return window (30 days, 60 days)
- Add fraud detection
- Require reason for large refunds
    `,
    exampleUseCase: 'A customer requests a $25 refund 5 days after purchase. Since it is under the $50 auto-approve limit and within 30 days, the refund is processed automatically and the customer receives confirmation within minutes.',
    isSystem: true,
    version: '1.0.0'
  },

  // 7. Welcome Series
  {
    name: 'Welcome Series',
    slug: 'welcome-series',
    description: 'Send a series of welcome emails to new customers.',
    category: 'CUSTOMER',
    trigger: 'EVENT',
    triggerConfig: {
      eventType: 'user.created',
      filters: {}
    },
    steps: [
      {
        name: 'New User Trigger',
        type: 'TRIGGER',
        order: 0,
        config: {
          eventType: 'user.created'
        }
      },
      {
        name: 'Load User Details',
        type: 'DATABASE',
        order: 1,
        config: {
          operation: 'findUnique',
          model: 'User',
          where: { id: '{{event.userId}}' }
        }
      },
      {
        name: 'Send Welcome Email',
        type: 'ACTION',
        order: 2,
        config: {
          action: 'sendEmail',
          template: 'welcome-email',
          to: '{{user.email}}',
          subject: 'Welcome to {{settings.storeName}}!'
        }
      },
      {
        name: 'Wait 2 Days',
        type: 'DELAY',
        order: 3,
        config: {
          duration: 172800000, // 2 days in ms
          unit: 'milliseconds'
        }
      },
      {
        name: 'Send Getting Started Email',
        type: 'ACTION',
        order: 4,
        config: {
          action: 'sendEmail',
          template: 'getting-started',
          to: '{{user.email}}',
          subject: 'Getting started with {{settings.storeName}}'
        }
      },
      {
        name: 'Wait 5 Days',
        type: 'DELAY',
        order: 5,
        config: {
          duration: 432000000, // 5 days in ms
          unit: 'milliseconds'
        }
      },
      {
        name: 'Check First Purchase',
        type: 'DATABASE',
        order: 6,
        config: {
          operation: 'findFirst',
          model: 'Order',
          where: { userId: '{{user.id}}' }
        }
      },
      {
        name: 'Branch Based on Purchase',
        type: 'CONDITION',
        order: 7,
        conditions: {
          if: '{{order === null}}',
          then: 'sendIncentive',
          else: 'end'
        }
      },
      {
        name: 'Send First Purchase Incentive',
        type: 'ACTION',
        order: 8,
        config: {
          action: 'sendEmail',
          template: 'first-purchase-incentive',
          to: '{{user.email}}',
          subject: 'A special offer just for you!'
        }
      },
      {
        name: 'Log Completion',
        type: 'END',
        order: 9,
        config: {
          logMessage: 'Welcome series completed for {{user.email}}'
        }
      }
    ],
    icon: 'UserPlus',
    color: '#EC4899',
    tags: ['welcome', 'onboarding', 'email', 'marketing'],
    documentation: `
# Welcome Series Workflow

Nurtures new users with a timed email sequence to drive first purchase.

## Trigger
- **Event**: \`user.created\`
- Fires when a new user signs up

## Actions
1. Sends immediate welcome email
2. Waits 2 days, sends getting started guide
3. Waits 5 more days, checks if user made a purchase
4. If no purchase, sends incentive offer

## Customization
- Adjust timing between emails
- Add more emails to the sequence
- Personalize offers based on browsing history
- Skip users who unsubscribe
    `,
    exampleUseCase: 'A new user signs up but does not buy anything. They receive a welcome email immediately, a tips email after 2 days, and a 15% off coupon after 7 days to encourage their first purchase.',
    isSystem: true,
    version: '1.0.0'
  },

  // 8. Subscription Lifecycle
  {
    name: 'Subscription Lifecycle',
    slug: 'subscription-lifecycle',
    description: 'Manage subscription events like renewals, cancellations, and payment failures.',
    category: 'SUBSCRIPTION',
    trigger: 'EVENT',
    triggerConfig: {
      eventType: 'subscription.*',
      filters: {}
    },
    steps: [
      {
        name: 'Subscription Event Trigger',
        type: 'TRIGGER',
        order: 0,
        config: {
          eventTypes: [
            'subscription.created',
            'subscription.renewed',
            'subscription.cancelled',
            'subscription.payment_failed'
          ]
        }
      },
      {
        name: 'Load Subscription Details',
        type: 'DATABASE',
        order: 1,
        config: {
          operation: 'findUnique',
          model: 'Subscription',
          where: { id: '{{event.subscriptionId}}' },
          include: ['user', 'plan']
        }
      },
      {
        name: 'Route by Event Type',
        type: 'CONDITION',
        order: 2,
        conditions: {
          switch: '{{event.type}}',
          cases: {
            'subscription.created': 'handleCreated',
            'subscription.renewed': 'handleRenewed',
            'subscription.cancelled': 'handleCancelled',
            'subscription.payment_failed': 'handlePaymentFailed'
          }
        }
      },
      {
        name: 'Handle Created - Welcome',
        type: 'ACTION',
        order: 3,
        config: {
          action: 'sendEmail',
          template: 'subscription-welcome',
          to: '{{subscription.user.email}}',
          subject: 'Welcome to {{subscription.plan.name}}!'
        }
      },
      {
        name: 'Handle Renewed - Thanks',
        type: 'ACTION',
        order: 4,
        config: {
          action: 'sendEmail',
          template: 'subscription-renewed',
          to: '{{subscription.user.email}}',
          subject: 'Thanks for staying with us!'
        }
      },
      {
        name: 'Handle Cancelled - Feedback',
        type: 'ACTION',
        order: 5,
        config: {
          action: 'sendEmail',
          template: 'subscription-cancelled',
          to: '{{subscription.user.email}}',
          subject: 'We are sorry to see you go'
        }
      },
      {
        name: 'Handle Payment Failed - Dunning',
        type: 'ACTION',
        order: 6,
        config: {
          action: 'sendEmail',
          template: 'payment-failed',
          to: '{{subscription.user.email}}',
          subject: 'Action required: Payment failed'
        }
      },
      {
        name: 'Update Analytics',
        type: 'DATABASE',
        order: 7,
        config: {
          operation: 'create',
          model: 'AnalyticsEvent',
          data: {
            eventType: 'subscription.{{event.type}}',
            userId: '{{subscription.userId}}',
            metadata: '{{event}}'
          }
        }
      },
      {
        name: 'Log Event',
        type: 'END',
        order: 8,
        config: {
          logMessage: 'Subscription event {{event.type}} handled for {{subscription.user.email}}'
        }
      }
    ],
    icon: 'RefreshCw',
    color: '#6366F1',
    tags: ['subscription', 'lifecycle', 'email', 'payment'],
    documentation: `
# Subscription Lifecycle Workflow

Handles all subscription events with appropriate communications and actions.

## Trigger
- **Event**: \`subscription.*\` (wildcard)
- Handles: created, renewed, cancelled, payment_failed

## Actions
1. Routes to appropriate handler based on event type
2. Sends relevant email to subscriber
3. Updates analytics
4. Handles payment failures with dunning sequence

## Customization
- Customize email templates for each event
- Add win-back offers for cancellations
- Set up dunning cadence for failed payments
- Add Slack notifications for team
    `,
    exampleUseCase: 'A subscriber payment fails due to expired card. They receive a friendly email with a link to update payment info, preventing involuntary churn.',
    isSystem: true,
    version: '1.0.0'
  }
]

export async function seedWorkflowTemplates() {
  console.log('Seeding workflow templates...')

  for (const template of workflowTemplates) {
    const existing = await prisma.workflowTemplate.findUnique({
      where: { slug: template.slug }
    })

    if (existing) {
      console.log(`  Updating: ${template.name}`)
      await prisma.workflowTemplate.update({
        where: { slug: template.slug },
        data: {
          name: template.name,
          description: template.description,
          category: template.category,
          trigger: template.trigger,
          triggerConfig: (template.triggerConfig ?? {}) as any,
          steps: template.steps as any,
          icon: template.icon,
          color: template.color,
          tags: template.tags,
          documentation: template.documentation,
          exampleUseCase: template.exampleUseCase,
          isSystem: template.isSystem,
          version: template.version
        }
      })
    } else {
      console.log(`  Creating: ${template.name}`)
      await prisma.workflowTemplate.create({
        data: {
          name: template.name,
          slug: template.slug,
          description: template.description,
          category: template.category,
          trigger: template.trigger,
          triggerConfig: (template.triggerConfig ?? {}) as any,
          steps: template.steps as any,
          icon: template.icon,
          color: template.color,
          tags: template.tags,
          documentation: template.documentation,
          exampleUseCase: template.exampleUseCase,
          isSystem: template.isSystem,
          version: template.version
        }
      })
    }
  }

  console.log(`Seeded ${workflowTemplates.length} workflow templates`)
}

// Run directly if called from command line
if (require.main === module) {
  seedWorkflowTemplates()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error seeding workflow templates:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}

export default seedWorkflowTemplates
