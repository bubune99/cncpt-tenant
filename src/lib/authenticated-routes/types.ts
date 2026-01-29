/**
 * Authenticated Routes Types
 *
 * Type definitions for the authenticated route system with
 * configurable sidebars and Puck page integration.
 */

import { LucideIcon } from 'lucide-react';

/**
 * A navigation item in the sidebar
 */
export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Lucide icon name */
  icon?: string;
  /** Permission required to see this item */
  permission?: string;
  /** Is this a Puck-managed page? */
  isPuckPage?: boolean;
  /** Page ID if Puck-managed */
  pageId?: string;
  /** Sort order */
  order?: number;
  /** Is this item visible? */
  visible?: boolean;
  /** Badge text (e.g., "New", "Beta") */
  badge?: string;
  /** Badge variant */
  badgeVariant?: 'default' | 'success' | 'warning' | 'destructive';
}

/**
 * A group of navigation items
 */
export interface NavGroup {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Items in this group */
  items: NavItem[];
  /** Permission required to see this group */
  permission?: string;
  /** Sort order */
  order?: number;
  /** Is this group collapsible? */
  collapsible?: boolean;
  /** Is this group expanded by default? */
  defaultExpanded?: boolean;
}

/**
 * Configuration for an authenticated area
 */
export interface AuthenticatedAreaConfig {
  /** Unique identifier (e.g., 'dashboard', 'admin', 'app') */
  id: string;
  /** Display name */
  name: string;
  /** Base path (e.g., '/dashboard') */
  basePath: string;
  /** Path prefix for Puck-managed pages (e.g., '/dashboard/pages') */
  puckPagesPath?: string;
  /** Hardcoded navigation groups */
  staticNavGroups: NavGroup[];
  /** Permission required to access this area */
  permission?: string;
  /** Allow Puck to create pages in this area */
  allowPuckPages?: boolean;
  /** Where to show Puck pages in nav (group ID) */
  puckPagesNavGroup?: string;
  /** Layout configuration */
  layout?: {
    /** Show sidebar */
    showSidebar?: boolean;
    /** Sidebar width */
    sidebarWidth?: number;
    /** Show header */
    showHeader?: boolean;
    /** Show breadcrumbs */
    showBreadcrumbs?: boolean;
  };
}

/**
 * Puck page registration for an authenticated area
 */
export interface PuckPageRegistration {
  /** Page ID from database */
  pageId: string;
  /** Page title */
  title: string;
  /** Page slug */
  slug: string;
  /** Full path */
  path: string;
  /** Authenticated area this belongs to */
  areaId: string;
  /** Icon for navigation */
  icon?: string;
  /** Sort order in navigation */
  order?: number;
  /** Show in sidebar navigation */
  showInNav?: boolean;
  /** Permission required to view */
  permission?: string;
}

/**
 * Runtime navigation state
 */
export interface NavigationState {
  /** Static navigation from config */
  staticNav: NavGroup[];
  /** Dynamic Puck pages */
  puckPages: PuckPageRegistration[];
  /** Merged navigation */
  mergedNav: NavGroup[];
  /** Currently active path */
  activePath?: string;
  /** Expanded groups */
  expandedGroups: string[];
}

/**
 * User context for permission filtering
 */
export interface NavigationUserContext {
  /** User ID */
  userId: string;
  /** User's permissions set */
  permissions: Set<string>;
  /** User's roles */
  roles: string[];
}

/**
 * Result of filtering navigation for a user
 */
export interface FilteredNavigation {
  /** Filtered navigation groups */
  groups: NavGroup[];
  /** Count of hidden items due to permissions */
  hiddenCount: number;
}
