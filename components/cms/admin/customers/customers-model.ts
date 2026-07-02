/**
 * Customers — shared types + helpers for the Grainy admin screens.
 *
 * Types mirror the two real API payloads:
 *  - list  → GET /api/cms/admin/customers          (limited roster fields)
 *  - detail→ GET /api/cms/admin/customers/[id]      (full e-commerce dossier)
 *
 * Badge tones reuse the orders vocabulary so both screens share one palette.
 */

import type { BadgeTone } from '@/components/cms/admin/orders/orders-model';

// ── List payload (GET /api/cms/admin/customers) ───────────────────────────────

export interface CustomerListRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly businessOwner: { readonly id: string; readonly businessName: string };
  readonly stackAuthUserId?: string;
  readonly accessLevel: string;
  readonly storageUsed: number;
  readonly storageLimit: number;
  /** The list API populates this from `_count.orders` — it is the order count. */
  readonly designCount: number;
  readonly lastActivityAt: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface CustomerStats {
  readonly totalCustomers: number;
  readonly activeToday: number;
  readonly newThisMonth: number;
  readonly totalStorageUsed: number;
  readonly averageStoragePerCustomer: number;
}

export interface BusinessOwner {
  readonly id: string;
  readonly name: string;
}

// ── Detail payload (GET /api/cms/admin/customers/[id]) ─────────────────────────

export interface ApiOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly status: string;
  /** cents */
  readonly total: number;
  readonly itemCount: number;
  readonly createdAt: string;
}

export interface ApiAddress {
  readonly id: string;
  readonly label?: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly company?: string | null;
  readonly street1: string;
  readonly street2?: string | null;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
  readonly phone?: string | null;
  readonly isDefault: boolean;
}

export interface ApiCustomerDetail {
  readonly id: string;
  readonly email: string;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly phone?: string | null;
  readonly company?: string | null;
  readonly taxId?: string | null;
  readonly notes?: string | null;
  readonly tags: readonly string[];
  readonly stripeCustomerId?: string | null;
  readonly stripeSyncedAt?: string | null;
  readonly acceptsMarketing: boolean;
  readonly marketingOptInAt?: string | null;
  readonly marketingOptOutAt?: string | null;
  readonly totalOrders: number;
  /** cents */
  readonly totalSpent: number;
  /** cents */
  readonly averageOrder: number;
  readonly lastOrderAt?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly orders: readonly ApiOrder[];
  readonly addresses: readonly ApiAddress[];
}

// ── Customer notes (GET/POST /api/cms/admin/customers/[id]/notes) ──────────────

export interface CustomerNote {
  readonly id: string;
  readonly customerId: string;
  readonly authorId?: string | null;
  readonly content: string;
  readonly pinned: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type LifecycleStage = 'lead' | 'first' | 'repeat' | 'loyal' | 'vip';

// ── Formatting helpers ─────────────────────────────────────────────────────────

/** Format a cents amount as USD. */
export function money(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  '#b06a4f', '#4f5e3a', '#8a5a3c', '#3a6b8b', '#8b5e83', '#a3803a', '#5a6b52', '#9c4a3f',
] as const;

/** Deterministic warm-palette colour from an id/name. */
export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0];
}

/** "3d ago" / "yesterday" / "never" style relative time. */
export function relativeTime(ts: string | null | undefined): string {
  if (!ts) return 'never';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 0) return 'just now';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fullDate(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ts));
}

export function monthYear(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ── Badge / lifecycle mapping ───────────────────────────────────────────────────

export function tierBadge(accessLevel: string): { readonly label: string; readonly tone: BadgeTone } {
  switch (accessLevel.toLowerCase()) {
    case 'premium': return { label: 'Premium', tone: 'ochre' };
    case 'basic': return { label: 'Basic', tone: 'blue' };
    case 'standard': return { label: 'Standard', tone: 'neutral' };
    default: return { label: accessLevel ? accessLevel[0].toUpperCase() + accessLevel.slice(1) : 'Standard', tone: 'neutral' };
  }
}

export function statusBadge(isActive: boolean): { readonly label: string; readonly tone: BadgeTone } {
  return isActive ? { label: 'Active', tone: 'sage' } : { label: 'Dormant', tone: 'neutral' };
}

export function orderStatusTone(status: string): BadgeTone {
  switch (status.toLowerCase()) {
    case 'shipped':
    case 'delivered':
    case 'completed':
      return 'sage';
    case 'processing':
    case 'pending':
      return 'ochre';
    case 'cancelled':
    case 'refunded':
      return 'rust';
    default:
      return 'neutral';
  }
}

export function inferLifecycle(totalOrders: number): LifecycleStage {
  if (totalOrders <= 0) return 'lead';
  if (totalOrders === 1) return 'first';
  if (totalOrders <= 4) return 'repeat';
  if (totalOrders <= 10) return 'loyal';
  return 'vip';
}

export function lifecycleBadge(stage: LifecycleStage): { readonly label: string; readonly tone: BadgeTone } {
  switch (stage) {
    case 'lead': return { label: 'Lead', tone: 'neutral' };
    case 'first': return { label: 'First order', tone: 'blue' };
    case 'repeat': return { label: 'Repeat', tone: 'sage' };
    case 'loyal': return { label: 'Loyal', tone: 'clay' };
    case 'vip': return { label: 'VIP', tone: 'ochre' };
  }
}

/** Access level tags are stored as `access:<level>` on Customer.tags. */
export function accessLevelFromTags(tags: readonly string[]): string {
  const t = tags.find((x) => x.startsWith('access:'));
  return t ? t.replace('access:', '') : 'standard';
}

/** Tags that aren't the internal `access:` marker — the user-facing segment tags. */
export function visibleTags(tags: readonly string[]): string[] {
  return tags.filter((t) => !t.startsWith('access:'));
}

export function displayName(firstName?: string | null, lastName?: string | null, email?: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || email || 'Customer';
}
