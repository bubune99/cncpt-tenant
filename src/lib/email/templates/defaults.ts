/**
 * Default Email Template Definitions
 *
 * These are the default Puck-based email templates that can be seeded
 * and customized by users through the admin panel.
 */

import type { EmailTemplateCategory } from '@prisma/client';

export interface DefaultEmailTemplate {
  slug: string;
  name: string;
  description: string;
  category: EmailTemplateCategory;
  subject: string;
  preheader?: string;
  content: {
    content: Array<{
      type: string;
      props: Record<string, unknown>;
    }>;
    root?: {
      props?: Record<string, unknown>;
    };
  };
}

/**
 * Default transactional email templates
 */
export const defaultEmailTemplates: DefaultEmailTemplate[] = [
  // Order Confirmation
  {
    slug: 'order-confirmation',
    name: 'Order Confirmation',
    description: 'Sent when a customer places an order',
    category: 'TRANSACTIONAL',
    subject: 'Order Confirmation #{{order.orderNumber}}',
    preheader: 'Thank you for your order! Your order #{{order.orderNumber}} has been confirmed.',
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: 'Thank you for your order!', level: 'h1' },
        },
        {
          type: 'Text',
          props: { text: 'Hi {{customer.name}},' },
        },
        {
          type: 'Text',
          props: {
            text: "We've received your order and it's being processed. You'll receive another email when your order ships.",
          },
        },
        {
          type: 'Card',
          props: {
            content: {
              content: [
                {
                  type: 'Text',
                  props: { text: '<strong>Order #{{order.orderNumber}}</strong>' },
                },
                {
                  type: 'Text',
                  props: { text: 'Placed on {{order.createdAt|date}}' },
                },
              ],
            },
          },
        },
        {
          type: 'Button',
          props: {
            label: 'View Order',
            url: '{{store.url}}/account/orders/{{order.id}}',
            color: '#000000',
          },
        },
        {
          type: 'Heading',
          props: { text: 'Order Details', level: 'h2' },
        },
        {
          type: 'OrderSummary',
          props: { dataKey: 'order.items' },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Heading',
          props: { text: 'Shipping Address', level: 'h2' },
        },
        {
          type: 'Text',
          props: {
            text: '{{order.shippingAddress.name}}<br>{{order.shippingAddress.line1}}<br>{{order.shippingAddress.city}}, {{order.shippingAddress.state}} {{order.shippingAddress.postalCode}}',
          },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Text',
          props: {
            text: "If you have any questions about your order, please don't hesitate to contact our support team.",
          },
        },
      ],
    },
  },

  // Shipping Notification
  {
    slug: 'shipping-notification',
    name: 'Shipping Notification',
    description: 'Sent when an order has shipped',
    category: 'TRANSACTIONAL',
    subject: 'Your order #{{order.orderNumber}} has shipped!',
    preheader: 'Great news! Your order is on its way.',
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: 'Your order has shipped!', level: 'h1' },
        },
        {
          type: 'Text',
          props: { text: 'Hi {{customer.name}},' },
        },
        {
          type: 'Text',
          props: {
            text: 'Great news! Your order #{{order.orderNumber}} is on its way to you.',
          },
        },
        {
          type: 'Card',
          props: {
            content: {
              content: [
                {
                  type: 'Text',
                  props: { text: '<strong>Carrier:</strong> {{shipment.carrierName}}' },
                },
                {
                  type: 'Text',
                  props: { text: '<strong>Tracking Number:</strong> {{shipment.trackingNumber}}' },
                },
              ],
            },
          },
        },
        {
          type: 'Button',
          props: {
            label: 'Track Your Package',
            url: '{{shipment.trackingUrl}}',
            color: '#000000',
          },
        },
        {
          type: 'Heading',
          props: { text: 'Items in This Shipment', level: 'h2' },
        },
        {
          type: 'OrderSummary',
          props: { dataKey: 'order.items' },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Heading',
          props: { text: 'Shipping To', level: 'h2' },
        },
        {
          type: 'Text',
          props: {
            text: '{{shipment.shippingAddress.name}}<br>{{shipment.shippingAddress.line1}}<br>{{shipment.shippingAddress.city}}, {{shipment.shippingAddress.state}} {{shipment.shippingAddress.postalCode}}',
          },
        },
      ],
    },
  },

  // Delivery Confirmation
  {
    slug: 'delivery-confirmation',
    name: 'Delivery Confirmation',
    description: 'Sent when an order has been delivered',
    category: 'TRANSACTIONAL',
    subject: 'Your order #{{order.orderNumber}} has been delivered!',
    preheader: 'Your package has arrived!',
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: 'Your order has been delivered!', level: 'h1' },
        },
        {
          type: 'Text',
          props: { text: 'Hi {{customer.name}},' },
        },
        {
          type: 'Text',
          props: {
            text: 'Great news! Your order #{{order.orderNumber}} has been delivered.',
          },
        },
        {
          type: 'Card',
          props: {
            content: {
              content: [
                {
                  type: 'Text',
                  props: { text: '<strong>Delivered on:</strong> {{delivery.deliveredAt|date}}' },
                },
              ],
            },
          },
        },
        {
          type: 'Text',
          props: {
            text: "We hope you love your purchase! If you have any questions or concerns, please don't hesitate to reach out.",
          },
        },
        {
          type: 'Button',
          props: {
            label: 'Leave a Review',
            url: '{{store.url}}/account/orders/{{order.id}}/review',
            color: '#000000',
          },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Heading',
          props: { text: 'Items Delivered', level: 'h2' },
        },
        {
          type: 'OrderSummary',
          props: { dataKey: 'order.items' },
        },
      ],
    },
  },

  // Refund Notification
  {
    slug: 'refund-notification',
    name: 'Refund Notification',
    description: 'Sent when a refund has been processed',
    category: 'TRANSACTIONAL',
    subject: 'Refund processed for order #{{order.orderNumber}}',
    preheader: 'Your refund of {{refund.amount|currency}} has been processed.',
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: 'Your refund has been processed', level: 'h1' },
        },
        {
          type: 'Text',
          props: { text: 'Hi {{customer.name}},' },
        },
        {
          type: 'Text',
          props: {
            text: 'We have processed a refund for your order #{{order.orderNumber}}.',
          },
        },
        {
          type: 'Card',
          props: {
            content: {
              content: [
                {
                  type: 'Text',
                  props: { text: '<strong>Refund Amount:</strong> {{refund.amount|currency}}' },
                },
                {
                  type: 'Text',
                  props: { text: '<strong>Refund Type:</strong> {{refund.type}}' },
                },
                {
                  type: 'Text',
                  props: { text: '<strong>Estimated Arrival:</strong> {{refund.estimatedArrival}}' },
                },
              ],
            },
          },
        },
        {
          type: 'Text',
          props: {
            text: 'The refund will be credited to your original payment method. Please allow 5-10 business days for the refund to appear in your account.',
          },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Text',
          props: {
            text: 'If you have any questions about this refund, please contact our support team.',
          },
        },
      ],
    },
  },

  // Welcome Email
  {
    slug: 'welcome',
    name: 'Welcome Email',
    description: 'Sent when a new user registers',
    category: 'TRANSACTIONAL',
    subject: 'Welcome to {{store.name}}!',
    preheader: "Thanks for joining us! Here's what you can do next.",
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: 'Welcome to {{store.name}}!', level: 'h1' },
        },
        {
          type: 'Text',
          props: { text: 'Hi {{user.firstName}},' },
        },
        {
          type: 'Text',
          props: {
            text: "Thank you for creating an account with us. We're excited to have you as part of our community!",
          },
        },
        {
          type: 'Button',
          props: {
            label: 'Start Shopping',
            url: '{{store.url}}/products',
            color: '#000000',
          },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Heading',
          props: { text: 'What you can do now:', level: 'h2' },
        },
        {
          type: 'Text',
          props: {
            text: '- Browse our latest products<br>- Save items to your wishlist<br>- Track your orders<br>- Get exclusive member discounts',
          },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Text',
          props: {
            text: "If you have any questions, we're here to help!",
          },
        },
      ],
    },
  },

  // Password Reset
  {
    slug: 'password-reset',
    name: 'Password Reset',
    description: 'Sent when a user requests a password reset',
    category: 'TRANSACTIONAL',
    subject: 'Reset your {{store.name}} password',
    preheader: 'Click to reset your password. This link expires in 1 hour.',
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: 'Reset Your Password', level: 'h1' },
        },
        {
          type: 'Text',
          props: { text: 'Hi {{user.firstName}},' },
        },
        {
          type: 'Text',
          props: {
            text: "We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.",
          },
        },
        {
          type: 'Button',
          props: {
            label: 'Reset Password',
            url: '{{resetUrl}}',
            color: '#000000',
          },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Text',
          props: {
            text: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
          },
        },
        {
          type: 'Text',
          props: {
            text: "For security, this link will expire in 1 hour.",
          },
        },
      ],
    },
  },

  // Cart Abandonment
  {
    slug: 'cart-abandonment',
    name: 'Cart Abandonment',
    description: 'Sent when a customer abandons their cart',
    category: 'MARKETING',
    subject: "You left something behind at {{store.name}}",
    preheader: 'Complete your purchase before items sell out!',
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: "Don't forget your items!", level: 'h1' },
        },
        {
          type: 'Text',
          props: { text: 'Hi {{customer.name}},' },
        },
        {
          type: 'Text',
          props: {
            text: "We noticed you left some great items in your cart. They're still waiting for you!",
          },
        },
        {
          type: 'Heading',
          props: { text: 'Your Cart', level: 'h2' },
        },
        {
          type: 'OrderSummary',
          props: { dataKey: 'cart.items' },
        },
        {
          type: 'Button',
          props: {
            label: 'Complete Your Order',
            url: '{{cart.recoveryUrl}}',
            color: '#000000',
          },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Text',
          props: {
            text: 'Questions? Reply to this email or contact our support team. We\'re happy to help!',
          },
        },
      ],
    },
  },

  // Form Notification Default
  {
    slug: 'form-notification-default',
    name: 'Form Notification (Default)',
    description: 'Default template for form submission notifications',
    category: 'TRANSACTIONAL',
    subject: 'New Submission: {{form.name}}',
    preheader: 'A new form submission has been received.',
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: 'New Form Submission: {{form.name}}', level: 'h1' },
        },
        {
          type: 'Text',
          props: { text: 'A new submission has been received.' },
        },
        {
          type: 'Heading',
          props: { text: 'Submission Details', level: 'h2' },
        },
        {
          type: 'SubmissionData',
          props: { dataKey: 'submission.fields' },
        },
        {
          type: 'Button',
          props: {
            label: 'View Submission',
            url: '{{viewUrl}}',
            color: '#000000',
          },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Text',
          props: {
            text: 'Submission ID: {{submission.id}}<br>Received: {{currentYear}}',
          },
        },
      ],
    },
  },

  // Back in Stock Notification
  {
    slug: 'back-in-stock',
    name: 'Back in Stock',
    description: 'Sent when a product is back in stock',
    category: 'MARKETING',
    subject: '{{product.name}} is back in stock!',
    preheader: 'The item you wanted is available again.',
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: "It's Back!", level: 'h1' },
        },
        {
          type: 'Text',
          props: { text: 'Hi there,' },
        },
        {
          type: 'Text',
          props: {
            text: 'Great news! <strong>{{product.name}}</strong> is back in stock.',
          },
        },
        {
          type: 'Image',
          props: {
            src: '{{product.imageUrl}}',
            alt: '{{product.name}}',
            width: '300',
          },
        },
        {
          type: 'Text',
          props: { text: '{{product.price|currency}}' },
        },
        {
          type: 'Button',
          props: {
            label: 'Shop Now',
            url: '{{product.url}}',
            color: '#000000',
          },
        },
        {
          type: 'Divider',
          props: {},
        },
        {
          type: 'Text',
          props: {
            text: "Don't wait - popular items sell out quickly!",
          },
        },
      ],
    },
  },

  // Low Stock Alert (Admin)
  {
    slug: 'low-stock-alert',
    name: 'Low Stock Alert',
    description: 'Sent to admins when inventory is low',
    category: 'TRANSACTIONAL',
    subject: 'Low Stock Alert: {{product.name}}',
    preheader: 'Inventory is running low. Time to restock!',
    content: {
      content: [
        {
          type: 'Heading',
          props: { text: 'Low Stock Alert', level: 'h1' },
        },
        {
          type: 'Text',
          props: {
            text: 'The following product is running low on inventory and may need restocking:',
          },
        },
        {
          type: 'Card',
          props: {
            content: {
              content: [
                {
                  type: 'Text',
                  props: { text: '<strong>Product:</strong> {{product.name}}' },
                },
                {
                  type: 'Text',
                  props: { text: '<strong>SKU:</strong> {{product.sku}}' },
                },
                {
                  type: 'Text',
                  props: { text: '<strong>Current Stock:</strong> {{product.stock}}' },
                },
                {
                  type: 'Text',
                  props: { text: '<strong>Low Stock Threshold:</strong> {{product.threshold}}' },
                },
              ],
            },
          },
        },
        {
          type: 'Button',
          props: {
            label: 'Manage Inventory',
            url: '{{store.url}}/admin/products/{{product.id}}',
            color: '#000000',
          },
        },
      ],
    },
  },
];

/**
 * Get template slugs by category
 */
export function getTemplatesByCategory(category: EmailTemplateCategory): DefaultEmailTemplate[] {
  return defaultEmailTemplates.filter((t) => t.category === category);
}

/**
 * Get a specific template by slug
 */
export function getDefaultTemplate(slug: string): DefaultEmailTemplate | undefined {
  return defaultEmailTemplates.find((t) => t.slug === slug);
}
