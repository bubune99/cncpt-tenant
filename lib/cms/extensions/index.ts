/**
 * Extension Points
 *
 * This module provides ways for clients to extend the CMS
 * without modifying core code.
 */

// Feature flags - check enabled features
export {
  isFeatureEnabled,
  getFeatureConfig,
  areFeaturesEnabled,
  getEnabledFeatures,
  features,
} from './feature-flags';

// Theme provider - client theming
export {
  ClientThemeProvider,
  useClientTheme,
} from './theme-provider';

// Re-export client config for convenience
export { default as clientConfig } from '../../../client.config';
