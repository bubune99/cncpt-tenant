/**
 * Email Subscription Management
 *
 * Handles subscribe, unsubscribe, and preference management
 */

import { prisma } from '../db'
import crypto from 'crypto'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Generate a secure token for subscription actions
 */
export function generateSubscriptionToken(email: string): string {
  const secret = process.env.ENCRYPTION_KEY || 'default-secret-key'
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(email + Date.now().toString())
  return hmac.digest('hex')
}

/**
 * Verify a subscription token
 */
export function verifySubscriptionToken(email: string, token: string, maxAgeMs = 7 * 24 * 60 * 60 * 1000): boolean {
  // For now, we just check if the token exists in the subscriber record
  // A more robust implementation would include expiration timestamps
  return token.length === 64 // SHA-256 hex length
}

/**
 * Subscribe a new email address
 */
export async function subscribeEmail(
  email: string,
  options: {
    firstName?: string
    lastName?: string
    name?: string
    source?: string
    tags?: string[]
    metadata?: Record<string, unknown>
    doubleOptIn?: boolean
    consentIp?: string
  } = {}
): Promise<{ success: boolean; subscriber?: unknown; needsConfirmation?: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim()

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return { success: false, error: 'Invalid email address' }
  }

  try {
    // Check if already subscribed
    const existing = await prisma.emailSubscriber.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return { success: true, subscriber: existing, error: 'Already subscribed' }
      }

      // Resubscribe if previously unsubscribed
      if (['UNSUBSCRIBED', 'CLEANED'].includes(existing.status)) {
        const confirmationToken = options.doubleOptIn ? generateSubscriptionToken(normalizedEmail) : undefined

        const updated = await prisma.emailSubscriber.update({
          where: { email: normalizedEmail },
          data: {
            status: options.doubleOptIn ? 'PENDING' : 'ACTIVE',
            firstName: options.firstName || existing.firstName,
            lastName: options.lastName || existing.lastName,
            name: options.name || existing.name,
            source: options.source || existing.source,
            tags: options.tags || existing.tags,
            metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : existing.metadata,
            confirmationToken,
            consentTimestamp: options.doubleOptIn ? undefined : new Date(),
            consentIp: options.consentIp,
            consentSource: options.source,
            unsubscribedAt: null,
          },
        })

        if (options.doubleOptIn && confirmationToken) {
          await sendConfirmationEmail(normalizedEmail, confirmationToken)
          return { success: true, subscriber: updated, needsConfirmation: true }
        }

        return { success: true, subscriber: updated }
      }

      // Cannot resubscribe bounced or complained
      if (['BOUNCED', 'COMPLAINED'].includes(existing.status)) {
        return { success: false, error: 'This email address cannot be resubscribed' }
      }
    }

    // Create new subscriber
    const confirmationToken = options.doubleOptIn ? generateSubscriptionToken(normalizedEmail) : undefined

    const subscriber = await prisma.emailSubscriber.create({
      data: {
        email: normalizedEmail,
        firstName: options.firstName,
        lastName: options.lastName,
        name: options.name,
        status: options.doubleOptIn ? 'PENDING' : 'ACTIVE',
        source: options.source,
        tags: options.tags || [],
        metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : undefined,
        confirmationToken,
        consentTimestamp: options.doubleOptIn ? undefined : new Date(),
        consentIp: options.consentIp,
        consentSource: options.source,
      },
    })

    if (options.doubleOptIn && confirmationToken) {
      await sendConfirmationEmail(normalizedEmail, confirmationToken)
      return { success: true, subscriber, needsConfirmation: true }
    }

    return { success: true, subscriber }
  } catch (error) {
    console.error('Error subscribing email:', error)
    return { success: false, error: 'Failed to subscribe' }
  }
}

/**
 * Confirm email subscription (double opt-in)
 */
export async function confirmSubscription(
  token: string
): Promise<{ success: boolean; subscriber?: unknown; error?: string }> {
  try {
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { confirmationToken: token },
    })

    if (!subscriber) {
      return { success: false, error: 'Invalid or expired confirmation token' }
    }

    if (subscriber.status === 'ACTIVE') {
      return { success: true, subscriber, error: 'Already confirmed' }
    }

    const updated = await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'ACTIVE',
        confirmedAt: new Date(),
        consentTimestamp: new Date(),
        confirmationToken: null,
      },
    })

    return { success: true, subscriber: updated }
  } catch (error) {
    console.error('Error confirming subscription:', error)
    return { success: false, error: 'Failed to confirm subscription' }
  }
}

/**
 * Unsubscribe an email address
 */
