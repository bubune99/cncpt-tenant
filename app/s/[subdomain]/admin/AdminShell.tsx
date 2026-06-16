'use client';

/**
 * AdminShell — Atlas editorial chrome
 *
 * Faithful port of atlas-v2-chrome.jsx Chrome component into Next.js/React.
 * Renders: 38px topbar (store + ⌘K hints + bell + name),
 *          editorial sidebar (Quick/Inbox + numbered sections 01-08 + account),
 *          page-frame wrapper with `className="atlas"`.
 *
 * All existing data wiring, auth guards, module-driven nav, demo mode, and
 * help system are PRESERVED from the original AdminShell.tsx.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/hooks/use-auth';
import { WizardProvider } from '@/contexts/WizardContext';
import { CMSConfigProvider, type CMSConfig, type ModuleNavGroupData } from '@/contexts/CMSConfigContext';
import { HelpProvider } from '@/components/cms/help-system';
import { AdminChat } from '@/components/cms/admin-chat';
import { NotifDrawerAdmin } from '@/components/cms/admin/NotifDrawerAdmin';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type AdminShellConfig = CMSConfig;

interface NavItem {
  readonly num: string;
  readonly name: string;
  readonly key: string;
  readonly badge?: string;
  readonly href: string;
  readonly helpKey?: string;
  readonly tourId?: string;
}

// ─────────────────────────────────────────────
// Default navigation (matches design's 01–08)
// ─────────────────────────────────────────────

const DEFAULT_NAV: readonly NavItem[] = [
  { num: '01', name: 'Dashboard', key: 'dashboard', href: '/admin',         helpKey: 'admin.sidebar.dashboard',  tourId: 'nav-admin-dashboard' },
  { num: '02', name: 'Pages',     key: 'pages',     href: '/admin/pages',   helpKey: 'admin.sidebar.pages',      tourId: 'nav-pages' },
  { num: '03', name: 'Orders',    key: 'orders',     href: '/admin/orders',  helpKey: 'admin.sidebar.orders',     tourId: 'nav-orders',    badge: '12' },
  { num: '04', name: 'Products',  key: 'products',  href: '/admin/products',helpKey: 'admin.sidebar.products',   tourId: 'nav-products' },
  { num: '05', name: 'Customers', key: 'customers', href: '/admin/customers',helpKey: 'admin.sidebar.customers', tourId: 'nav-customers' },
  { num: '06', name: 'Journal',   key: 'journal',   href: '/admin/blog',    helpKey: 'admin.sidebar.blog',       tourId: 'nav-blog' },
  { num: '07', name: 'Analytics', key: 'analytics', href: '/admin/analytics',helpKey:'admin.sidebar.analytics',  tourId: 'nav-admin-analytics' },
  { num: '08', name: 'Settings',  key: 'settings',  href: '/admin/settings',helpKey: 'admin.sidebar.settings',  tourId: 'nav-settings' },
] as const;

// Nav items that live outside the numbered section list
const EXTRA_NAV_ITEMS: ReadonlyArray<{ key: string; href: string }> = [
  { key: 'media',    href: '/admin/media' },
  { key: 'forms',    href: '/admin/forms' },
  { key: 'users',    href: '/admin/users' },
  { key: 'modules',  href: '/admin/modules' },
  { key: 'shipping', href: '/admin/shipping' },
] as const;

// ─────────────────────────────────────────────
// SWR fetcher
// ─────────────────────────────────────────────

const UNREAD_URL = '/api/cms/notifications/unread-counts';

interface UnreadCountsResponse {
  readonly counts: Readonly<Record<string, number>>;
  readonly total: number;
}

async function unreadFetcher(url: string): Promise<UnreadCountsResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<UnreadCountsResponse>;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Derive current section key from a pathname */
function sectionFromPath(path: string): string {
  if (path === '/admin' || path.endsWith('/admin')) return 'dashboard';
  const after = path.replace(/^.*\/admin\//, '');
  const seg = after.split('/')[0] ?? '';
  if (seg === 'blog') return 'journal';
  return seg;
}

/** Format "Tuesday, 16 May · 09:14 EST" */
function formatAdminDate(): string {
  const d = new Date();
  const day   = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  const time  = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' });
  return `${day}, ${month} · ${time}`;
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function AdminShell({
  children,
  config = {},
}: {
  children: React.ReactNode;
  config?: CMSConfig;
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    basePath = '',
    siteUrl = '/',
    siteName,
    showChat = true,
    isDemo = false,
    moduleNavGroups,
    hiddenItems = [],
  } = config;

  // Real unread count from API — refreshes every 60 s while shell is mounted
  const { data: unreadData } = useSWR<UnreadCountsResponse>(
    (user != null || isDemo) ? UNREAD_URL : null,
    unreadFetcher,
    { refreshInterval: 60000 }
  );

  const normalizePath = (p: string | null): string => {
    if (!p) return '';
    if (basePath && p.startsWith(basePath)) return p.slice(basePath.length) || '/';
    return p;
  };

  const normalizedPath = normalizePath(pathname);
  const activeSection  = sectionFromPath(normalizedPath);
  const unreadCount    = unreadData?.total ?? 0;

  // Build display user
  const displayUser = isDemo && !user
    ? { displayName: 'Demo User', primaryEmail: 'demo@cncptweb.com' }
    : user;

  const displayName = displayUser?.displayName ?? 'Admin';
  const initials    = displayName
    .split(' ')
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');

  // Build nav from module groups or defaults
  const navItems: NavItem[] = moduleNavGroups
    ? moduleNavGroups.flatMap((g: ModuleNavGroupData, gi: number) =>
        g.items
          .filter((it) => !hiddenItems.includes(it.name))
          .map((it, ii) => ({
            num: String(gi * 10 + ii + 1).padStart(2, '0'),
            name: it.name,
            key: it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            href: it.href,
            helpKey: it.helpKey,
          }))
      )
    : DEFAULT_NAV.filter(n => !hiddenItems.includes(n.name));

  if (!user && !isDemo) return <>{children}</>;

  const isActiveLink = (href: string) => {
    const normHref = href === '/admin' ? '/admin' : href;
    if (normHref === '/admin') return normalizedPath === '/admin';
    return normalizedPath.startsWith(normHref);
  };

  const sectionHref = (href: string) => {
    if (!basePath) return href;
    return `${basePath}${href}`;
  };

  // The page builder / editor is a focused editing surface — hand it the whole
  // screen (no admin topbar or sidebar competing with the canvas). It carries
  // its own toolbar for save/publish/back, so nothing is lost.
  const isBuilder = /\/admin\/pages\/[^/]+\/(builder|editor)(\/|$)/.test(normalizedPath);
  if (isBuilder && (user || isDemo)) {
    return (
      <CMSConfigProvider config={config}>
        <HelpProvider>
          <WizardProvider>
            <div className="atlas" style={{ height: '100vh', background: 'var(--canvas)', overflow: 'hidden' }}>
              {children}
            </div>
          </WizardProvider>
        </HelpProvider>
      </CMSConfigProvider>
    );
  }

  return (
    <CMSConfigProvider config={config}>
      <HelpProvider>
        <WizardProvider>
          {/* Atlas root — all atlas.css classes activate here */}
          <div className="atlas" style={{ minHeight: '100vh', background: 'var(--canvas)' }}>

            {/* Mobile backdrop */}
            {mobileOpen && (
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,.5)' }}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Mobile toggle (small screens only) */}
            <button
              className="btn"
              onClick={() => setMobileOpen(o => !o)}
              style={{ position: 'fixed', top: 8, left: 8, zIndex: 50, display: 'none' }}
              aria-label="Toggle menu"
              data-tour-id="admin-mobile-toggle"
            >
              ☰
            </button>

            {/* ── Outer page-frame ── */}
            <div
              className="page-frame"
              style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', border: 'none', borderRadius: 0 }}
              data-tour-id="admin-page-frame"
            >
              {/* ── Top bar (38px) ── */}
              <div className="topbar" data-tour-id="admin-header">
                <div className="store" data-tour-id="header-store-name">
                  <span className="store-dot" />
                  <span>{siteName ?? displayUser?.primaryEmail?.split('@')[0] ?? 'Studio'}</span>
                  {siteUrl && siteUrl !== '/' && (
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginLeft: 4 }}>
                      · {siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  )}
                </div>
                <div className="right" data-tour-id="header-actions">
                  <span data-tour-id="header-cmd-k">
                    <span className="kbd">⌘K</span>Jump · search · run
                  </span>
                  <span data-tour-id="header-cmd-n">
                    <span className="kbd">⌘N</span>New
                  </span>
                  {/* Bell + unread pip */}
                  <button
                    className={'bell' + (drawerOpen ? ' on' : '')}
                    onClick={() => setDrawerOpen(o => !o)}
                    aria-label={`Notifications (${unreadCount} unread)`}
                    aria-expanded={drawerOpen}
                    data-tour-id="header-notifications"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="bell-pip" aria-label={`${unreadCount} unread`}>{unreadCount}</span>
                    )}
                  </button>
                  <span style={{ color: 'var(--ink)' }} data-tour-id="header-user-name">{displayName}</span>
                </div>
              </div>

              {/* ── Two-column layout ── */}
              <div className="chrome" style={{ flex: 1 }}>

                {/* ── Sidebar ── */}
                <aside
                  className="sidebar"
                  data-tour-id="admin-sidebar"
                  style={{
                    transform: mobileOpen ? 'none' : undefined,
                  }}
                >
                  {/* Date */}
                  <div className="meta">
                    <div className="eyebrow">Today</div>
                    <div className="date">{formatAdminDate()}</div>
                  </div>

                  {/* Quick — Inbox */}
                  <div className="nav-h eyebrow" style={{ color: 'var(--ink-faint)', padding: '0 18px 6px' }}>Quick</div>
                  <Link
                    href={sectionHref('/admin/notifications')}
                    className={'inbox-link' + (activeSection === 'notifications' ? ' active' : '')}
                    onClick={() => setMobileOpen(false)}
                    data-tour-id="nav-inbox"
                  >
                    <span className="n">✦</span>
                    <span className="label">Inbox</span>
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                  </Link>

                  {/* Numbered sections */}
                  <nav className="nav" aria-label="Main navigation">
                    <div className="nav-h eyebrow" style={{ color: 'var(--ink-faint)' }}>Sections</div>
                    {navItems.map(item => {
                      const active = isActiveLink(item.href);
                      return (
                        <Link
                          key={item.key}
                          href={sectionHref(item.href)}
                          prefetch={false}
                          className={active ? 'active' : ''}
                          onClick={() => setMobileOpen(false)}
                          data-help-key={item.helpKey}
                          data-tour-id={item.tourId ?? `nav-${item.key}`}
                        >
                          <span className="n">{item.num}</span>
                          <span className="label">{item.name}</span>
                          {item.badge && <span className="badge">{item.badge}</span>}
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Account */}
                  <div className="acct" data-tour-id="header-user-menu">
                    <div className="eyebrow" style={{ color: 'var(--ink-faint)', marginBottom: 8 }}>Account</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="initials">{initials || 'AU'}</span>
                      <div>
                        <div style={{ fontSize: 13, lineHeight: 1.1 }}>{displayName}</div>
                        <div className="fig" style={{ fontSize: 11 }}>
                          {isDemo ? 'demo viewer' : 'admin'}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Link
                        href={siteUrl}
                        className="fig"
                        style={{ fontSize: 12, color: 'var(--ink-soft)', textDecoration: 'none' }}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-tour-id="nav-view-site"
                      >
                        ↗ Visit site
                      </Link>
                      {isDemo ? (
                        <Link
                          href="/pricing"
                          className="fig"
                          style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}
                          data-tour-id="nav-start-trial"
                        >
                          → Start free trial
                        </Link>
                      ) : (
                        <button
                          onClick={() => { setMobileOpen(false); signOut(); }}
                          className="fig"
                          style={{ fontSize: 12, color: 'var(--ink-soft)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                          data-tour-id="header-sign-out"
                        >
                          ← Sign out
                        </button>
                      )}
                    </div>
                  </div>
                </aside>

                {/* ── Main content ── */}
                <main className="main" data-tour-id="admin-main-content">
                  {children}
                </main>
              </div>

              {/* ── Notification drawer ── */}
              <NotifDrawerAdmin open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            </div>

            {/* AI Chat (page editor only) */}
            {showChat && normalizedPath.match(/\/admin\/pages\/[^/]+\/editor/) && <AdminChat />}
          </div>
        </WizardProvider>
      </HelpProvider>
    </CMSConfigProvider>
  );
}
