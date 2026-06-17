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

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import useSWR from 'swr';
import { useAuth } from '@/hooks/use-auth';
import { WizardProvider } from '@/contexts/WizardContext';
import { CMSConfigProvider, type CMSConfig, type ModuleNavGroupData } from '@/contexts/CMSConfigContext';
import { HelpProvider, WalkthroughProvider, useHelpOptional } from '@/components/cms/help-system';
import { HelpCircle, Compass, Moon, Sun } from 'lucide-react';
import { AdminChat } from '@/components/cms/admin-chat';
import { SpotlightHostClient } from '@/components/cms/spotlight/SpotlightHostClient';
import { AgentNavRail } from '@/components/cms/admin/agent-nav-rail';
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
    logoUrl,
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
  // The /builder route (PageBuilder) now carries its own docked toolbar Exit;
  // the /editor route (PageSettingsEditorClient) has no toolbar, so it still
  // needs the floating Exit below.
  const isContentBuilder = /\/admin\/pages\/[^/]+\/builder(\/|$)/.test(normalizedPath);
  if (isBuilder && (user || isDemo)) {
    return (
      <CMSConfigProvider config={config}>
        <HelpProvider>
          <WizardProvider>
            <div className="atlas" style={{ height: '100vh', background: 'var(--canvas)', overflow: 'hidden', position: 'relative' }}>
              {/* /builder docks its Exit in the PageBuilder toolbar; /editor has
                  no toolbar, so keep a floating Exit there only. */}
              {!isContentBuilder && (
                <Link
                  href={sectionHref('/admin/pages')}
                  title="Back to the CMS"
                  data-tour-id="builder-exit"
                  style={{
                    position: 'fixed', top: 10, left: 12, zIndex: 60,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    height: 30, padding: '0 11px 0 9px', borderRadius: 8,
                    background: 'var(--paper)', border: '1px solid var(--rule)',
                    color: 'var(--ink-soft)', fontSize: 12.5, textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,.12)',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                  Exit
                </Link>
              )}
              {children}
              {/* Spotlight host + nav rail so the builder assistant can teach
                  the editor UI (spotlight_steps / navigate_to_route). */}
              <SpotlightHostClient />
              <AgentNavRail />
            </div>
          </WizardProvider>
        </HelpProvider>
      </CMSConfigProvider>
    );
  }

  return (
    <CMSConfigProvider config={config}>
      <HelpProvider>
        <WalkthroughProvider>
        <WizardProvider>
          {/* Atlas root — all atlas.css classes activate here */}
          <div className="atlas" style={{ height: '100vh', overflow: 'hidden', background: 'var(--canvas)' }}>

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
              style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', border: 'none', borderRadius: 0 }}
              data-tour-id="admin-page-frame"
            >
              {/* ── Top bar (38px) ── */}
              <div className="topbar" data-tour-id="admin-header">
                <div className="store" data-tour-id="header-store-name">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="store-logo" />
                  ) : (
                    <span className="store-dot" />
                  )}
                  <span>{siteName ?? displayUser?.primaryEmail?.split('@')[0] ?? 'Studio'}</span>
                  {siteUrl && siteUrl !== '/' && (
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginLeft: 4 }}>
                      · {siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  )}
                </div>
                {/* Breadcrumb to the active section (dirH-style) */}
                {(() => {
                  const active = navItems.find(i => isActiveLink(i.href));
                  if (!active || active.href === '/admin') return null;
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 10, fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{active.name}</span>
                    </span>
                  );
                })()}
                <div className="right" data-tour-id="header-actions">
                  {/* Light / dark theme toggle */}
                  <ThemeToggleAdmin />
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
                  {/* Walkthroughs launcher + Help mode toggle (spotlight engine) */}
                  <WalkthroughButton />
                  <HelpModeToggle />
                  <div className="hdr-avatar" data-tour-id="header-user-name" title={displayName} aria-label={displayName}>{initials || displayName.slice(0, 2).toUpperCase()}</div>
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
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 9, fontSize: 12 }}>
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
                      <span aria-hidden="true" style={{ color: 'var(--ink-faint)' }}>·</span>
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

                {/* CMS AI assistant — docked as a flex column beside the main
                    content so opening it reflows the page (everything stays
                    visible) instead of floating over it. The collapsed launcher
                    + minimized strip are fixed-position, so they add no width
                    here. The page builder has its own in-canvas assistant, so
                    it's excluded there. */}
                {showChat && <AdminChat />}
                {/* Assistant nav/fill execution layer: the rail navigates from
                    the correct router context; the host renders spotlight
                    overlays the chat's spotlight_steps tool produces. */}
                <AgentNavRail />
                <SpotlightHostClient />
              </div>

              {/* ── Notification drawer ── */}
              <NotifDrawerAdmin open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        </WizardProvider>
        </WalkthroughProvider>
      </HelpProvider>
    </CMSConfigProvider>
  );
}

