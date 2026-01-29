/**
 * Feature Flags
 *
 * Check which features are enabled in the client configuration.
 * Use these hooks in components to conditionally render features.
 */

import clientConfig from '../../../client.config';

type Features = typeof clientConfig.features;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof Features): boolean {
  const value = clientConfig.features[feature];

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'object' && 'enabled' in value) {
    return value.enabled;
  }

  return false;
}

/**
 * Get feature configuration
 */
export function getFeatureConfig<K extends keyof Features>(feature: K): Features[K] {
  return clientConfig.features[feature];
}

/**
 * Check multiple features at once
 */
export function areFeaturesEnabled(features: (keyof Features)[]): boolean {
  return features.every(isFeatureEnabled);
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): (keyof Features)[] {
  return (Object.keys(clientConfig.features) as (keyof Features)[]).filter(isFeatureEnabled);
}

// =============================================================================
// Specific feature checks (for convenience)
// =============================================================================

export const features = {
  blog: () => isFeatureEnabled('blog'),
  shop: () => isFeatureEnabled('shop'),
  pages: () => isFeatureEnabled('pages'),
  forms: () => isFeatureEnabled('forms'),
  media: () => isFeatureEnabled('media'),

  // Nested features
  ecommerce: {
    enabled: () => getFeatureConfig('ecommerce').enabled,
    checkout: () => getFeatureConfig('ecommerce').checkout,
    subscriptions: () => getFeatureConfig('ecommerce').subscriptions,
    digitalProducts: () => getFeatureConfig('ecommerce').digitalProducts,
    inventory: () => getFeatureConfig('ecommerce').inventory,
  },

  email: {
    enabled: () => getFeatureConfig('email').enabled,
    marketing: () => getFeatureConfig('email').marketing,
    transactional: () => getFeatureConfig('email').transactional,
  },

  ai: {
    enabled: () => getFeatureConfig('ai').enabled,
    chatbot: () => getFeatureConfig('ai').chatbot,
    contentGeneration: () => getFeatureConfig('ai').contentGeneration,
    imageGeneration: () => getFeatureConfig('ai').imageGeneration,
  },
};
