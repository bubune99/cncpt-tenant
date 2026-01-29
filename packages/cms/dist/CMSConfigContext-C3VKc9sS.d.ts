import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';

interface CMSConfig {
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
}
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
declare function CMSConfigProvider({ children, config, }: {
    children: ReactNode;
    config: CMSConfig;
}): react_jsx_runtime.JSX.Element;
declare function useCMSConfig(): CMSConfigContextValue;

export { CMSConfigProvider as C, type CMSConfig as a, useCMSConfig as u };
