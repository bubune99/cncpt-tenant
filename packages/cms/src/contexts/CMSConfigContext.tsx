'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { AdminShellConfig } from '../app/admin/AdminShell';

interface CMSConfigContextValue {
  basePath: string;
  siteUrl: string;
  siteName?: string;
  userRole: string;
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
  config: AdminShellConfig;
}) {
  const basePath = config.basePath || '';
  const siteUrl = config.siteUrl || '/';
  const siteName = config.siteName;
  const userRole = config.userRole || 'Super Admin';

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
      buildPath: (path) => path,
      buildApiPath: (path) => path,
    };
  }
  return context;
}