/**
 * Light / dark theme toggle — flips next-themes between light and dark. The
 * grainy.css dark token block keys off the `.dark` class next-themes sets, so
 * the whole `.atlas` chrome reskins to warm charcoal. Guarded with a mounted
 * flag to avoid a hydration mismatch on the icon.
 */
function ThemeToggleAdmin() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'inline-flex', alignItems: 'center', color: 'inherit' }}
    >
      {mounted && isDark ? <Sun size={15} strokeWidth={1.7} /> : <Moon size={15} strokeWidth={1.7} />}
    </button>
  );
}

/**
 * Help-mode toggle — enters/exits the interactive help overlay (also Ctrl+Q).
 * The HelpProvider renders the overlay/message-bar when helpMode is active.
 */
function HelpModeToggle() {
  const help = useHelpOptional();
  const isActive = help?.helpMode?.isActive ?? false;
  return (
    <button
      onClick={() => help?.toggleHelpMode()}
      title={isActive ? 'Exit help mode (Ctrl+Q)' : 'Enter help mode (Ctrl+Q)'}
      aria-label={isActive ? 'Exit help mode' : 'Enter help mode'}
      aria-pressed={isActive}
      data-tour-id="header-help"
      style={{ background: isActive ? 'var(--accent)' : 'none', color: isActive ? 'var(--accent-fg, #fff)' : 'inherit', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'inline-flex', alignItems: 'center' }}
    >
      <HelpCircle size={15} strokeWidth={1.7} />
    </button>
  );
}

/**
 * Walkthroughs launcher — lists the available guided tours and starts one
 * (the WalkthroughProvider drives the spotlight engine for the running tour).
 */
function WalkthroughButton() {
  const help = useHelpOptional();
  const [open, setOpen] = useState(false);
  if (!help) return null;
  const tours = help.availableTours ?? [];
  return (
    <div style={{ position: 'relative' }} data-tour-id="header-tour-menu">
      <button
        onClick={() => setOpen(o => !o)}
        title="Guided walkthroughs"
        aria-label="Guided walkthroughs"
        aria-expanded={open}
        style={{ background: open ? 'var(--accent)' : 'none', color: open ? 'var(--accent-fg, #fff)' : 'inherit', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'inline-flex', alignItems: 'center' }}
      >
        <Compass size={15} strokeWidth={1.7} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, zIndex: 61, width: 240, background: 'var(--surface, #fff)', border: '1px solid var(--rule-soft, #e5e5e5)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.14)', padding: 6 }}>
            <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-soft, #888)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Walkthroughs</div>
            {tours.length === 0 ? (
              <div style={{ padding: '6px 8px', fontSize: 13, color: 'var(--text-soft, #888)' }}>No walkthroughs available yet</div>
            ) : (
              tours.map((t: { slug?: string; id?: string; title?: string; name?: string }) => {
                const slug = t.slug || t.id || '';
                return (
                  <button
                    key={slug}
                    role="menuitem"
                    onClick={() => { setOpen(false); help.startWalkthrough(slug); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', fontSize: 13, background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'inherit' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--canvas, #f5f5f5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    {t.title || t.name || slug}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
