/**
 * useBranding Hook
 *
 * Client-side hook for accessing tenant branding data.
 * Fetches branding from the API based on the current subdomain.
 * Caches the result in state to avoid redundant fetches.
 *
 * Usage:
 *   const { branding, isLoading } = useBranding()
 *   branding.siteName // "My Store"
 *   branding.primaryColor // "#0066cc"
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

export interface ClientBranding {
  siteName: string
  siteTagline: string
  logoUrl?: string
  logoDarkUrl?: string
  logoAlt?: string
  faviconUrl?: string
  faviconSvgUrl?: string
  appleTouchIconUrl?: string
  ogImageUrl?: string
  primaryColor: string
  accentColor: string
  themeColor: string
  titleTemplate: string
  metaDescription: string
  hidePoweredBy: boolean
}

const DEFAULT_BRANDING: ClientBranding = {
  siteName: 'My Site',
  siteTagline: 'Welcome to our platform',
  primaryColor: '#0066cc',
  accentColor: '#6366f1',
  themeColor: '#0891b2',
  titleTemplate: '%s | My Site',
  metaDescription: '',
  hidePoweredBy: false,
}

// Module-level cache to avoid refetching across component mounts
const brandingCache = new Map<string, ClientBranding>()

export function useBranding() {
  const params = useParams()
  const subdomain = (params?.subdomain as string) || ''
  const [branding, setBranding] = useState<ClientBranding>(
    brandingCache.get(subdomain) || DEFAULT_BRANDING
  )
  const [isLoading, setIsLoading] = useState(!brandingCache.has(subdomain))
  const [error, setError] = useState<string | null>(null)

  const fetchBranding = useCallback(async () => {
    if (!subdomain) return

    // Use cache if available
    const cached = brandingCache.get(subdomain)
    if (cached) {
      setBranding(cached)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/cms/admin/branding?subdomain=${encodeURIComponent(subdomain)}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.branding) {
          const merged = { ...DEFAULT_BRANDING, ...data.branding }
          brandingCache.set(subdomain, merged)
          setBranding(merged)
        }
      } else {
        setError('Failed to load branding')
      }
    } catch (err) {
      console.error('Failed to fetch branding:', err)
      setError('Failed to load branding')
    } finally {
      setIsLoading(false)
    }
  }, [subdomain])

  useEffect(() => {
    fetchBranding()
  }, [fetchBranding])

  /** Force refresh branding (e.g., after saving settings) */
  const refresh = useCallback(() => {
    brandingCache.delete(subdomain)
    fetchBranding()
  }, [subdomain, fetchBranding])

  return { branding, isLoading, error, refresh }
}

export default useBranding
