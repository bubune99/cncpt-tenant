/**
 * Component Registry
 *
 * Merges core Puck components with client custom components.
 * This allows clients to add components without modifying core config.
 */

import type { Config, ComponentConfig } from '@puckeditor/core';
import { puckConfig as corePuckConfig } from '@/puck/config';
import clientConfig from '../../../client.config';

/**
 * Get the merged Puck config with client custom components
 */
export function getMergedPuckConfig(): Config {
  const { customComponents, hiddenComponents, customComponentCategory } = clientConfig.puckConfig;

  // Start with core config
  const mergedConfig: Config = { ...corePuckConfig };

  // Filter out hidden components
  if (hiddenComponents.length > 0) {
    const filteredComponents: Record<string, ComponentConfig> = {};
    for (const [key, value] of Object.entries(mergedConfig.components || {})) {
      if (!hiddenComponents.includes(key)) {
        filteredComponents[key] = value as ComponentConfig;
      }
    }
    // Cast to satisfy Puck's internal type requirements
    mergedConfig.components = filteredComponents as Config['components'];
  }

  // Add custom components
  if (Object.keys(customComponents).length > 0) {
    // Cast to satisfy Puck's internal type requirements
    mergedConfig.components = {
      ...mergedConfig.components,
      ...customComponents,
    } as Config['components'];

    // Add custom category if not exists
    if (mergedConfig.categories && !mergedConfig.categories[customComponentCategory.toLowerCase()]) {
      mergedConfig.categories[customComponentCategory.toLowerCase()] = {
        title: customComponentCategory,
        components: Object.keys(customComponents),
        defaultExpanded: false,
      };
    }
  }

  return mergedConfig;
}

/**
 * Register a custom component at runtime
 */
export function registerComponent(
  name: string,
  config: ComponentConfig,
  category?: string
): void {
  clientConfig.puckConfig.customComponents[name] = config;

  if (category) {
    // Component will be added to specified category
    // This is handled in getMergedPuckConfig
  }
}

/**
 * Hide a core component from the editor
 */
export function hideComponent(name: string): void {
  if (!clientConfig.puckConfig.hiddenComponents.includes(name)) {
    clientConfig.puckConfig.hiddenComponents.push(name);
  }
}

/**
 * Show a previously hidden component
 */
export function showComponent(name: string): void {
  const index = clientConfig.puckConfig.hiddenComponents.indexOf(name);
  if (index > -1) {
    clientConfig.puckConfig.hiddenComponents.splice(index, 1);
  }
}
