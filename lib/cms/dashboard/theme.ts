/**
 * Dashboard Theme System
 *
 * Provides theming for the customer-facing dashboard.
 * Theme settings are stored in the Setting table via the dashboard config.
 */

import { prisma } from '../db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardTheme {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  cardStyle: 'flat' | 'bordered' | 'elevated' | 'glass'
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  fontFamily?: string
  darkMode: boolean
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_DASHBOARD_THEME: DashboardTheme = {
  primaryColor: '#0066cc',
  accentColor: '#6366f1',
  backgroundColor: '#f9fafb',
  cardStyle: 'bordered',
  borderRadius: 'md',
  darkMode: false,
}

// ---------------------------------------------------------------------------
// Theme -> CSS Custom Properties
// ---------------------------------------------------------------------------

const BORDER_RADIUS_MAP: Record<DashboardTheme['borderRadius'], string> = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
}

const CARD_STYLE_PROPERTIES: Record<DashboardTheme['cardStyle'], Record<string, string>> = {
  flat: {
    '--dashboard-card-border': 'none',
    '--dashboard-card-shadow': 'none',
    '--dashboard-card-bg': 'var(--dashboard-bg)',
    '--dashboard-card-backdrop': 'none',
  },
  bordered: {
    '--dashboard-card-border': '1px solid var(--dashboard-border)',
    '--dashboard-card-shadow': 'none',
    '--dashboard-card-bg': 'white',
    '--dashboard-card-backdrop': 'none',
  },
  elevated: {
    '--dashboard-card-border': 'none',
    '--dashboard-card-shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '--dashboard-card-bg': 'white',
    '--dashboard-card-backdrop': 'none',
  },
  glass: {
    '--dashboard-card-border': '1px solid rgba(255,255,255,0.2)',
    '--dashboard-card-shadow': '0 4px 30px rgba(0, 0, 0, 0.1)',
    '--dashboard-card-bg': 'rgba(255, 255, 255, 0.7)',
    '--dashboard-card-backdrop': 'blur(8px)',
  },
}

/** Convert a DashboardTheme into a CSS custom properties object */
export function themeToCssProperties(theme: DashboardTheme): Record<string, string> {
  const cardProps = CARD_STYLE_PROPERTIES[theme.cardStyle] || CARD_STYLE_PROPERTIES.bordered

  return {
    '--dashboard-primary': theme.primaryColor,
    '--dashboard-accent': theme.accentColor,
    '--dashboard-bg': theme.backgroundColor,
    '--dashboard-radius': BORDER_RADIUS_MAP[theme.borderRadius] || BORDER_RADIUS_MAP.md,
    '--dashboard-border': theme.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    ...(theme.fontFamily ? { '--dashboard-font': theme.fontFamily } : {}),
    ...cardProps,
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const THEME_SETTINGS_KEY = 'dashboard.theme'

/** Load dashboard theme from the database */
export async function getDashboardTheme(): Promise<DashboardTheme> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: THEME_SETTINGS_KEY },
    })

    if (setting?.value) {
      const stored = JSON.parse(setting.value) as Partial<DashboardTheme>
      return { ...DEFAULT_DASHBOARD_THEME, ...stored }
    }
  } catch (error) {
    console.error('Error loading dashboard theme:', error)
  }

  return { ...DEFAULT_DASHBOARD_THEME }
}

/** Save dashboard theme to the database */
export async function saveDashboardTheme(theme: Partial<DashboardTheme>): Promise<DashboardTheme> {
  const current = await getDashboardTheme()
  const merged: DashboardTheme = { ...current, ...theme }

  await prisma.setting.upsert({
    where: { key: THEME_SETTINGS_KEY },
    create: {
      key: THEME_SETTINGS_KEY,
      value: JSON.stringify(merged),
      group: 'dashboard',
      encrypted: false,
    },
    update: {
      value: JSON.stringify(merged),
    },
  })

  return merged
}

/** Fetch theme from the client side via API */
export async function fetchDashboardTheme(): Promise<DashboardTheme> {
  try {
    const res = await fetch('/api/settings?group=dashboard.theme')
    if (res.ok) {
      const data = await res.json()
      if (data['dashboard.theme']) {
        return { ...DEFAULT_DASHBOARD_THEME, ...data['dashboard.theme'] }
      }
    }
  } catch {
    // Fall back to defaults
  }
  return { ...DEFAULT_DASHBOARD_THEME }
}
