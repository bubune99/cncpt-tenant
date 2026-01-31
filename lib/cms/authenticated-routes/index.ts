/**
 * Authenticated Routes Module
 *
 * Provides hardcoded authenticated areas with dynamic
 * Puck page integration and permission-based navigation.
 */

// Types
export type {
  NavItem,
  NavGroup,
  AuthenticatedAreaConfig,
  PuckPageRegistration,
  NavigationState,
  NavigationUserContext,
  FilteredNavigation,
} from './types';

// Configuration
export {
  authenticatedAreas,
  dashboardArea,
  appArea,
  getAreaConfig,
  getAreaByPath,
  isAuthenticatedPath,
  getPuckPagesPath,
} from './config';

// Navigation
export {
  getPuckPagesForArea,
  mergeNavigation,
  filterNavigationByPermissions,
  getAreaNavigation,
  registerPuckPageForArea,
  getBreadcrumbs,
} from './navigation';
