"use client"

/**
 * Feature Context (Client-Side)
 *
 * Provides the resolved feature config to all client components.
 * Fetched once on mount from /api/cms/admin/features.
 *
 * Usage:
 *   <FeatureProvider>
 *     {children}
 *   </FeatureProvider>
 *
 *   // In any component:
 *   const { isEnabled } = useFeatures()
 *   if (isEnabled('commerce.reviews')) { ... }
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

export interface FeatureContextValue {
  /** Full resolved config: Record<featureKey, boolean> */
  config: Record<string, boolean>
  /** Check if a feature is enabled */
  isEnabled: (key: string) => boolean
  /** Check if ALL features are enabled */
  allEnabled: (keys: string[]) => boolean
  /** Check if ANY feature is enabled */
  anyEnabled: (keys: string[]) => boolean
  /** Whether the config has loaded */
  loaded: boolean
  /** Re-fetch feature config (e.g., after toggling) */
  refresh: () => Promise<void>
}

// ---------------------------------------------------------------------------
//  Context
// ---------------------------------------------------------------------------

const FeatureContext = createContext<FeatureContextValue | null>(null)

// ---------------------------------------------------------------------------
//  Provider
// ---------------------------------------------------------------------------

export function FeatureProvider({
  children,
  initialConfig,
}: {
  children: ReactNode
  /** Optional SSR-provided config to avoid loading flash */
  initialConfig?: Record<string, boolean>
}) {
  const [config, setConfig] = useState<Record<string, boolean>>(
    initialConfig ?? {}
  )
  const [loaded, setLoaded] = useState(!!initialConfig)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/cms/admin/features")
      if (!res.ok) return
      const json = await res.json()
      if (json.ok && json.data?.config) {
        setConfig(json.data.config)
        setLoaded(true)
      }
    } catch {
      // Silently fail - features default to enabled
    }
  }, [])

  useEffect(() => {
    if (!initialConfig) {
      fetchConfig()
    }
  }, [fetchConfig, initialConfig])

  const isEnabled = useCallback(
    (key: string): boolean => {
      if (!loaded) return true // Default to enabled while loading
      if (key in config) return config[key]
      // For unknown features, check parent module
      if (key.includes(".")) {
        const moduleKey = key.split(".")[0]
        if (moduleKey in config) return config[moduleKey]
      }
      return true // Unknown features default to enabled
    },
    [config, loaded]
  )

  const allEnabled = useCallback(
    (keys: string[]): boolean => keys.every((k) => isEnabled(k)),
    [isEnabled]
  )

  const anyEnabled = useCallback(
    (keys: string[]): boolean => keys.some((k) => isEnabled(k)),
    [isEnabled]
  )

  const value: FeatureContextValue = {
    config,
    isEnabled,
    allEnabled,
    anyEnabled,
    loaded,
    refresh: fetchConfig,
  }

  return (
    <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>
  )
}

// ---------------------------------------------------------------------------
//  Hooks
// ---------------------------------------------------------------------------

/**
 * Access the feature context. Throws if used outside FeatureProvider.
 */
export function useFeatureContext(): FeatureContextValue {
  const ctx = useContext(FeatureContext)
  if (!ctx) {
    throw new Error("useFeatureContext must be used within a FeatureProvider")
  }
  return ctx
}

/**
 * Safe access - returns default-enabled values if outside a FeatureProvider.
 */
export function useFeatureContextOptional(): FeatureContextValue {
  const ctx = useContext(FeatureContext)
  if (!ctx) {
    return {
      config: {},
      isEnabled: () => true,
      allEnabled: () => true,
      anyEnabled: () => true,
      loaded: false,
      refresh: async () => {},
    }
  }
  return ctx
}
