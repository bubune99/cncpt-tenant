/**
 * Email Primitives
 *
 * Primitives for email sending, subscriptions, and preference management.
 */

import type { CreatePrimitiveRequest } from '../types';

export const EMAIL_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // EMAIL SENDING
  // ============================================================================
  {
    name: 'email.send',
    description: 'Send an email to one or more recipients.',
    category: 'email',
    tags: ['email', 'send', 'notification'],
    icon: 'Mail',
    timeout: 30000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'array',
          description: 'Recipient email addresses',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              name: { type: 'string' },
            },
            required: ['email'],
          },
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
        },
        html: {
          type: 'string',
          description: 'HTML email body',
        },
        text: {
          type: 'string',
          description: 'Plain text email body',
        },
        from: {
          type: 'object',
          description: 'Sender (optional, uses default if not provided)',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
        replyTo: {
          type: 'object',
          description: 'Reply-to address',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
      required: ['to', 'subject'],
    },
    handler: `
      const { sendEmail } = await import('@/lib/email');

      const toArray = Array.isArray(args.to) ? args.to : [args.to];

      const results = [];
      for (const recipient of toArray) {
        const result = await sendEmail({
          to: recipient,
          subject: args.subject,
          html: args.html,
          text: args.text,
          from: args.from,
          replyTo: args.replyTo,
        });
        results.push({
          email: recipient.email,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        });
      }

      return {
        success: results.every(r => r.success),
        results,
      };
    `,
  },
  {
    name: 'email.sendTemplate',
    description: 'Send an email using a saved template with merge tags.',
    category: 'email',
    tags: ['email', 'template', 'merge-tags'],
    icon: 'FileText',
    timeout: 30000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'string',
          description: 'Email template ID',
        },
        to: {
          type: 'object',
          description: 'Recipient',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['email'],
        },
        data: {
          type: 'object',
          description: 'Merge tag data (e.g., { firstName: "John", orderNumber: "12345" })',
        },
        from: {
          type: 'object',
          description: 'Sender (optional)',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
      required: ['templateId', 'to'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');
      const { sendEmailWithMergeTags } = await import('@/lib/email');

      // Get template
      const template = await prisma.emailTemplate.findUnique({
        where: { id: args.templateId },
      });

      if (!template) {
        throw new Error('Email template not found');
      }

      if (!template.isActive) {
        throw new Error('Email template is not active');
      }

      const result = await sendEmailWithMergeTags(
        {
          to: args.to,
          subjectTemplate: template.subject,
          htmlTemplate: template.htmlContent || undefined,
          textTemplate: template.textContent || undefined,
          from: args.from,
        },
        args.data || {}
      );

      return {
        success: result.success,
        messageId: result.messageId,
        template: template.name,
      };
    `,
  },

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================
  {
    name: 'email.subscribe',
    description: 'Subscribe an email address to the mailing list.',
    category: 'email',
    tags: ['email', 'subscribe', 'newsletter'],
    icon: 'UserPlus',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address to subscribe',
        },
        firstName: {
          type: 'string',
          description: 'Subscriber first name',
        },
        lastName: {
          type: 'string',
          description: 'Subscriber last name',
        },
        lists: {
          type: 'array',
          description: 'List IDs to subscribe to (default: newsletter)',
          items: { type: 'string' },
        },
        source: {
          type: 'string',
          description: 'Subscription source (e.g., "checkout", "popup", "footer")',
        },
        requireDoubleOptIn: {
          type: 'boolean',
          description: 'Require double opt-in confirmation (default: true)',
          default: true,
        },
      },
      required: ['email'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');
      const { createSubscription, sendConfirmationEmail } = await import('@/lib/email/subscriptions');

      const lists = args.lists || ['newsletter'];
      const requireDoubleOptIn = args.requireDoubleOptIn !== false;

      // Check for existing subscriber
      let subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      if (subscriber) {
        if (subscriber.status === 'UNSUBSCRIBED') {
          // Resubscribe
          subscriber = await prisma.emailSubscriber.update({
            where: { id: subscriber.id },
            data: {
              status: requireDoubleOptIn ? 'PENDING' : 'SUBSCRIBED',
              firstName: args.firstName || subscriber.firstName,
              lastName: args.lastName || subscriber.lastName,
              unsubscribedAt: null,
            },
          });
        } else if (subscriber.status === 'SUBSCRIBED') {
          return { success: true, message: 'Already subscribed', subscriber };
        }
      } else {
        // Create new subscriber
        subscriber = await prisma.emailSubscriber.create({
          data: {
            email: args.email.toLowerCase(),
            firstName: args.firstName,
            lastName: args.lastName,
            status: requireDoubleOptIn ? 'PENDING' : 'SUBSCRIBED',
            source: args.source || 'api',
            lists,
          },
        });
      }

      // Send confirmation email if double opt-in
      if (requireDoubleOptIn) {
        await sendConfirmationEmail(subscriber.id);
        return {
          success: true,
          message: 'Confirmation email sent',
          requiresConfirmation: true,
          subscriber
        };
      }

      return { success: true, message: 'Subscribed successfully', subscriber };
    `,
  },
  {
    name: 'email.unsubscribe',
    description: 'Unsubscribe an email address from the mailing list.',
    category: 'email',
    tags: ['email', 'unsubscribe'],
    icon: 'UserMinus',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address to unsubscribe',
        },
        reason: {
          type: 'string',
          description: 'Unsubscribe reason',
        },
        lists: {
          type: 'array',
          description: 'Specific list IDs to unsubscribe from (empty = all)',
          items: { type: 'string' },
        },
      },
      required: ['email'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      const subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      if (!subscriber) {
        return { success: true, message: 'Email not found in list' };
      }

      if (args.lists && args.lists.length > 0) {
        // Unsubscribe from specific lists
        const remainingLists = (subscriber.lists || []).filter(
          l => !args.lists.includes(l)
        );

        if (remainingLists.length === 0) {
          // No lists left, fully unsubscribe
          await prisma.emailSubscriber.update({
            where: { id: subscriber.id },
            data: {
              status: 'UNSUBSCRIBED',
              unsubscribedAt: new Date(),
              unsubscribeReason: args.reason,
              lists: [],
            },
          });
        } else {
          await prisma.emailSubscriber.update({
            where: { id: subscriber.id },
            data: { lists: remainingLists },
          });
        }
      } else {
        // Unsubscribe from all
        await prisma.emailSubscriber.update({
          where: { id: subscriber.id },
          data: {
            status: 'UNSUBSCRIBED',
            unsubscribedAt: new Date(),
            unsubscribeReason: args.reason,
            lists: [],
          },
        });
      }

      return { success: true, message: 'Unsubscribed successfully' };
    `,
  },
  {
    name: 'email.updatePreferences',
    description: 'Update email subscription preferences for a subscriber.',
    category: 'email',
    tags: ['email', 'preferences', 'settings'],
    icon: 'Settings',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Subscriber email address',
        },
        lists: {
          type: 'array',
          description: 'List IDs to subscribe to',
          items: { type: 'string' },
        },
        frequency: {
          type: 'string',
          description: 'Email frequency preference',
          enum: ['instant', 'daily', 'weekly', 'monthly'],
        },
        firstName: {
          type: 'string',
          description: 'Update first name',
        },
        lastName: {
          type: 'string',
          description: 'Update last name',
        },
      },
      required: ['email'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      const subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      if (!subscriber) {
        throw new Error('Subscriber not found');
      }

      const updateData = {};

      if (args.lists !== undefined) {
        updateData.lists = args.lists;
      }
      if (args.frequency !== undefined) {
        updateData.preferences = {
          ...(subscriber.preferences || {}),
          frequency: args.frequency,
        };
      }
      if (args.firstName !== undefined) {
        updateData.firstName = args.firstName;
      }
      if (args.lastName !== undefined) {
        updateData.lastName = args.lastName;
      }

      const updated = await prisma.emailSubscriber.update({
        where: { id: subscriber.id },
        data: updateData,
      });

      return { success: true, subscriber: updated };
    `,
  },
  {
    name: 'email.getSubscriptionStatus',
    description: 'Get the subscription status for an email address.',
    category: 'email',
    tags: ['email', 'status', 'subscription'],
    icon: 'Info',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address to check',
        },
      },
      required: ['email'],
    },
    handler: `
      const { prisma } = await import('@/lib/db');

      const subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: args.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          lists: true,
          preferences: true,
          subscribedAt: true,
          unsubscribedAt: true,
          source: true,
        },
      });

      if (!subscriber) {
        return {
          subscribed: false,
          status: 'NOT_FOUND',
        };
      }

      return {
        subscribed: subscriber.status === 'SUBSCRIBED',
        status: subscriber.status,
        subscriber,
      };
    `,
  },
];
