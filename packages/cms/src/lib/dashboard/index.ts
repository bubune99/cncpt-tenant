/**
 * Customer Dashboard Configuration
 *
 * Functions for managing configurable customer dashboards.
 * Configuration is stored in the settings table under the 'dashboard' group.
 */

import { prisma } from '../db';
import {
  type DashboardConfig,
  type DashboardPreset,
  type DashboardTab,
  type DashboardWidget,
  getDefaultDashboardConfig,
  DASHBOARD_PRESETS,
} from './types';

// Re-export types
export * from './types';

const DASHBOARD_SETTINGS_KEY = 'dashboard.config';

/**
 * Get the current dashboard configuration
 */
export async function getDashboardConfig(): Promise<DashboardConfig> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: DASHBOARD_SETTINGS_KEY },
    });

    if (setting?.value) {
      const config = JSON.parse(setting.value) as DashboardConfig;
      // Merge with defaults to ensure new fields are present
      return {
        ...getDefaultDashboardConfig(config.preset),
        ...config,
      };
    }
  } catch (error) {
    console.error('Error loading dashboard config:', error);
  }

  // Return default e-commerce config
  return getDefaultDashboardConfig('ecommerce');
}

/**
 * Save dashboard configuration
 */
export async function saveDashboardConfig(config: Partial<DashboardConfig>): Promise<DashboardConfig> {
  const currentConfig = await getDashboardConfig();
  const newConfig: DashboardConfig = {
    ...currentConfig,
    ...config,
  };

  await prisma.setting.upsert({
    where: { key: DASHBOARD_SETTINGS_KEY },
    create: {
      key: DASHBOARD_SETTINGS_KEY,
      value: JSON.stringify(newConfig),
      group: 'dashboard',
      encrypted: false,
    },
    update: {
      value: JSON.stringify(newConfig),
    },
  });

  return newConfig;
}

/**
 * Apply a preset configuration
 */
export async function applyDashboardPreset(preset: DashboardPreset): Promise<DashboardConfig> {
  const presetConfig = getDefaultDashboardConfig(preset);
  return saveDashboardConfig(presetConfig);
}

/**
 * Enable or disable a tab
 */
export async function toggleTab(tabId: string, enabled: boolean): Promise<DashboardConfig> {
  const config = await getDashboardConfig();
  const tabIndex = config.tabs.findIndex((t) => t.id === tabId);

  if (tabIndex >= 0) {
    config.tabs[tabIndex].enabled = enabled;
    return saveDashboardConfig(config);
  }

  return config;
}

/**
 * Add a new tab
 */
export async function addTab(tab: Omit<DashboardTab, 'order'>): Promise<DashboardConfig> {
  const config = await getDashboardConfig();
  const maxOrder = Math.max(...config.tabs.map((t) => t.order), 0);

  config.tabs.push({
    ...tab,
    order: maxOrder + 1,
  });

  return saveDashboardConfig(config);
}

/**
 * Remove a tab
 */
export async function removeTab(tabId: string): Promise<DashboardConfig> {
  const config = await getDashboardConfig();
  config.tabs = config.tabs.filter((t) => t.id !== tabId);
  return saveDashboardConfig(config);
}

/**
 * Reorder tabs
 */
export async function reorderTabs(tabIds: string[]): Promise<DashboardConfig> {
  const config = await getDashboardConfig();

  config.tabs = tabIds
    .map((id, index) => {
      const tab = config.tabs.find((t) => t.id === id);
      if (tab) {
        return { ...tab, order: index + 1 };
      }
      return null;
    })
    .filter((t): t is DashboardTab => t !== null);

  return saveDashboardConfig(config);
}

/**
 * Add a widget to a tab
 */
export async function addWidget(
  tabId: string,
  widget: Omit<DashboardWidget, 'order'>
): Promise<DashboardConfig> {
  const config = await getDashboardConfig();
  const tabIndex = config.tabs.findIndex((t) => t.id === tabId);

  if (tabIndex >= 0) {
    const maxOrder = Math.max(...config.tabs[tabIndex].widgets.map((w) => w.order), 0);
    config.tabs[tabIndex].widgets.push({
      ...widget,
      order: maxOrder + 1,
    });
    return saveDashboardConfig(config);
  }

  return config;
}

/**
 * Remove a widget from a tab
 */
export async function removeWidget(tabId: string, widgetId: string): Promise<DashboardConfig> {
  const config = await getDashboardConfig();
  const tabIndex = config.tabs.findIndex((t) => t.id === tabId);

  if (tabIndex >= 0) {
    config.tabs[tabIndex].widgets = config.tabs[tabIndex].widgets.filter(
      (w) => w.id !== widgetId
    );
    return saveDashboardConfig(config);
  }

  return config;
}

/**
 * Toggle a widget's enabled state
 */
export async function toggleWidget(
  tabId: string,
  widgetId: string,
  enabled: boolean
): Promise<DashboardConfig> {
  const config = await getDashboardConfig();
  const tabIndex = config.tabs.findIndex((t) => t.id === tabId);

  if (tabIndex >= 0) {
    const widgetIndex = config.tabs[tabIndex].widgets.findIndex((w) => w.id === widgetId);
    if (widgetIndex >= 0) {
      config.tabs[tabIndex].widgets[widgetIndex].enabled = enabled;
      return saveDashboardConfig(config);
    }
  }

  return config;
}

/**
 * Get available presets with their descriptions
 */
export function getAvailablePresets(): Array<{
  id: DashboardPreset;
  name: string;
  description: string;
}> {
  return [
    {
      id: 'ecommerce',
      name: 'E-commerce',
      description: 'Orders, shipping tracking, payment methods, addresses, and wishlist',
    },
    {
      id: 'consulting',
      name: 'Consulting / Agency',
      description: 'Projects, milestones, invoices, meetings, and shared documents',
    },
    {
      id: 'services',
      name: 'Service Business',
      description: 'Appointment booking, service history, and scheduling',
    },
    {
      id: 'booking',
      name: 'Reservations',
      description: 'Simple booking and reservation management',
    },
    {
      id: 'saas',
      name: 'SaaS Platform',
      description: 'Usage statistics, billing, subscriptions, and API keys',
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Start from scratch and build your own dashboard layout',
    },
  ];
}
