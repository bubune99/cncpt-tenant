/**
 * Cookie consent storage utilities.
 * Separated from the React hook to avoid circular dependencies
 * (the analytics provider needs to check consent, and the hook
 * needs to call the analytics consent update).
 */

export interface CookieConsentState {
  essential: boolean // Always true, cannot be toggled
  analytics: boolean
  marketing: boolean
  functional: boolean
}

const STORAGE_KEY = 'cookie-consent'
const CONSENT_VERSION = 1

interface StoredConsent {
  version: number
  consent: CookieConsentState
  timestamp: number
}

export const DEFAULT_CONSENT: CookieConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
}

let listeners: Array<() => void> = []

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export function getStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: StoredConsent = JSON.parse(raw)
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function setStoredConsent(consent: CookieConsentState): void {
  if (typeof window === 'undefined') return
  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    consent: { ...consent, essential: true },
    timestamp: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  emitChange()
}

export function getSnapshot(): StoredConsent | null {
  return getStoredConsent()
}

export function getServerSnapshot(): StoredConsent | null {
  return null
}

export function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

/**
 * Check if a specific consent category is granted.
 * Can be used outside of React components.
 */
export function hasConsentFor(category: keyof CookieConsentState): boolean {
  if (category === 'essential') return true
  const stored = getStoredConsent()
  if (!stored) return false
  return stored.consent[category] ?? false
}

/**
 * Check if the user has made any consent decision at all.
 */
export function hasConsentDecision(): boolean {
  return getStoredConsent() !== null
}
