'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AdminShell } from './AdminShell';
import { isDemoSubdomain, DEMO_CONFIG } from '@/lib/demo';
import type { ModuleNavGroupData } from '@/contexts/CMSConfigContext';

/**
 * Serializable module data from API (no React components)
 */
interface ModuleNavContribution {
  group: string;
  items: { name: string; href: string; icon: string; badgeKey?: string; helpKey?: string }[];
}

interface ModuleData {
  slug: string;
  enabled: boolean;
  manifest: {
    adminNav?: ModuleNavContribution[];
  };
}

/** Desired display order for nav groups */
const GROUP_ORDER: Record<string, number> = {
  Main: 0,
  'E-Commerce': 1,
  Content: 2,
  System: 3,
};

/**
 * Build navigation groups from module data (client-side assembly).
 * Mirrors the logic in lib/cms/modules/navigation.ts but operates on
 * serializable data from the API.
 */
function assembleModuleNavigation(modules: ModuleData[]): ModuleNavGroupData[] {
  const groupMap = new Map<string, ModuleNavGroupData['items']>();

  for (const mod of modules) {
    if (!mod.enabled || !mod.manifest.adminNav) continue;

    for (const contribution of mod.manifest.adminNav) {
      const existing = groupMap.get(contribution.group) || [];

      for (const item of contribution.items) {
        if (!existing.some((e) => e.name === item.name)) {
          existing.push({
            name: item.name,
            href: item.href,
            icon: item.icon,
            helpKey: item.helpKey,
          });
        }
      }

      groupMap.set(contribution.group, existing);
    }
  }

  // Always add Modules link to System group
  const systemItems = groupMap.get('System') || [];
  if (!systemItems.some((e) => e.name === 'Modules')) {
    systemItems.push({
      name: 'Modules',
      href: '/admin/modules',
      icon: 'Puzzle',
      helpKey: 'admin.sidebar.modules',
    });
  }
  groupMap.set('System', systemItems);

  // Convert to array and sort by group order
  const groups: ModuleNavGroupData[] = Array.from(groupMap.entries()).map(
    ([name, items]) => ({ name, items })
  );

  groups.sort(
    (a, b) => (GROUP_ORDER[a.name] ?? 99) - (GROUP_ORDER[b.name] ?? 99)
  );

  return groups;
}

/**
 * AdminShellWrapper
 *
 * Wraps the admin shell with subdomain-specific configuration.
 * Fetches module data to build dynamic navigation from the CmsModule system.
 */
export function AdminShellWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const subdomain = params?.subdomain as string;
  const [moduleNavGroups, setModuleNavGroups] = useState<ModuleNavGroupData[] | undefined>(undefined);

  // Check if this is demo mode
  const isDemo = isDemoSubdomain(subdomain);

  // Fetch modules on mount to build module-driven navigation
  useEffect(() => {
    let cancelled = false;

    async function fetchModules() {
      try {
        const res = await fetch('/api/cms/admin/modules');
        if (!res.ok) return;
        const json = await res.json();
        if (json.ok && !cancelled) {
          const navGroups = assembleModuleNavigation(json.data);
          setModuleNavGroups(navGroups);
        }
      } catch {
        // Silently fall back to hardcoded navigation
      }
    }

    fetchModules();
    return () => { cancelled = true; };
  }, []);

  // Build config
  const config = {
    basePath: `/s/${subdomain}`,
    siteUrl: `/${subdomain}`,
    siteName: isDemo ? DEMO_CONFIG.siteName : subdomain,
    hiddenItems: [] as string[],
    showChat: true,
    isDemo,
    moduleNavGroups,
  };

  return (
    <AdminShell config={config}>
      {children}
    </AdminShell>
  );
}
