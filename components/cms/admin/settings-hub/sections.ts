/**
 * Settings hub section map — the single source of truth for the left rail.
 *
 * Every item points at a REAL settings surface. `route` values are plain
 * /admin/... paths (run through buildPath at render time). Items marked
 * `external: true` live outside the settings/ route tree (site-settings, roles,
 * modules, audit log) and are cross-links; internal items are child routes that
 * render inside the hub layout so the rail persists.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Store,
  Users,
  Boxes,
  ToggleRight,
  ScrollText,
  Palette,
  Globe,
  PanelTop,
  PanelBottom,
  Megaphone,
  LayoutDashboard,
  CreditCard,
  Mail,
  HardDrive,
  Sparkles,
  KeyRound,
  Github,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export interface SettingsNavItem {
  readonly key: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly route: string;
  readonly external?: boolean;
}

export interface SettingsNavGroup {
  readonly group: string;
  readonly items: readonly SettingsNavItem[];
}

export const SETTINGS_SECTIONS: readonly SettingsNavGroup[] = [
  {
    group: 'Workspace',
    items: [
      { key: 'general', label: 'General', icon: Store, route: '/admin/settings' },
      { key: 'team', label: 'Team & roles', icon: Users, route: '/admin/roles', external: true },
      { key: 'features', label: 'Features', icon: ToggleRight, route: '/admin/settings/features' },
      { key: 'modules', label: 'Modules', icon: Boxes, route: '/admin/modules', external: true },
      { key: 'audit', label: 'Audit log', icon: ScrollText, route: '/admin/audit-log', external: true },
    ],
  },
  {
    group: 'Storefront',
    items: [
      { key: 'branding', label: 'Branding', icon: Palette, route: '/admin/settings/branding' },
      { key: 'site', label: 'Site & SEO', icon: Globe, route: '/admin/site-settings', external: true },
      { key: 'header', label: 'Header', icon: PanelTop, route: '/admin/site-settings/header', external: true },
      { key: 'footer', label: 'Footer', icon: PanelBottom, route: '/admin/site-settings/footer', external: true },
      { key: 'announce', label: 'Announcement', icon: Megaphone, route: '/admin/site-settings/announcement', external: true },
      { key: 'dashboard', label: 'Dashboard theme', icon: LayoutDashboard, route: '/admin/settings/dashboard' },
    ],
  },
  {
    group: 'Commerce',
    items: [
      { key: 'payments', label: 'Payments', icon: CreditCard, route: '/admin/settings/payments' },
    ],
  },
  {
    group: 'Integrations',
    items: [
      { key: 'email', label: 'Email', icon: Mail, route: '/admin/settings/email' },
      { key: 'storage', label: 'Storage', icon: HardDrive, route: '/admin/settings/storage' },
      { key: 'ai', label: 'AI & Chat', icon: Sparkles, route: '/admin/settings/ai' },
      { key: 'api-keys', label: 'API keys', icon: KeyRound, route: '/admin/settings/api-keys' },
      { key: 'github', label: 'GitHub', icon: Github, route: '/admin/settings/github' },
    ],
  },
  {
    group: 'Advanced',
    items: [
      { key: 'auth', label: 'Auth & SSO', icon: ShieldCheck, route: '/admin/settings/auth' },
      { key: 'environment', label: 'Environment', icon: Terminal, route: '/admin/settings/environment' },
    ],
  },
];