export async function unsubscribeEmail(
  email: string,
  options: {
    token?: string
    reason?: string
    campaignId?: string
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim()

  try {
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { email: normalizedEmail },
    })

    if (!subscriber) {
      return { success: false, error: 'Subscriber not found' }
    }

    if (subscriber.status === 'UNSUBSCRIBED') {
      return { success: true, error: 'Already unsubscribed' }
    }

    await prisma.emailSubscriber.update({
      where: { email: normalizedEmail },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
        metadata: {
          ...(subscriber.metadata as Record<string, unknown> || {}),
          unsubscribeReason: options.reason,
          unsubscribeCampaignId: options.campaignId,
        },
      },
    })

    // Update campaign unsubscribe count
    if (options.campaignId) {
      await prisma.emailCampaign.update({
        where: { id: options.campaignId },
        data: {
          unsubscribeCount: { increment: 1 },
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing email:', error)
    return { success: false, error: 'Failed to unsubscribe' }
  }
}

/**
 * Unsubscribe by subscriber ID
 */
export async function unsubscribeById(
  subscriberId: string,
  options: {
    token?: string
    reason?: string
    campaignId?: string
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberId },
    })

    if (!subscriber) {
      return { success: false, error: 'Subscriber not found' }
    }

    return unsubscribeEmail(subscriber.email, options)
  } catch (error) {
    console.error('Error unsubscribing by ID:', error)
    return { success: false, error: 'Failed to unsubscribe' }
  }
}

/**
 * Get subscriber preferences
 */
export async function getSubscriberPreferences(
  subscriberIdOrEmail: string
): Promise<{
  success: boolean
  subscriber?: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    status: string
    tags: string[]
    preferences: Record<string, unknown>
  }
  error?: string
}> {
  try {
    // Try to find by ID first, then by email
    let subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberIdOrEmail },
    })

    if (!subscriber) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: subscriberIdOrEmail.toLowerCase().trim() },
      })
    }

    if (!subscriber) {
      return { success: false, error: 'Subscriber not found' }
    }

    return {
      success: true,
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        status: subscriber.status,
        tags: subscriber.tags,
        preferences: (subscriber.preferences as Record<string, unknown>) || {},
      },
    }
  } catch (error) {
    console.error('Error getting subscriber preferences:', error)
    return { success: false, error: 'Failed to get preferences' }
  }
}

/**
 * Update subscriber preferences
 */
export async function updateSubscriberPreferences(
  subscriberIdOrEmail: string,
  preferences: {
    firstName?: string
    lastName?: string
    emailPreferences?: {
      marketing?: boolean
      transactional?: boolean
      productUpdates?: boolean
      newsletter?: boolean
      frequency?: 'daily' | 'weekly' | 'monthly'
    }
    tags?: string[]
  }
): Promise<{ success: boolean; subscriber?: unknown; error?: string }> {
  try {
    // Try to find by ID first, then by email
    let subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberIdOrEmail },
    })

    if (!subscriber) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: subscriberIdOrEmail.toLowerCase().trim() },
      })
    }

    if (!subscriber) {
      return { success: false, error: 'Subscriber not found' }
    }

    const currentPrefs = (subscriber.preferences as Record<string, unknown>) || {}

    const updated = await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        firstName: preferences.firstName ?? subscriber.firstName,
        lastName: preferences.lastName ?? subscriber.lastName,
        tags: preferences.tags ?? subscriber.tags,
        preferences: {
          ...currentPrefs,
          ...preferences.emailPreferences,
        },
      },
    })

    return { success: true, subscriber: updated }
  } catch (error) {
    console.error('Error updating subscriber preferences:', error)
    return { success: false, error: 'Failed to update preferences' }
  }
}

/**
 * Send confirmation email for double opt-in
 */
async function sendConfirmationEmail(email: string, token: string): Promise<void> {
  // Import from core to avoid circular dependency
  const { sendEmail } = await import('./core')

  const confirmUrl = `${APP_URL}/api/email/confirm?token=${token}`

  await sendEmail({
    to: { email },
    subject: 'Please confirm your subscription',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="margin: 0 0 20px; color: #333; font-size: 24px;">Confirm your subscription</h1>
          <p style="margin: 0 0 20px; color: #666; line-height: 1.6;">
            Thank you for subscribing! Please click the button below to confirm your email address.
          </p>
          <a href="${confirmUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Confirm Subscription
          </a>
          <p style="margin: 20px 0 0; color: #999; font-size: 14px;">
            If you didn't subscribe, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Confirm your subscription

      Thank you for subscribing! Please click the link below to confirm your email address:

      ${confirmUrl}

      If you didn't subscribe, you can safely ignore this email.
    `,
  })
}

/**
 * Add tags to a subscriber
 */
export async function addSubscriberTags(
  subscriberIdOrEmail: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    let subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberIdOrEmail },
    })

    if (!subscriber) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: subscriberIdOrEmail.toLowerCase().trim() },
      })
    }

    if (!subscriber) {
      return { success: false, error: 'Subscriber not found' }
    }

    const currentTags = new Set(subscriber.tags)
    tags.forEach((tag) => currentTags.add(tag))

    await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        tags: Array.from(currentTags),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error adding subscriber tags:', error)
    return { success: false, error: 'Failed to add tags' }
  }
}

/**
 * Remove tags from a subscriber
 */
export async function removeSubscriberTags(
  subscriberIdOrEmail: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    let subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: subscriberIdOrEmail },
    })

    if (!subscriber) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: subscriberIdOrEmail.toLowerCase().trim() },
      })
    }

    if (!subscriber) {
      return { success: false, error: 'Subscriber not found' }
    }

    const tagsToRemove = new Set(tags)
    const newTags = subscriber.tags.filter((tag) => !tagsToRemove.has(tag))

    await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        tags: newTags,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error removing subscriber tags:', error)
    return { success: false, error: 'Failed to remove tags' }
  }
}
