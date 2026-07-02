'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AdminShell } from './AdminShell';
import { isDemoSubdomain, DEMO_CONFIG } from '@/lib/demo';
import type { ModuleNavGroupData } from '@/contexts/CMSConfigContext';
import { FeatureProvider } from '@/lib/cms/features/feature-context';
import { useBranding } from '@/hooks/use-branding';

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

/** Feature definitions: which nav items are gated by which feature */
const FEATURE_NAV_GATES: Record<string, string[]> = {
  // Module-level gating: feature key -> nav item names
  commerce: ['Products', 'Orders', 'Order Workflows', 'Shipping', 'Customers'],
  blog: ['Blog'],
  forms: ['Forms'],
  media: ['Media'],
  events: ['Events'],
  'email-marketing': ['Email Marketing'],
  analytics: ['Analytics'],
  lms: ['Courses'],
  workflows: ['Workflows'],
};

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
 * Filter navigation groups based on feature config.
 * Removes nav items whose parent module/feature is disabled.
 */
function filterNavByFeatures(
  groups: ModuleNavGroupData[],
  featureConfig: Record<string, boolean>
): ModuleNavGroupData[] {
  // Build a set of nav item names to hide
  const hiddenNames = new Set<string>();

  for (const [featureKey, navItems] of Object.entries(FEATURE_NAV_GATES)) {
    if (featureConfig[featureKey] === false) {
      for (const name of navItems) {
        hiddenNames.add(name);
      }
    }
  }

  if (hiddenNames.size === 0) return groups;

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !hiddenNames.has(item.name)),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * AdminShellWrapper
 *
 * Wraps the admin shell with subdomain-specific configuration.
 * Fetches module data and feature config to build dynamic,
 * feature-gated navigation from the CmsModule and feature systems.
 */
export function AdminShellWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const subdomain = params?.subdomain as string;
  const [moduleNavGroups, setModuleNavGroups] = useState<ModuleNavGroupData[] | undefined>(undefined);
  const [featureConfig, setFeatureConfig] = useState<Record<string, boolean>>({});

  // Check if this is demo mode
  const isDemo = isDemoSubdomain(subdomain);

  // White-label branding — fetched client-side (cached, non-blocking). We render
  // the fallback brand mark + subdomain name first, then swap to the tenant's
  // configured logo/name once branding resolves. Errors keep the fallback.
  const { branding, isLoading: brandingLoading, error: brandingError } = useBranding();
  const brandingReady = !brandingLoading && !brandingError;

  // Fetch modules and features on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        // Fetch modules and features in parallel
        const [modulesRes, featuresRes] = await Promise.all([
          fetch('/api/cms/admin/modules'),
          fetch('/api/cms/admin/features'),
        ]);

        if (cancelled) return;

        // Process modules
        if (modulesRes.ok) {
          const modulesJson = await modulesRes.json();
          if (modulesJson.ok && !cancelled) {
            const navGroups = assembleModuleNavigation(modulesJson.data);

            // Process features and filter nav
            if (featuresRes.ok) {
              const featuresJson = await featuresRes.json();
              if (featuresJson.ok && !cancelled) {
                const config = featuresJson.data.config as Record<string, boolean>;
                setFeatureConfig(config);
                const filteredGroups = filterNavByFeatures(navGroups, config);
                setModuleNavGroups(filteredGroups);
                return;
              }
            }

            // If features fetch failed, use unfiltered nav
            setModuleNavGroups(navGroups);
          }
        }
      } catch {
        // Silently fall back to hardcoded navigation
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Build config
  const config = {
    // Admin is served at /admin/* on the tenant subdomain (middleware maps host
    // → tenant), so nav/breadcrumb links must be host-relative /admin/...; a
    // /s/<subdomain> prefix 404s on the subdomain. Keep empty for bare hrefs.
    basePath: ``,
    siteUrl: '/',
    // Demo always shows the demo name; real tenants show their branded site name
    // once branding loads, falling back to the subdomain until then / on error.
    siteName: isDemo
      ? DEMO_CONFIG.siteName
      : (brandingReady && branding.siteName ? branding.siteName : subdomain),
    // White-label logo (fallback mark shown until branding resolves).
    logoUrl: brandingReady ? branding.logoUrl : undefined,
    logoDarkUrl: brandingReady ? branding.logoDarkUrl : undefined,
    logoAlt: brandingReady ? branding.logoAlt : undefined,
    // These admin/governance items live under Settings (see settings overview)
    // rather than the top-level sidebar, to keep the nav short.
    hiddenItems: ['Roles & Permissions', 'Audit Log', 'Modules'] as string[],
    showChat: true,
    isDemo,
    moduleNavGroups,
  };

  return (
    <FeatureProvider initialConfig={Object.keys(featureConfig).length > 0 ? featureConfig : undefined}>
      <AdminShell config={config}>
        {children}
      </AdminShell>
    </FeatureProvider>
  );
}
