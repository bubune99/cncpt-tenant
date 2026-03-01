/**
 * Feature Enablement System -- barrel export
 *
 * Usage:
 *   Server-side: import { hasFeature, resolveFeatureConfig } from "@/lib/cms/features"
 *   Client-side: import { useFeature, useFeatures } from "@/hooks/use-features"
 *   API gating:  import { withFeature } from "@/lib/cms/features"
 */

// Definitions
export type { FeatureDefinition } from "./definitions"
export {
  ALL_FEATURES,
  MODULE_FEATURES,
  getSubFeatures,
  getFeatureDefinition,
  getAllFeatureKeys,
  getModuleFromFeatureKey,
  buildDefaultFeatureConfig,
} from "./definitions"

// Presets
export type { FeaturePreset } from "./presets"
export { FEATURE_PRESETS, getFeaturePreset, presetToFeatureConfig } from "./presets"

// Resolver (server-side)
export {
  resolveFeatureConfig,
  hasFeature,
  hasAllFeatures,
  hasAnyFeature,
  getEnabledFeatures,
  getResolvedFeatures,
  clearFeatureCache,
} from "./resolver"

// Middleware (API gating)
export { withFeature, requireFeature } from "./middleware"

// Client-side context
export {
  FeatureProvider,
  useFeatureContext,
  useFeatureContextOptional,
} from "./feature-context"
