/**
 * Atlas Customer Order Status Pill
 * Consistent status styling across order tables.
 * Uses --wl-* tokens exclusively.
 */

type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned';

interface PillStyle {
  readonly background: string;
  readonly color: string;
  readonly border?: string;
}

function getPillStyle(status: OrderStatus): PillStyle {
  switch (status) {
    case 'delivered':
      return { background: 'var(--wl-success)', color: '#fff' };
    case 'shipped':
    case 'in_transit':
    case 'paid':
    case 'packed':
    case 'processing':
      return { background: 'var(--wl-accent)', color: 'var(--wl-accent-fg)' };
    case 'returned':
    case 'refunded':
      return { background: 'transparent', color: 'var(--wl-text-soft)', border: '1px solid var(--wl-rule)' };
    case 'cancelled':
      return { background: 'var(--wl-text)', color: 'var(--wl-bg)' };
    default:
      return { background: 'transparent', color: 'var(--wl-text-soft)', border: '1px solid var(--wl-rule)' };
  }
}

function normalizeStatus(raw: string): OrderStatus {
  const s = raw.toLowerCase().replace(' ', '_') as OrderStatus;
  return s;
}

interface OrderStatusPillProps {
  readonly status: string;
}

export function OrderStatusPill({ status }: OrderStatusPillProps) {
  const normalized = normalizeStatus(status);
  const style = getPillStyle(normalized);

  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--wl-font-mono)',
        fontSize: 9.5,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        lineHeight: 1.4,
        borderRadius: 999,
        background: style.background,
        color: style.color,
        border: style.border ?? 'none',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
        }}
      />
      {label}
    </span>
  );
}
