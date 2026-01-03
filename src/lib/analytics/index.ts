/**
 * Analytics Library
 *
 * Provides unified analytics tracking for Google Analytics 4 and Matomo
 */

import { prisma } from '@/lib/db'
import type {
  AnalyticsSettings,
  AnalyticsEvent,
  PurchaseEventData,
  PageViewData,
  UserProperties,
  ConsentSettings,
} from './types'
import { DEFAULT_ANALYTICS_SETTINGS } from './types'

// Cache for analytics settings
let settingsCache: AnalyticsSettings | null = null
let settingsCacheTime = 0
const SETTINGS_CACHE_TTL = 60 * 1000 // 1 minute

/**
 * Get analytics settings from database
 */
export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  const now = Date.now()
  if (settingsCache && now - settingsCacheTime < SETTINGS_CACHE_TTL) {
    return settingsCache
  }

  const records = await prisma.setting.findMany({
    where: { key: { startsWith: 'analytics.' } },
  })

  const settings: AnalyticsSettings = { ...DEFAULT_ANALYTICS_SETTINGS }

  for (const record of records) {
    const key = record.key.replace('analytics.', '')
    switch (key) {
      case 'enabled':
        settings.enabled = record.value === 'true'
        break
      case 'googleEnabled':
        settings.googleEnabled = record.value === 'true'
        break
      case 'googleMeasurementId':
        settings.googleMeasurementId = record.value
        break
      case 'googleDebugMode':
        settings.googleDebugMode = record.value === 'true'
        break
      case 'matomoEnabled':
        settings.matomoEnabled = record.value === 'true'
        break
      case 'matomoUrl':
        settings.matomoUrl = record.value
        break
      case 'matomoSiteId':
        settings.matomoSiteId = record.value
        break
      case 'plausibleEnabled':
        settings.plausibleEnabled = record.value === 'true'
        break
      case 'plausibleDomain':
        settings.plausibleDomain = record.value
        break
      case 'respectDoNotTrack':
        settings.respectDoNotTrack = record.value === 'true'
        break
      case 'anonymizeIp':
        settings.anonymizeIp = record.value === 'true'
        break
      case 'cookieConsent':
        settings.cookieConsent = record.value === 'true'
        break
    }
  }

  // Fallback to environment variables
  if (!settings.googleMeasurementId) {
    settings.googleMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  }
  if (!settings.matomoUrl) {
    settings.matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL
  }
  if (!settings.matomoSiteId) {
    settings.matomoSiteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID
  }

  settingsCache = settings
  settingsCacheTime = now

  return settings
}

/**
 * Clear analytics settings cache
 */
export function clearAnalyticsSettingsCache(): void {
  settingsCache = null
  settingsCacheTime = 0
}

/**
 * Track an event server-side (stores in database)
 */
export async function trackServerEvent(
  eventName: string,
  eventData?: Record<string, any>,
  context?: {
    sessionId?: string
    userId?: string
    pageUrl?: string
    pageTitle?: string
    referrer?: string
    userAgent?: string
    ipAddress?: string
  }
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventName,
        eventData: eventData || undefined,
        sessionId: context?.sessionId,
        userId: context?.userId,
        pageUrl: context?.pageUrl,
        pageTitle: context?.pageTitle,
        referrer: context?.referrer,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
      },
    })
  } catch (error) {
    console.error('Failed to track server event:', error)
  }
}

/**
 * Track a purchase event
 */
export async function trackPurchase(
  data: PurchaseEventData,
  context?: {
    sessionId?: string
    userId?: string
  }
): Promise<void> {
  await trackServerEvent('purchase', data, context)
}

/**
 * Get analytics data for dashboard
 */
export async function getAnalyticsSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  pageViews: number
  uniqueVisitors: number
  purchases: number
  revenue: number
  topPages: Array<{ url: string; views: number }>
  topReferrers: Array<{ referrer: string; count: number }>
  eventBreakdown: Array<{ event: string; count: number }>
}> {
  // Page views
  const pageViews = await prisma.analyticsEvent.count({
    where: {
      eventName: 'page_view',
      createdAt: { gte: startDate, lte: endDate },
    },
  })

  // Unique visitors (by sessionId)
  const uniqueVisitors = await prisma.analyticsEvent.groupBy({
    by: ['sessionId'],
    where: {
      sessionId: { not: null },
      createdAt: { gte: startDate, lte: endDate },
    },
  })

  // Purchases and revenue
  const purchases = await prisma.analyticsEvent.findMany({
    where: {
      eventName: 'purchase',
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { eventData: true },
  })

  const revenue = purchases.reduce((sum: number, p: (typeof purchases)[number]) => {
    const data = p.eventData as Record<string, unknown> | null
    const value = typeof data?.value === 'number' ? data.value : 0
    return sum + value
  }, 0)

  // Top pages
  const topPagesRaw = await prisma.analyticsEvent.groupBy({
    by: ['pageUrl'],
    where: {
      eventName: 'page_view',
      pageUrl: { not: null },
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { pageUrl: true },
    orderBy: { _count: { pageUrl: 'desc' } },
    take: 10,
  })

  const topPages = topPagesRaw.map((p: (typeof topPagesRaw)[number]) => ({
    url: p.pageUrl!,
    views: p._count.pageUrl,
  }))

  // Top referrers
  const topReferrersRaw = await prisma.analyticsEvent.groupBy({
    by: ['referrer'],
    where: {
      referrer: { not: null },
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { referrer: true },
    orderBy: { _count: { referrer: 'desc' } },
    take: 10,
  })

  const topReferrers = topReferrersRaw.map((r: (typeof topReferrersRaw)[number]) => ({
    referrer: r.referrer!,
    count: r._count.referrer,
  }))

  // Event breakdown
  const eventBreakdownRaw = await prisma.analyticsEvent.groupBy({
    by: ['eventName'],
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { eventName: true },
    orderBy: { _count: { eventName: 'desc' } },
    take: 20,
  })

  const eventBreakdown = eventBreakdownRaw.map((e: (typeof eventBreakdownRaw)[number]) => ({
    event: e.eventName,
    count: e._count.eventName,
  }))

  return {
    pageViews,
    uniqueVisitors: uniqueVisitors.length,
    purchases: purchases.length,
    revenue,
    topPages,
    topReferrers,
    eventBreakdown,
  }
}

/**
 * Generate Google Analytics gtag script
 */
export function generateGtagScript(measurementId: string, debugMode = false): string {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}'${debugMode ? ", { 'debug_mode': true }" : ''});
  `
}

/**
 * Generate Matomo tracking script
 */
export function generateMatomoScript(matomoUrl: string, siteId: string): string {
  const url = matomoUrl.endsWith('/') ? matomoUrl : `${matomoUrl}/`

  return `
    var _paq = window._paq = window._paq || [];
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
      var u="${url}";
      _paq.push(['setTrackerUrl', u+'matomo.php']);
      _paq.push(['setSiteId', '${siteId}']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
    })();
  `
}

export * from './types'
