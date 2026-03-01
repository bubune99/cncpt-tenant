"use client"

/**
 * Feature Enablement Hooks
 *
 * Client-side hooks for checking feature flags.
 * Depends on FeatureProvider being in the component tree.
 *
 * Usage:
 *   const isEnabled = useFeature("commerce.reviews")
 *   const { isEnabled, allEnabled, config } = useFeatures()
 *   const canShow = useFeatureGate(["commerce", "blog"])
 */

import { useMemo } from "react"
import {
  useFeatureContextOptional,
  type FeatureContextValue,
} from "@/lib/cms/features/feature-context"

/**
 * Check if a single feature is enabled.
 *
 * @param key - Feature key like "commerce" or "commerce.reviews"
 * @returns boolean - true if enabled, true by default if context not available
 */
export function useFeature(key: string): boolean {
  const { isEnabled } = useFeatureContextOptional()
  return isEnabled(key)
}

/**
 * Get full feature context with all utilities.
 *
 * @returns FeatureContextValue
 */
export function useFeatures(): FeatureContextValue {
  return useFeatureContextOptional()
}

/**
 * Check if all specified features are enabled.
 * Useful for gating UI that requires multiple features.
 *
 * @param keys - Array of feature keys
 * @returns boolean
 */
export function useFeatureGate(keys: string[]): boolean {
  const { allEnabled } = useFeatureContextOptional()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => allEnabled(keys), [allEnabled, ...keys])
}

/**
 * Check if any of the specified features are enabled.
 * Useful for showing content when at least one feature applies.
 *
 * @param keys - Array of feature keys
 * @returns boolean
 */
export function useFeatureAny(keys: string[]): boolean {
  const { anyEnabled } = useFeatureContextOptional()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => anyEnabled(keys), [anyEnabled, ...keys])
}

/**
 * Get the full resolved feature config.
 * Returns an empty object if context is not available.
 */
export function useFeatureConfig(): Record<string, boolean> {
  const { config } = useFeatureContextOptional()
  return config
}

/**
 * Check if feature config has loaded.
 * Useful for showing loading states.
 */
export function useFeaturesLoaded(): boolean {
  const { loaded } = useFeatureContextOptional()
  return loaded
}
