'use client';

import { createContext, useContext, ReactNode } from 'react';

/** Serializable nav item (no React component icons — uses string icon names) */
export interface ModuleNavItemData {
  name: string;
  href: string;
  icon: string;
  badgeKey?: string;
  helpKey?: string;
}

/** Serializable nav group from module system */
export interface ModuleNavGroupData {
  name: string;
  items: ModuleNavItemData[];
}

export interface CMSConfig {
  /** Base path prefix for all admin routes (e.g., '/cms/subdomain') */
  basePath?: string;
  /** Navigation groups to hide entirely */
  hiddenGroups?: string[];
  /** Individual navigation items to hide by name */
  hiddenItems?: string[];
  /** URL for "View Site" link */
  siteUrl?: string;
  /** Site name to display */
  siteName?: string;
  /** Optional site logo URL — rendered in the admin topbar in place of the dot */
  logoUrl?: string;
  /** User's role to display */
  userRole?: string;
  /** Whether to show the AI chat panel */
  showChat?: boolean;
  /** Whether this is demo mode (read-only, public access) */
  isDemo?: boolean;
  /** Module-driven navigation groups (overrides hardcoded nav when provided) */
  moduleNavGroups?: ModuleNavGroupData[];
}

interface CMSConfigContextValue {
  basePath: string;
  siteUrl: string;
  siteName?: string;
  userRole: string;
  isDemo: boolean;
  /** Build a path prefixed with the base path */
  buildPath: (path: string) => string;
  /** Build an API path prefixed for the current tenant */
  buildApiPath: (path: string) => string;
}

const CMSConfigContext = createContext<CMSConfigContextValue | null>(null);

export function CMSConfigProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: CMSConfig;
}) {
  const basePath = config.basePath || '';
  const siteUrl = config.siteUrl || '/';
  const siteName = config.siteName;
  const userRole = config.userRole || 'Super Admin';
  const isDemo = config.isDemo || false;

  // In multi-tenant mode, the middleware handles rewriting /admin/... to /s/[subdomain]/admin/...
  // so buildPath should return the path as-is. Links use plain /admin/... paths and the middleware
  // transparently rewrites them to the correct internal route.
  const buildPath = (path: string): string => {
    return path;
  };

  // Helper to build API paths for multi-tenant
  // E.g., /api/admin/stats -> /api/cms/subdomain/admin/stats
  const buildApiPath = (path: string): string => {
    // For now, API paths remain unchanged
    // In multi-tenant setup, the API routes would also be namespaced
    return path;
  };

  return (
    <CMSConfigContext.Provider
      value={{
        basePath,
        siteUrl,
        siteName,
        userRole,
        isDemo,
        buildPath,
        buildApiPath,
      }}
    >
      {children}
    </CMSConfigContext.Provider>
  );
}

export function useCMSConfig(): CMSConfigContextValue {
  const context = useContext(CMSConfigContext);
  if (!context) {
    // Return defaults when not in a CMS context (standalone CMS)
    return {
      basePath: '',
      siteUrl: '/',
      userRole: 'Super Admin',
      isDemo: false,
      buildPath: (path) => path,
      buildApiPath: (path) => path,
    };
  }
  return context;
}
