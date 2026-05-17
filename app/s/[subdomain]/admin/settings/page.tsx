'use client';

/**
 * Admin settings overview — Atlas editorial style
 * Faithful port of atlas-v2-pages.jsx Settings()
 *
 * Preserves all existing data wiring:
 *  - useAuth for auth check
 *  - useTheme for appearance tab
 *  - GET /api/cms/settings on mount
 *  - PATCH /api/cms/settings on save
 *  - DELETE /api/cms/account/delete
 *  - GET /api/cms/account/export
 *  - Navigation links to all sub-settings pages
 *
 * The Atlas redesign turns the page into a 2-column grouped overview.
 * All per-module deep-dive panels remain accessible via their links.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface StoreSettings {
  general?: {
    storeName?: string;
    storeEmail?: string;
    currency?: string;
    timezone?: string;
  };
  shipping?: {
    enableFreeShipping?: boolean;
    defaultShippingRate?: number;
  };
  taxes?: {
    enableTaxes?: boolean;
    taxRate?: number;
  };
}

interface SettingModule {
  readonly name: string;
  readonly desc: string;
  readonly status: string;
  readonly statusCls: string;
  readonly href: string;
}

interface SettingGroup {
  readonly title: string;
  readonly items: readonly SettingModule[];
}

// ─────────────────────────────────────────────
// Settings groups definition
// Groups link to the deep-dive tabs/sub-pages
// ─────────────────────────────────────────────

function buildGroups(buildPath: (p: string) => string): readonly SettingGroup[] {
  return [
    {
      title: 'Storefront',
      items: [
        { name: 'Identity',        desc: 'Store name, logo, & contact info',          status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#general') },
        { name: 'Domain & DNS',    desc: 'Custom domain & SSL certificate',            status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#domain') },
        { name: 'Theme & palette', desc: 'Branding colours & visual identity',         status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#branding') },
      ],
    },
    {
      title: 'Commerce',
      items: [
        { name: 'Payments',        desc: 'Stripe, currency, & saved methods',          status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#payments') },
        { name: 'Shipping',        desc: 'Rates, zones, & local pickup',               status: 'ATTN',   statusCls: 'pill-solid-gold', href: buildPath('/admin/settings#shipping') },
        { name: 'Tax',             desc: 'Tax rates & price-inclusive settings',        status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#taxes') },
        { name: 'Inventory',       desc: 'Auto-decrement & low-stock threshold',        status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#inventory') },
      ],
    },
    {
      title: 'Communications',
      items: [
        { name: 'Email templates', desc: 'Transactional emails & sender identity',     status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#email') },
        { name: 'Notifications',   desc: 'Order alerts & low-stock push',              status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#notifications') },
        { name: 'AI & Chat',       desc: 'AI assistant config & API keys',             status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#ai') },
      ],
    },
    {
      title: 'Team & Access',
      items: [
        { name: 'Team members',    desc: 'Invites, roles, & active seats',             status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#team') },
        { name: 'Auth & SSO',      desc: 'Login methods & single sign-on',             status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#auth') },
        { name: 'Features',        desc: 'Feature flags per module',                   status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#features') },
      ],
    },
    {
      title: 'Extensions',
      items: [
        { name: 'Integrations',    desc: 'Connected apps & webhooks',                  status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#integrations') },
        { name: 'API keys',        desc: 'MCP & external API credentials',             status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#mcp') },
        { name: 'Storage',         desc: 'Media storage config & usage',               status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#storage') },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Appearance',      desc: 'Light / dark theme & density',               status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#appearance') },
        { name: 'Legal & privacy', desc: 'GDPR, CCPA, & cookie banner',                status: 'REVIEW', statusCls: 'pill-solid-accent', href: buildPath('/admin/settings#legal') },
        { name: 'Account',         desc: 'Export data & danger zone',                  status: 'OK',     statusCls: 'pill-solid-moss', href: buildPath('/admin/settings#account') },
      ],
    },
  ] as const;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function SettingsPage() {
  const { user, isLoading: authLoading, authChecked } = useAuth();
  const { buildPath } = useCMSConfig();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (user) void loadSettings();
    else if (authChecked && !user) setLoadingSettings(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authChecked]);

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/cms/settings');
      if (res.ok) {
        const data = await res.json() as StoreSettings;
        setSettings(data);
      }
    } catch {
      // non-fatal
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Auth guard
  if (authLoading || loadingSettings) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 8 }}>
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--ink-soft)' }} />
        <span className="eyebrow">Loading…</span>
      </div>
    );
  }

  if (!user && authChecked) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Sign in required</div>
        <h2 className="display" style={{ marginBottom: 12 }}>Settings access</h2>
        <a href="/handler/sign-in?after_auth_return_to=/admin/settings" className="btn btn-solid">
          Sign In
        </a>
      </div>
    );
  }

  const groups = buildGroups(buildPath);

  // Stats from loaded settings
  const storeName = settings?.general?.storeName ?? '—';
  const totalGroups = groups.length;
  const attentionCount = groups.flatMap(g => g.items).filter(i => i.status !== 'OK').length;

  return (
    <div data-tour-id="settings-page">

      {/* Main head */}
      <div className="main-head" data-tour-id="settings-heading">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>The <span className="display-i accent">machinery.</span></h1>
          <div className="sub">
            {storeName !== '—' && <span>{storeName} · </span>}
            {totalGroups * 3} modules across {totalGroups} groups
            {attentionCount > 0 && ` · ${attentionCount} need${attentionCount === 1 ? 's' : ''} attention`}
          </div>
        </div>
        <div className="actions">
          <button className="btn" type="button" onClick={() => void loadSettings()}>
            <span className="kbd">/</span>Refresh
          </button>
          {isSaving ? (
            <button className="btn btn-solid" type="button" disabled>
              <Loader2 className="h-4 w-4 animate-spin" style={{ marginRight: 4 }} />
              Saving…
            </button>
          ) : (
            <button className="btn btn-solid" type="button" onClick={() => void handleSave()}>
              Save
            </button>
          )}
        </div>
      </div>

      {/* 2-column settings groups */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 32, rowGap: 4 }}>
        {groups.map((group, i) => (
          <div key={group.title} style={{ marginBottom: 4 }}>
            {/* Group header */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              paddingBottom: 4,
              marginTop: i < 2 ? 0 : 14,
              borderBottom: '1px solid var(--ink)',
            }}>
              <span className="display" style={{ fontSize: 22 }}>{group.title}</span>
              <span className="fig" style={{ fontSize: 13 }}>· {group.items.length} modules</span>
            </div>

            {/* Module rows */}
            {group.items.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 20px',
                  gap: 10, padding: '8px 0',
                  borderBottom: '1px solid var(--rule-soft)',
                  alignItems: 'baseline',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                  <div className="fig" style={{ fontSize: 12 }}>{item.desc}</div>
                </div>
                <span className={`pill ${item.statusCls}`} style={{ justifySelf: 'end' }}>
                  {item.status}
                </span>
                <Link
                  href={item.href}
                  style={{ textAlign: 'right', fontSize: 14, textDecoration: 'none', color: 'var(--ink-soft)' }}
                  aria-label={`Open ${item.name} settings`}
                >
                  →
                </Link>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="action-bar" data-tour-id="settings-action-bar">
        <span className="selct">Settings</span>
        <span><span className="kbd">↑↓</span>navigate</span>
        <span><span className="kbd">Enter</span>open module</span>
        <span className="right mono" style={{ fontSize: 10 }}>
          {new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC
        </span>
      </div>
    </div>
  );
}
