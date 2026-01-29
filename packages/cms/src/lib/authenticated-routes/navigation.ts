/**
 * Navigation Service
 *
 * Handles merging static navigation with Puck pages
 * and filtering by user permissions.
 */

import { prisma } from '../db';
import { getAreaConfig } from './config';
import type {
  NavGroup,
  NavItem,
  NavigationUserContext,
  FilteredNavigation,
  PuckPageRegistration,
  AuthenticatedAreaConfig,
} from './types';

/**
 * Get Puck pages registered for an authenticated area
 */
export async function getPuckPagesForArea(areaId: string): Promise<PuckPageRegistration[]> {
  const area = getAreaConfig(areaId);
  if (!area?.allowPuckPages || !area.puckPagesPath) {
    return [];
  }

  try {
    // Query pages that belong to this authenticated area
    // Pages are identified by their slug starting with the area's puck pages path
    const pathPrefix = area.puckPagesPath.replace(/^\//, ''); // Remove leading slash

    const pages = await prisma.page.findMany({
      where: {
        slug: {
          startsWith: pathPrefix,
        },
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return pages.map((page, index) => ({
      pageId: page.id,
      title: page.metaTitle || page.title,
      slug: page.slug,
      path: `/${page.slug}`,
      areaId,
      order: index,
      showInNav: true,
    }));
  } catch (error) {
    console.error('Error fetching Puck pages for area:', areaId, error);
    return [];
  }
}

/**
 * Convert Puck page registrations to nav items
 */
function puckPagesToNavItems(pages: PuckPageRegistration[]): NavItem[] {
  return pages
    .filter(page => page.showInNav !== false)
    .map(page => ({
      id: `puck-page-${page.pageId}`,
      label: page.title,
      href: page.path,
      icon: page.icon || 'FileText',
      isPuckPage: true,
      pageId: page.pageId,
      order: page.order ?? 999,
      visible: true,
      permission: page.permission,
    }));
}

/**
 * Merge static navigation with Puck pages
 */
export function mergeNavigation(
  staticGroups: NavGroup[],
  puckPages: PuckPageRegistration[],
  puckPagesNavGroup?: string
): NavGroup[] {
  if (!puckPagesNavGroup || puckPages.length === 0) {
    return staticGroups;
  }

  const puckNavItems = puckPagesToNavItems(puckPages);

  return staticGroups.map(group => {
    if (group.id === puckPagesNavGroup) {
      // Merge Puck pages into this group
      const allItems = [...group.items, ...puckNavItems];
      // Sort by order
      allItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      return { ...group, items: allItems };
    }
    return group;
  });
}

/**
 * Filter navigation based on user permissions
 */
export function filterNavigationByPermissions(
  groups: NavGroup[],
  userContext: NavigationUserContext
): FilteredNavigation {
  let hiddenCount = 0;

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    // Super admin has all permissions
    if (userContext.permissions.has('*')) return true;
    // Check specific permission
    if (userContext.permissions.has(permission)) return true;
    // Check wildcard (e.g., 'pages.*' for 'pages.view')
    const [resource] = permission.split('.');
    if (userContext.permissions.has(`${resource}.*`)) return true;
    return false;
  };

  const filteredGroups = groups
    .filter(group => {
      if (!hasPermission(group.permission)) {
        hiddenCount++;
        return false;
      }
      return true;
    })
    .map(group => {
      const filteredItems = group.items.filter(item => {
        if (!hasPermission(item.permission)) {
          hiddenCount++;
          return false;
        }
        if (item.visible === false) {
          return false;
        }
        return true;
      });

      return { ...group, items: filteredItems };
    })
    // Remove empty groups
    .filter(group => group.items.length > 0);

  return { groups: filteredGroups, hiddenCount };
}

/**
 * Get full navigation for an authenticated area
 */
export async function getAreaNavigation(
  areaId: string,
  userContext?: NavigationUserContext
): Promise<{ groups: NavGroup[]; puckPages: PuckPageRegistration[] }> {
  const area = getAreaConfig(areaId);
  if (!area) {
    return { groups: [], puckPages: [] };
  }

  // Get Puck pages for this area
  const puckPages = await getPuckPagesForArea(areaId);

  // Merge static nav with Puck pages
  let groups = mergeNavigation(
    area.staticNavGroups,
    puckPages,
    area.puckPagesNavGroup
  );

  // Filter by permissions if user context provided
  if (userContext) {
    const filtered = filterNavigationByPermissions(groups, userContext);
    groups = filtered.groups;
  }

  return { groups, puckPages };
}

/**
 * Register a new Puck page in an authenticated area's navigation
 * This is called when a page is created via Puck
 */
export async function registerPuckPageForArea(
  pageId: string,
  areaId: string,
  options: {
    showInNav?: boolean;
    icon?: string;
    order?: number;
    permission?: string;
  } = {}
): Promise<void> {
  // For now, this is a no-op since we're using slug-based discovery
  // In the future, we could store navigation metadata separately
  console.log(`Registered page ${pageId} for area ${areaId}`, options);
}

/**
 * Get breadcrumbs for a path within an authenticated area
 */
export async function getBreadcrumbs(
  path: string,
  areaId: string
): Promise<Array<{ label: string; href: string }>> {
  const area = getAreaConfig(areaId);
  if (!area) return [];

  const breadcrumbs: Array<{ label: string; href: string }> = [
    { label: area.name, href: area.basePath },
  ];

  // Parse path segments
  const relativePath = path.replace(area.basePath, '');
  const segments = relativePath.split('/').filter(Boolean);

  let currentPath = area.basePath;
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Try to find a matching nav item
    const { groups } = await getAreaNavigation(areaId);
    let label = segment.charAt(0).toUpperCase() + segment.slice(1);

    for (const group of groups) {
      const item = group.items.find(i => i.href === currentPath);
      if (item) {
        label = item.label;
        break;
      }
    }

    breadcrumbs.push({ label, href: currentPath });
  }

  return breadcrumbs;
}
