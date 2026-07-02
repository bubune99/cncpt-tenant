/**
 * Smart Blocks — Barrel Export
 */

// Registry
export {
  registerSmartBlock,
  getSmartBlock,
  isSmartBlock,
  listSmartBlocks,
  listSmartBlocksByCategory,
  clearRegistry,
} from './registry'
export type {
  SmartBlockDefinition,
  SmartBlockProps,
  DataRequirement,
  EditorField,
} from './registry'

// Data Resolver
export {
  resolveSmartBlockData,
  serializeSmartBlockData,
  deserializeSmartBlockData,
  registerFetcher,
} from './data-resolver'
export type { SmartBlockDataMap } from './data-resolver'

// Commerce Data
export { registerCommerceFetchers } from './commerce-data'
export type { SerializedProduct, SerializedCategory } from './commerce-data'

// Dashboard Data
export { registerDashboardFetchers } from './dashboard-data'
export type { DashboardStats, RecentOrder } from './dashboard-data'

// Partial Data
export { registerPartialFetchers } from './partial-data'

// Form Data
export { registerFormFetchers } from './forms-data'
export type { SerializedForm } from './forms-data'

// Default Templates
export {
  defaultShopPageBlocks,
  defaultProductDetailBlocks,
  defaultCategoryPageBlocks,
} from './default-templates'
