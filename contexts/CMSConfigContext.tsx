'use client';

import { createContext, useContext, ReactNode } from 'react';

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
  /** User's role to display */
  userRole?: string;
  /** Whether to show the AI chat panel */
  showChat?: boolean;
  /** Whether this is demo mode (read-only, public access) */
  isDemo?: boolean;
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

  // Helper to prefix paths with basePath
  const buildPath = (path: string): string => {
    if (!basePath) return path;
    // Replace /admin with basePath/admin
    return path.replace('/admin', `${basePath}/admin`);
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
