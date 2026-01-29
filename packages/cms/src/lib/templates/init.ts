/**
 * Template System Initialization
 *
 * Registers built-in templates and any plugins
 */

import { registerTemplatePlugin } from "./registry";
import { builtinTemplatesPlugin } from "./plugins/builtin";

let initialized = false;

/**
 * Initialize the template system
 * Call this once at app startup
 */
export function initializeTemplates(): void {
  if (initialized) {
    return;
  }

  // Register built-in templates
  registerTemplatePlugin(builtinTemplatesPlugin);

  // Register any additional plugins from environment/config
  // This could be extended to load plugins dynamically

  initialized = true;
  console.log("Template system initialized");
}

/**
 * Check if templates are initialized
 */
export function isTemplatesInitialized(): boolean {
  return initialized;
}

/**
 * Ensure templates are initialized
 * Safe to call multiple times
 */
export function ensureTemplatesInitialized(): void {
  if (!initialized) {
    initializeTemplates();
  }
}

export default initializeTemplates;
