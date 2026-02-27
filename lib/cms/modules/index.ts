/**
 * CMS Module System -- barrel export
 */

export type {
  ModuleManifest,
  ModuleNavContribution,
  ModuleNavItem,
  ResolvedModule,
  ModulePreset,
} from "./types"

export {
  getModuleRegistry,
  getEnabledModules,
  getEnabledModulesForTenant,
  isModuleEnabled,
  isModuleEnabledForTenant,
  getModuleConfig,
  clearModuleCache,
} from "./registry"

export { assembleNavigation } from "./navigation"
export type { NavGroup, NavItem } from "./navigation"

export { getEnabledBlockCategories } from "./blocks"

export { withModule } from "./middleware"

export { MODULE_PRESETS, applyPreset } from "./presets"
