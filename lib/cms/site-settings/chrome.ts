/**
 * Storefront Chrome Resolver
 *
 * Pure mappers that turn the admin-saved `header` / `footer` / `announcementBar`
 * JSON (from the SiteSettings table) into the typed props the storefront chrome
 * components consume. Every field is optional: when a value isn't configured the
 * mapper returns `undefined` so the component falls back to its built-in default,
 * keeping existing storefronts visually unchanged until an owner customizes them.
 */

import type { SiteSettingsData } from './index';

export interface ChromeNavLink {
  readonly href: string;
  readonly label: string;
  readonly openInNewTab?: boolean;
}

export interface ResolvedHeader {
  readonly navLinks?: ChromeNavLink[];
  readonly logoText?: string;
  readonly logoUrl?: string;
  readonly showSearch?: boolean;
  readonly showCart?: boolean;
  readonly showAccount?: boolean;
}

export interface ResolvedFooterColumn {
  readonly title: string;
  readonly links: ChromeNavLink[];
}

export interface ResolvedFooter {
  readonly columns?: ResolvedFooterColumn[];
  readonly socialLinks?: { readonly platform: string; readonly url: string }[];
  readonly copyrightText?: string;
  readonly tagline?: string;
  readonly logoText?: string;
  readonly logoUrl?: string;
}

export interface ResolvedAnnouncement {
  readonly message: string;
  readonly href?: string;
  readonly dismissible: boolean;
  readonly backgroundColor?: string;
  readonly textColor?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

function cleanLink(v: unknown): ChromeNavLink | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const label = asString(o.label);
  const href = asString(o.href);
  if (!label || !href) return null;
  return { label, href, openInNewTab: asBool(o.openInNewTab) };
}

function cleanLinks(v: unknown): ChromeNavLink[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const links = v.map(cleanLink).filter((l): l is ChromeNavLink => l !== null);
  return links.length > 0 ? links : undefined;
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function resolveHeader(settings: SiteSettingsData | null): ResolvedHeader {
  const h = (settings?.header ?? {}) as Record<string, unknown>;
  const logo = (h.logo ?? {}) as Record<string, unknown>;
  return {
    navLinks: cleanLinks(h.navLinks),
    logoText: asString(logo.text),
    logoUrl: asString(logo.imageUrl),
    showSearch: asBool(h.showSearch),
    showCart: asBool(h.showCart),
    showAccount: asBool(h.showAccount),
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export function resolveFooter(settings: SiteSettingsData | null): ResolvedFooter {
  const f = (settings?.footer ?? {}) as Record<string, unknown>;
  const logo = (f.logo ?? {}) as Record<string, unknown>;

  let columns: ResolvedFooterColumn[] | undefined;
  if (Array.isArray(f.columns)) {
    columns = f.columns
      .map((c) => {
        if (!c || typeof c !== 'object') return null;
        const o = c as Record<string, unknown>;
        const title = asString(o.title);
        const links = cleanLinks(o.links);
        if (!title || !links) return null;
        return { title, links };
      })
      .filter((c): c is ResolvedFooterColumn => c !== null);
    if (columns.length === 0) columns = undefined;
  }

  let socialLinks: { platform: string; url: string }[] | undefined;
  const rawSocial = f.socialLinks ?? settings?.socialLinks;
  if (Array.isArray(rawSocial)) {
    socialLinks = rawSocial
      .map((s) => {
        if (!s || typeof s !== 'object') return null;
        const o = s as Record<string, unknown>;
        const platform = asString(o.platform);
        const url = asString(o.url);
        if (!platform || !url) return null;
        return { platform, url };
      })
      .filter((s): s is { platform: string; url: string } => s !== null);
    if (socialLinks.length === 0) socialLinks = undefined;
  }

  return {
    columns,
    socialLinks,
    copyrightText: asString(f.copyrightText) ?? asString(f.copyright),
    tagline: asString(f.tagline),
    logoText: asString(logo.text),
    logoUrl: asString(logo.imageUrl),
  };
}

// ---------------------------------------------------------------------------
// Announcement bar
// ---------------------------------------------------------------------------

export function resolveAnnouncement(settings: SiteSettingsData | null): ResolvedAnnouncement | null {
  if (!settings?.showAnnouncementBar) return null;
  const a = (settings.announcementBar ?? {}) as Record<string, unknown>;
  const message = asString(a.message) ?? asString(a.text);
  if (!message) return null;
  return {
    message,
    href: asString(a.link) ?? asString(a.href),
    dismissible: asBool(a.dismissible) ?? true,
    backgroundColor: asString(a.backgroundColor),
    textColor: asString(a.textColor),
  };
}
