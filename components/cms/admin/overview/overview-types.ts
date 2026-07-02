/**
 * Grainy Overview — shared types, layout persistence, and formatting helpers.
 *
 * The Overview is a customizable widget dashboard. Every widget is wired to
 * REAL tenant data fetched by the admin page (see app/s/[subdomain]/admin/page.tsx);
 * there are no fixtures. Widgets without a backing data source are simply not
 * part of the registry.
 */

// ─────────────────────────────────────────────
// Real data shapes (adapted from the admin data APIs)
// ─────────────────────────────────────────────

/** Counts from /api/cms/admin/stats-simple */
export interface OverviewStats {
  readonly totalUsers: number;
  readonly totalProducts: number;
  readonly totalOrders: number;
  readonly totalBlogPosts: number;
}

/** One day of the analytics time-series (revenue in cents). */
export interface OverviewTimePoint {
  readonly date: string;
  readonly revenue: number;
  readonly orders: number;
}

/** Summary from /api/cms/analytics?range=30d (revenue in cents). */
export interface OverviewAnalytics {
  readonly revenue: number;
  readonly purchases: number;
  readonly uniqueVisitors: number;
  readonly pageViews: number;
  readonly timeSeries: readonly OverviewTimePoint[];
}

/** A normalized order row (total in cents). */
export interface OverviewOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly total: number;
  readonly createdAt: string;
  readonly status: string;
  readonly customerName: string;
  readonly stageLabel: string | null;
  readonly stageColor: string | null;
}

/** A normalized product row for the low-stock widget. */
export interface OverviewProduct {
  readonly id: string;
  readonly title: string;
  readonly stock: number;
  readonly lowStockThreshold: number;
  readonly status: string;
}

/** Everything the widgets render from. All fields are null/empty-safe. */
export interface OverviewData {
  readonly stats: OverviewStats | null;
  readonly analytics: OverviewAnalytics | null;
  readonly openOrders: readonly OverviewOrder[];
  readonly recentOrders: readonly OverviewOrder[];
  readonly lowStock: readonly OverviewProduct[];
}

/** Navigation callbacks — wired to the real admin routes by the screen. */
export interface NavHandlers {
  readonly onNav: (section: 'orders' | 'products' | 'customers' | 'analytics' | 'blog') => void;
  readonly onOpenOrder: (id: string) => void;
  readonly onOpenProduct: (id: string) => void;
}

// ─────────────────────────────────────────────
// Layout model + persistence
// ─────────────────────────────────────────────

export type WidgetId = 'sales' | 'revenue' | 'orderstrend' | 'snapshot' | 'queue' | 'lowstock' | 'activity';

/** Column span. 6-column grid: S=2, M=3, L=4, XL=6. */
export type WidgetSize = 2 | 3 | 4 | 6;

export interface WidgetSlot {
  readonly k: WidgetId;
  readonly s: WidgetSize;
}

export const SIZE_LABEL: Readonly<Record<WidgetSize, string>> = { 2: 'S', 3: 'M', 4: 'L', 6: 'XL' };
export const SIZE_ORDER: readonly WidgetSize[] = [2, 3, 4, 6];

export const DASH_STORAGE_KEY = 'grainy-dash-v1';

export const DEFAULT_LAYOUT: readonly WidgetSlot[] = [
  { k: 'sales', s: 6 },
  { k: 'revenue', s: 4 },
  { k: 'snapshot', s: 2 },
  { k: 'queue', s: 3 },
  { k: 'lowstock', s: 3 },
  { k: 'activity', s: 6 },
];

function isWidgetSize(n: unknown): n is WidgetSize {
  return n === 2 || n === 3 || n === 4 || n === 6;
}

/**
 * Read a persisted layout from localStorage, validating every slot against the
 * currently-registered widget ids. Any drift (removed widget, bad size) falls
 * back to the default layout so the dashboard can never render an empty/broken
 * grid from stale storage. SSR-safe: returns the default when there's no window.
 */
export function loadLayout(validIds: readonly string[]): readonly WidgetSlot[] {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT;
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(DASH_STORAGE_KEY) || 'null');
    if (
      Array.isArray(raw) &&
      raw.length > 0 &&
      raw.every(
        (w): w is WidgetSlot =>
          typeof w === 'object' && w !== null &&
          validIds.includes((w as { k?: unknown }).k as string) &&
          isWidgetSize((w as { s?: unknown }).s)
      )
    ) {
      return raw;
    }
  } catch {
    /* ignore malformed storage */
  }
  return DEFAULT_LAYOUT;
}

export function saveLayout(layout: readonly WidgetSlot[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DASH_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* storage full / unavailable — layout just won't persist */
  }
}

// ─────────────────────────────────────────────
// Formatting helpers (money is stored in cents everywhere)
// ─────────────────────────────────────────────

/** Format cents as a whole-dollar USD string, e.g. 190022 → "$1,900". */
export function fmtUSD(cents: number): string {
  return '$' + Math.round(cents / 100).toLocaleString('en-US');
}

/** Format cents with 2 decimals when needed, e.g. 19022 → "$190.22". */
export function fmtMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Compact relative time, e.g. "4m ago", "3h ago", "2d ago". */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Title-case a PENDING/PROCESSING style enum into "Pending"/"Processing". */
export function humanizeStatus(status: string): string {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
