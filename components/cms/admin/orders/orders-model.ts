/**
 * Orders — shared model, real-status↔stage mapping, and formatters.
 *
 * The CMS Order model uses the Prisma `OrderStatus` enum
 * (PENDING · PROCESSING · SHIPPED · DELIVERED · CANCELLED · REFUNDED) and stores
 * every money value in **cents**. The Grainy fulfillment board works in four
 * human stages. This module is the single place those two worlds are reconciled,
 * so the list, cards, kanban, and detail screens all agree.
 */

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PAID'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'FAILED';

/** The four fulfillment stages shown as kanban lanes + filter segments. */
export type Stage = 'New' | 'In progress' | 'Shipped' | 'Delivered';

export const STAGES: readonly Stage[] = ['New', 'In progress', 'Shipped', 'Delivered'];

/** Grainy badge tone per stage (maps to `.badge-<tone>` in grainy.css). */
export type BadgeTone = 'blue' | 'ochre' | 'sage' | 'clay' | 'rust' | 'neutral';

export const STAGE_TONE: Record<Stage, BadgeTone> = {
  New: 'blue',
  'In progress': 'ochre',
  Shipped: 'sage',
  Delivered: 'clay',
};

/** CSS custom-property name for a stage's accent (used for kanban lane dots). */
export const STAGE_ACCENT: Record<Stage, string> = {
  New: 'var(--blue-500)',
  'In progress': 'var(--ochre-500)',
  Shipped: 'var(--sage-500)',
  Delivered: 'var(--clay-500)',
};

const STATUS_TO_STAGE: Record<OrderStatus, Stage | null> = {
  PENDING: 'New',
  PROCESSING: 'In progress',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: null,
  REFUNDED: null,
};

const STAGE_TO_STATUS: Record<Stage, OrderStatus> = {
  New: 'PENDING',
  'In progress': 'PROCESSING',
  Shipped: 'SHIPPED',
  Delivered: 'DELIVERED',
};

export function statusToStage(status: OrderStatus): Stage | null {
  return STATUS_TO_STAGE[status] ?? null;
}

export function stageToStatus(stage: Stage): OrderStatus {
  return STAGE_TO_STATUS[stage];
}

/** Badge tone + label for any status, including the off-board ones. */
export function statusBadge(status: OrderStatus): { tone: BadgeTone; label: string } {
  const stage = statusToStage(status);
  if (stage) return { tone: STAGE_TONE[stage], label: stage };
  if (status === 'CANCELLED') return { tone: 'rust', label: 'Cancelled' };
  return { tone: 'neutral', label: 'Refunded' };
}

export function paymentBadge(payment: PaymentStatus): { tone: BadgeTone; label: string } {
  switch (payment) {
    case 'PAID':
      return { tone: 'sage', label: 'Paid' };
    case 'UNPAID':
      return { tone: 'neutral', label: 'Unpaid' };
    case 'FAILED':
      return { tone: 'rust', label: 'Failed' };
    case 'REFUNDED':
      return { tone: 'rust', label: 'Refunded' };
    case 'PARTIALLY_REFUNDED':
      return { tone: 'ochre', label: 'Part. refund' };
    default:
      return { tone: 'neutral', label: payment };
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────

const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Format a cents integer as USD. */
export function money(cents: number): string {
  return CURRENCY.format((cents ?? 0) / 100);
}

/** Short "May 3" style date. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "May 3, 2:14 PM" style timestamp. */
export function dateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic warm accent for an avatar, derived from the name. */
export function avatarColor(seed: string): string {
  const ramps = ['--clay-500', '--sage-500', '--ochre-500', '--blue-500', '--plum-500', '--rust-500'];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `var(${ramps[h % ramps.length]})`;
}

// ── List row shape (transformed from the raw /api/cms/orders payload) ──────────

export interface OrderRow {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly itemUnits: number;
  readonly totalCents: number;
  readonly status: OrderStatus;
  readonly paymentStatus: PaymentStatus;
  readonly createdAt: string;
}

interface RawOrderItem {
  readonly quantity?: number;
}
interface RawCustomer {
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly email?: string | null;
}
export interface RawOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly email: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly total: number;
  readonly createdAt: string;
  readonly customer?: RawCustomer | null;
  readonly items?: readonly RawOrderItem[] | null;
}

const KNOWN_STATUS = new Set<OrderStatus>([
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);
const KNOWN_PAYMENT = new Set<PaymentStatus>([
  'UNPAID',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'FAILED',
]);

function coerceStatus(raw: string): OrderStatus {
  const up = (raw ?? '').toUpperCase();
  return KNOWN_STATUS.has(up as OrderStatus) ? (up as OrderStatus) : 'PENDING';
}
function coercePayment(raw: string): PaymentStatus {
  const up = (raw ?? '').toUpperCase();
  return KNOWN_PAYMENT.has(up as PaymentStatus) ? (up as PaymentStatus) : 'UNPAID';
}

/** Transform one raw API order into the display row shape. */
export function toOrderRow(raw: RawOrder): OrderRow {
  const name = [raw.customer?.firstName, raw.customer?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const items = raw.items ?? [];
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    customerName: name || raw.customer?.email || raw.email || 'Guest',
    customerEmail: raw.customer?.email || raw.email || '',
    itemUnits: items.reduce((sum, it) => sum + (it.quantity ?? 0), 0),
    totalCents: raw.total ?? 0,
    status: coerceStatus(raw.status),
    paymentStatus: coercePayment(raw.paymentStatus),
    createdAt: raw.createdAt,
  };
}
