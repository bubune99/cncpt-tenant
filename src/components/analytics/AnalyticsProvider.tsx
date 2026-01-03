'use client'

/**
 * Analytics Provider Component
 *
 * Loads and initializes analytics scripts (GA4, Matomo)
 */

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import type { AnalyticsSettings } from '@/lib/analytics/types'

interface AnalyticsProviderProps {
  settings: AnalyticsSettings
  children?: React.ReactNode
}

// Separate component for page view tracking (uses useSearchParams)
function PageViewTracker({ settings }: { settings: AnalyticsSettings }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!settings.enabled) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Check Do Not Track
    if (settings.respectDoNotTrack && navigator.doNotTrack === '1') {
      return
    }

    // Track page view in GA4
    if (settings.googleEnabled && settings.googleMeasurementId && typeof window !== 'undefined') {
      const gtag = (window as any).gtag
      if (gtag) {
        gtag('event', 'page_view', {
          page_path: url,
          page_title: document.title,
        })
      }
    }

    // Track page view in Matomo
    if (settings.matomoEnabled && typeof window !== 'undefined') {
      const _paq = (window as any)._paq
      if (_paq) {
        _paq.push(['setCustomUrl', url])
        _paq.push(['setDocumentTitle', document.title])
        _paq.push(['trackPageView'])
      }
    }
  }, [pathname, searchParams, settings])

  return null
}

export function AnalyticsProvider({ settings, children }: AnalyticsProviderProps) {
  if (!settings.enabled) {
    return <>{children}</>
  }

  return (
    <>
      {/* Google Analytics 4 */}
      {settings.googleEnabled && settings.googleMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.googleMeasurementId}'${settings.googleDebugMode ? ", { 'debug_mode': true }" : ''}${settings.anonymizeIp ? ", { 'anonymize_ip': true }" : ''});
            `}
          </Script>
        </>
      )}

      {/* Matomo */}
      {settings.matomoEnabled && settings.matomoUrl && settings.matomoSiteId && (
        <Script id="matomo-init" strategy="afterInteractive">
          {`
            var _paq = window._paq = window._paq || [];
            ${settings.respectDoNotTrack ? "_paq.push(['setDoNotTrack', true]);" : ''}
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="${settings.matomoUrl.endsWith('/') ? settings.matomoUrl : settings.matomoUrl + '/'}";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '${settings.matomoSiteId}']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
            })();
          `}
        </Script>
      )}

      {/* Plausible */}
      {settings.plausibleEnabled && settings.plausibleDomain && (
        <Script
          src="https://plausible.io/js/script.js"
          data-domain={settings.plausibleDomain}
          strategy="afterInteractive"
        />
      )}

      {/* Page view tracking */}
      <Suspense fallback={null}>
        <PageViewTracker settings={settings} />
      </Suspense>

      {children}
    </>
  )
}

/**
 * Client-side event tracking functions
 */

// Track custom event
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return

  // GA4
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('event', eventName, params)
  }

  // Matomo
  const _paq = (window as any)._paq
  if (_paq) {
    _paq.push(['trackEvent', eventName, JSON.stringify(params)])
  }
}

// Track page view manually
export function trackPageView(url: string, title?: string): void {
  if (typeof window === 'undefined') return

  // GA4
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('event', 'page_view', {
      page_path: url,
      page_title: title || document.title,
    })
  }

  // Matomo
  const _paq = (window as any)._paq
  if (_paq) {
    _paq.push(['setCustomUrl', url])
    if (title) _paq.push(['setDocumentTitle', title])
    _paq.push(['trackPageView'])
  }
}

// Track e-commerce purchase
export function trackPurchase(data: {
  transactionId: string
  value: number
  currency: string
  tax?: number
  shipping?: number
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    category?: string
  }>
}): void {
  if (typeof window === 'undefined') return

  // GA4
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('event', 'purchase', {
      transaction_id: data.transactionId,
      value: data.value,
      currency: data.currency,
      tax: data.tax,
      shipping: data.shipping,
      items: data.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
      })),
    })
  }

  // Matomo e-commerce
  const _paq = (window as any)._paq
  if (_paq) {
    // Add items
    data.items.forEach((item) => {
      _paq.push([
        'addEcommerceItem',
        item.id,
        item.name,
        item.category,
        item.price,
        item.quantity,
      ])
    })
    // Track order
    _paq.push([
      'trackEcommerceOrder',
      data.transactionId,
      data.value,
      data.value - (data.tax || 0) - (data.shipping || 0),
      data.tax,
      data.shipping,
    ])
  }
}

// Track add to cart
export function trackAddToCart(item: {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
  currency?: string
}): void {
  if (typeof window === 'undefined') return

  // GA4
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('event', 'add_to_cart', {
      currency: item.currency || 'USD',
      value: item.price * item.quantity,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_category: item.category,
        },
      ],
    })
  }

  // Matomo
  const _paq = (window as any)._paq
  if (_paq) {
    _paq.push([
      'addEcommerceItem',
      item.id,
      item.name,
      item.category,
      item.price,
      item.quantity,
    ])
    _paq.push(['trackEcommerceCartUpdate', item.price * item.quantity])
  }
}

// Set user ID for tracking
export function setUserId(userId: string): void {
  if (typeof window === 'undefined') return

  // GA4
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('set', { user_id: userId })
  }

  // Matomo
  const _paq = (window as any)._paq
  if (_paq) {
    _paq.push(['setUserId', userId])
  }
}

// Update consent settings
export function updateConsent(granted: boolean): void {
  if (typeof window === 'undefined') return

  // GA4 consent mode
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: granted ? 'granted' : 'denied',
    })
  }

  // Matomo consent
  const _paq = (window as any)._paq
  if (_paq) {
    if (granted) {
      _paq.push(['setConsentGiven'])
    } else {
      _paq.push(['forgetConsentGiven'])
    }
  }
}
