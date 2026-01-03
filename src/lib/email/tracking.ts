/**
 * Email Tracking Service
 *
 * Injects tracking pixels and rewrites links for email analytics
 */

import { prisma } from '@/lib/db'
import crypto from 'crypto'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Generate a unique tracking token
 */
export function generateTrackingToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Create a tracking pixel URL
 */
export function createOpenTrackingUrl(recipientId: string, campaignId?: string): string {
  const params = new URLSearchParams({
    r: recipientId,
    ...(campaignId && { c: campaignId }),
  })
  return `${APP_URL}/api/email/track/open?${params.toString()}`
}

/**
 * Create a click tracking URL
 */
export function createClickTrackingUrl(
  recipientId: string,
  originalUrl: string,
  linkId?: string,
  campaignId?: string
): string {
  const params = new URLSearchParams({
    r: recipientId,
    u: originalUrl,
    ...(linkId && { l: linkId }),
    ...(campaignId && { c: campaignId }),
  })
  return `${APP_URL}/api/email/track/click?${params.toString()}`
}

/**
 * Create an unsubscribe URL
 */
export function createUnsubscribeUrl(subscriberId: string, token?: string): string {
  const params = new URLSearchParams({
    s: subscriberId,
    ...(token && { t: token }),
  })
  return `${APP_URL}/api/email/unsubscribe?${params.toString()}`
}

/**
 * Create a preference center URL
 */
export function createPreferenceCenterUrl(subscriberId: string, token?: string): string {
  const params = new URLSearchParams({
    s: subscriberId,
    ...(token && { t: token }),
  })
  return `${APP_URL}/email/preferences?${params.toString()}`
}

/**
 * Inject open tracking pixel into HTML email
 */
export function injectOpenTrackingPixel(html: string, recipientId: string, campaignId?: string): string {
  const trackingUrl = createOpenTrackingUrl(recipientId, campaignId)
  const pixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`

  // Inject before closing body tag, or at end if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`)
  }
  return html + pixel
}

/**
 * Rewrite all links in HTML for click tracking
 */
export function rewriteLinksForTracking(
  html: string,
  recipientId: string,
  campaignId?: string,
  excludePatterns: RegExp[] = []
): string {
  // Default exclusion patterns
  const defaultExclusions = [
    /^mailto:/i,
    /^tel:/i,
    /^#/,
    /^javascript:/i,
    /unsubscribe/i,
    /preference/i,
  ]

  const exclusions = [...defaultExclusions, ...excludePatterns]

  // Match href attributes
  const hrefRegex = /href=["']([^"']+)["']/gi

  return html.replace(hrefRegex, (match, url: string) => {
    // Check if URL should be excluded
    for (const pattern of exclusions) {
      if (pattern.test(url)) {
        return match
      }
    }

    // Skip already-tracked URLs
    if (url.includes('/api/email/track/')) {
      return match
    }

    const trackedUrl = createClickTrackingUrl(recipientId, url, undefined, campaignId)
    return `href="${trackedUrl}"`
  })
}

/**
 * Inject list-unsubscribe headers for email clients
 */
export function getUnsubscribeHeaders(subscriberId: string, token?: string): Record<string, string> {
  const unsubscribeUrl = createUnsubscribeUrl(subscriberId, token)

  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

/**
 * Process HTML email for full tracking
 */
export function processEmailForTracking(
  html: string,
  recipientId: string,
  options: {
    campaignId?: string
    trackOpens?: boolean
    trackClicks?: boolean
    excludeLinkPatterns?: RegExp[]
  } = {}
): string {
  let processed = html

  // Rewrite links for click tracking
  if (options.trackClicks !== false) {
    processed = rewriteLinksForTracking(processed, recipientId, options.campaignId, options.excludeLinkPatterns)
  }

  // Inject open tracking pixel
  if (options.trackOpens !== false) {
    processed = injectOpenTrackingPixel(processed, recipientId, options.campaignId)
  }

  return processed
}

/**
 * Record an email open event
 */
export async function recordEmailOpen(
  recipientId: string,
  metadata?: {
    campaignId?: string
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  const now = new Date()

  // Update recipient record
  await prisma.emailRecipient.update({
    where: { id: recipientId },
    data: {
      openedAt: now,
      openCount: { increment: 1 },
    },
  })

  // Update campaign stats
  if (metadata?.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: metadata.campaignId },
      data: {
        openCount: { increment: 1 },
        // uniqueOpenCount handled separately with deduplication
      },
    })
  }

  // Update subscriber engagement
  await prisma.$executeRaw`
    UPDATE email_subscribers es
    SET
      total_opens = total_opens + 1,
      last_engaged_at = ${now},
      engagement_score = LEAST(engagement_score + 1, 100)
    FROM email_recipients er
    WHERE er.id = ${recipientId}
    AND es.email = er.email
  `
}

