/**
 * Authenticated Areas Configuration
 *
 * Defines the hardcoded authenticated areas with their
 * static navigation and Puck page settings.
 */

import type { AuthenticatedAreaConfig } from './types';

/**
 * Dashboard Area - Customer/User facing portal
 */
export const dashboardArea: AuthenticatedAreaConfig = {
  id: 'dashboard',
  name: 'Dashboard',
  basePath: '/dashboard',
  puckPagesPath: '/dashboard/pages',
  permission: undefined, // Any authenticated user
  allowPuckPages: true,
  puckPagesNavGroup: 'pages',
  layout: {
    showSidebar: true,
    sidebarWidth: 240,
    showHeader: true,
    showBreadcrumbs: true,
  },
  staticNavGroups: [
    {
      id: 'main',
      label: 'Main',
      order: 0,
      collapsible: false,
      defaultExpanded: true,
      items: [
        {
          id: 'dashboard-home',
          label: 'Home',
          href: '/dashboard',
          icon: 'Home',
          order: 0,
        },
        {
          id: 'dashboard-profile',
          label: 'My Profile',
          href: '/dashboard/profile',
          icon: 'User',
          order: 1,
        },
      ],
    },
    {
      id: 'pages',
      label: 'Pages',
      order: 1,
      collapsible: true,
      defaultExpanded: true,
      items: [
        // Puck pages will be dynamically added here
      ],
    },
    {
      id: 'account',
      label: 'Account',
      order: 2,
      collapsible: true,
      defaultExpanded: false,
      items: [
        {
          id: 'dashboard-orders',
          label: 'My Orders',
          href: '/dashboard/orders',
          icon: 'Package',
          order: 0,
        },
        {
          id: 'dashboard-settings',
          label: 'Settings',
          href: '/dashboard/settings',
          icon: 'Settings',
          order: 1,
        },
      ],
    },
  ],
};

/**
 * App Area - Application workspace
 */
export const appArea: AuthenticatedAreaConfig = {
  id: 'app',
  name: 'App',
  basePath: '/app',
  puckPagesPath: '/app/pages',
  permission: undefined,
  allowPuckPages: true,
  puckPagesNavGroup: 'workspace',
  layout: {
    showSidebar: true,
    sidebarWidth: 260,
    showHeader: true,
    showBreadcrumbs: true,
  },
  staticNavGroups: [
    {
      id: 'main',
      label: 'Main',
      order: 0,
      collapsible: false,
      defaultExpanded: true,
      items: [
        {
          id: 'app-home',
          label: 'Home',
          href: '/app',
          icon: 'LayoutDashboard',
          order: 0,
        },
      ],
    },
    {
      id: 'workspace',
      label: 'Workspace',
      order: 1,
      collapsible: true,
      defaultExpanded: true,
      items: [
        // Puck pages will be added here
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      order: 2,
      collapsible: true,
      defaultExpanded: true,
      items: [
        {
          id: 'app-files',
          label: 'Files',
          href: '/app/files',
          icon: 'FolderOpen',
          order: 0,
        },
        {
          id: 'app-calendar',
          label: 'Calendar',
          href: '/app/calendar',
          icon: 'Calendar',
          order: 1,
        },
      ],
    },
  ],
};

/**
 * All authenticated areas
 */
export const authenticatedAreas: AuthenticatedAreaConfig[] = [
  dashboardArea,
  appArea,
];

/**
 * Get area configuration by ID
 */
export function getAreaConfig(areaId: string): AuthenticatedAreaConfig | undefined {
  return authenticatedAreas.find(area => area.id === areaId);
}

/**
 * Get area configuration by path
 */
export function getAreaByPath(path: string): AuthenticatedAreaConfig | undefined {
  return authenticatedAreas.find(area => path.startsWith(area.basePath));
}

/**
 * Check if a path is within an authenticated area
 */
export function isAuthenticatedPath(path: string): boolean {
  return authenticatedAreas.some(area => path.startsWith(area.basePath));
}

/**
 * Get the Puck pages path for an area
 */
export function getPuckPagesPath(areaId: string): string | undefined {
  const area = getAreaConfig(areaId);
  return area?.puckPagesPath;
}
