/**
 * Authenticated Routes Module
 *
 * Provides hardcoded authenticated areas with dynamic
 * CMS page integration and permission-based navigation.
 */

// Types
export type {
  NavItem,
  NavGroup,
  AuthenticatedAreaConfig,
  CmsPageRegistration,
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
  getCmsPagesPath,
} from './config';

// Navigation
export {
  getCmsPagesForArea,
  mergeNavigation,
  filterNavigationByPermissions,
  getAreaNavigation,
  registerCmsPageForArea,
  getBreadcrumbs,
} from './navigation';
