/**
 * Template System
 *
 * Provides seeded templates and template management
 */

// Types
export * from "./types";

// Registry
export {
  getTemplateRegistry,
  registerTemplatePlugin,
  unregisterTemplatePlugin,
} from "./registry";

// Initialization
export {
  initializeTemplates,
  isTemplatesInitialized,
  ensureTemplatesInitialized,
} from "./init";

// Page creation
export {
  createPageFromTemplate,
  importV0AsPage,
  listTemplates,
  listTemplatesByCategory,
  searchTemplates,
} from "./page-creator";

// Built-in plugin
export { builtinTemplatesPlugin } from "./plugins/builtin";
