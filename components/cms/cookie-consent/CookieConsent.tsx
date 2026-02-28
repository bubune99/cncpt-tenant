'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/cms/ui/button'
import { useCookieConsent } from '@/hooks/use-cookie-consent'
import { CookiePreferencesModal } from './CookiePreferencesModal'

export function CookieConsent() {
  const {
    consent,
    hasConsented,
    isOpen,
    isPreferencesOpen,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openPreferences,
    closePreferences,
  } = useCookieConsent()

  const bannerRef = useRef<HTMLDivElement>(null)
  const firstButtonRef = useRef<HTMLButtonElement>(null)

  // Focus the first button when the banner becomes visible
  useEffect(() => {
    if (isOpen && !isPreferencesOpen) {
      // Small delay to let the animation start
      const timer = setTimeout(() => {
        firstButtonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isPreferencesOpen])

  // Trap focus within the banner when it is visible
  useEffect(() => {
    if (!isOpen || isPreferencesOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const banner = bannerRef.current
      if (!banner) return

      const focusable = banner.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPreferencesOpen])

  if (hasConsented && !isOpen) return null

  return (
    <>
      {/* Banner */}
      {isOpen && !isPreferencesOpen && (
        <div
          ref={bannerRef}
          role="dialog"
          aria-label="Cookie consent"
          aria-describedby="cookie-consent-description"
          className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300 fill-mode-both"
        >
          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
            <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex-1">
                <p id="cookie-consent-description" className="text-sm text-muted-foreground">
                  We use cookies to enhance your experience. Essential cookies are always active.
                  You can choose to accept all cookies or manage your preferences.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  ref={firstButtonRef}
                  variant="ghost"
                  size="sm"
                  onClick={openPreferences}
                >
                  Manage Preferences
                </Button>
                <Button variant="outline" size="sm" onClick={rejectNonEssential}>
                  Reject Non-Essential
                </Button>
                <Button size="sm" onClick={acceptAll}>
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences modal */}
      <CookiePreferencesModal
        open={isPreferencesOpen}
        onClose={closePreferences}
        currentConsent={consent}
        onSave={savePreferences}
        onAcceptAll={acceptAll}
      />
    </>
  )
}