/**
 * Record an email click event
 */
export async function recordEmailClick(
  recipientId: string,
  url: string,
  metadata?: {
    campaignId?: string
    linkId?: string
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  const now = new Date()

  // Update recipient record
  await prisma.emailRecipient.update({
    where: { id: recipientId },
    data: {
      clickedAt: now,
      clickCount: { increment: 1 },
    },
  })

  // Record click in EmailLinkClick if we have a linkId
  if (metadata?.linkId) {
    await prisma.emailLinkClick.create({
      data: {
        linkId: metadata.linkId,
        recipientId,
        clickedAt: now,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    })

    // Update link click count
    await prisma.emailLink.update({
      where: { id: metadata.linkId },
      data: {
        clickCount: { increment: 1 },
      },
    })
  }

  // Update campaign stats
  if (metadata?.campaignId) {
    await prisma.emailCampaign.update({
      where: { id: metadata.campaignId },
      data: {
        clickCount: { increment: 1 },
      },
    })
  }

  // Update subscriber engagement
  await prisma.$executeRaw`
    UPDATE email_subscribers es
    SET
      total_clicks = total_clicks + 1,
      last_engaged_at = ${now},
      engagement_score = LEAST(engagement_score + 2, 100)
    FROM email_recipients er
    WHERE er.id = ${recipientId}
    AND es.email = er.email
  `
}

/**
 * Get or create a tracked link
 */
export async function getOrCreateTrackedLink(
  campaignId: string,
  targetUrl: string
): Promise<string> {
  // Check if link exists
  let link = await prisma.emailLink.findFirst({
    where: {
      campaignId,
      url: targetUrl,
    },
  })

  if (!link) {
    link = await prisma.emailLink.create({
      data: {
        campaignId,
        url: targetUrl,
        clickCount: 0,
      },
    })
  }

  return link.id
}

/**
 * Rewrite links with database-tracked IDs
 */
export async function rewriteLinksWithTracking(
  html: string,
  recipientId: string,
  campaignId: string,
  excludePatterns: RegExp[] = []
): Promise<string> {
  const defaultExclusions = [
    /^mailto:/i,
    /^tel:/i,
    /^#/,
    /^javascript:/i,
    /unsubscribe/i,
    /preference/i,
  ]

  const exclusions = [...defaultExclusions, ...excludePatterns]

  // Extract all links first
  const hrefRegex = /href=["']([^"']+)["']/gi
  const links: string[] = []
  let match

  while ((match = hrefRegex.exec(html)) !== null) {
    const url = match[1]
    let shouldExclude = false

    for (const pattern of exclusions) {
      if (pattern.test(url)) {
        shouldExclude = true
        break
      }
    }

    if (!shouldExclude && !url.includes('/api/email/track/')) {
      links.push(url)
    }
  }

  // Create tracked links in batch
  const linkMap = new Map<string, string>()
  for (const url of links) {
    const linkId = await getOrCreateTrackedLink(campaignId, url)
    linkMap.set(url, linkId)
  }

  // Replace links with tracked versions
  return html.replace(hrefRegex, (match, url: string) => {
    const linkId = linkMap.get(url)
    if (!linkId) {
      return match
    }

    const trackedUrl = createClickTrackingUrl(recipientId, url, linkId, campaignId)
    return `href="${trackedUrl}"`
  })
}
