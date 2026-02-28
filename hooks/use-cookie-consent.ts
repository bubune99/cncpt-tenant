'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { updateConsent as updateAnalyticsConsent } from '@/components/cms/analytics/AnalyticsProvider'
import {
  type CookieConsentState,
  DEFAULT_CONSENT,
  setStoredConsent,
  subscribe,
  getSnapshot,
  getServerSnapshot,
} from '@/lib/cms/cookie-consent-store'

export type { CookieConsentState } from '@/lib/cms/cookie-consent-store'
export { hasConsentFor, hasConsentDecision } from '@/lib/cms/cookie-consent-store'

export function useCookieConsent() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [isOpen, setIsOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  const hasConsented = stored !== null
  const consent: CookieConsentState = stored?.consent ?? DEFAULT_CONSENT

  // Show banner on mount if user hasn't consented yet
  useEffect(() => {
    if (!hasConsented) {
      setIsOpen(true)
    }
  }, [hasConsented])

  const acceptAll = useCallback(() => {
    const newConsent: CookieConsentState = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    }
    setStoredConsent(newConsent)
    updateAnalyticsConsent(true)
    setIsOpen(false)
    setIsPreferencesOpen(false)
  }, [])

  const rejectNonEssential = useCallback(() => {
    const newConsent: CookieConsentState = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    }
    setStoredConsent(newConsent)
    updateAnalyticsConsent(false)
    setIsOpen(false)
    setIsPreferencesOpen(false)
  }, [])

  const savePreferences = useCallback((preferences: CookieConsentState) => {
    const newConsent = { ...preferences, essential: true }
    setStoredConsent(newConsent)
    updateAnalyticsConsent(newConsent.analytics)
    setIsOpen(false)
    setIsPreferencesOpen(false)
  }, [])

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true)
  }, [])

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false)
  }, [])

  return {
    consent,
    hasConsented,
    isOpen,
    isPreferencesOpen,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openPreferences,
    closePreferences,
  }
}
