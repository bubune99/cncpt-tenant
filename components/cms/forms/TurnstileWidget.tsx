'use client'

import { useEffect, useRef, useState } from 'react'

interface TurnstileWidgetProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

export function TurnstileWidget({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (window.turnstile) {
      setLoaded(true)
      return
    }

    const existingScript = document.querySelector('script[src*="turnstile"]')
    if (existingScript) {
      // Script is loading, wait for it
      window.onTurnstileLoad = () => setLoaded(true)
      return
    }

    window.onTurnstileLoad = () => setLoaded(true)
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      delete window.onTurnstileLoad
    }
  }, [])

  useEffect(() => {
    if (!loaded || !containerRef.current || !window.turnstile) return

    // Clean up any existing widget
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current)
      } catch {
        // Ignore cleanup errors
      }
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: onVerify,
      'error-callback': onError,
      'expired-callback': onExpire,
    })

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null
      }
    }
  }, [loaded, siteKey, theme, onVerify, onError, onExpire])

  return <div ref={containerRef} />
}
