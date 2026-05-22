'use client';

/**
 * Atlas Customer Orders List (D3)
 * Filterable history table with status/year chip filters.
 * Uses --wl-* tokens exclusively.
 */

import { useState } from 'react';
import Link from 'next/link';
import { OrderStatusPill } from '@/components/cms/account/OrderStatusPill';
import { useCustomerOrders, type Order } from '@/components/cms/account-dashboard/hooks';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getYear(dateString: string): string {
  return new Date(dateString).getFullYear().toString();
}

type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

interface ChipProps {
  readonly active: boolean;
  readonly label: string;
  readonly count?: number;
  readonly onClick: () => void;
}

function Chip({ active, label, count, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        fontFamily: 'var(--wl-font-mono)',
        fontSize: 10.5,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        color: active ? 'var(--wl-accent-fg)' : 'var(--wl-text-soft)',
        background: active ? 'var(--wl-accent)' : 'transparent',
        border: `1px solid ${active ? 'var(--wl-accent)' : 'var(--wl-rule)'}`,
        borderRadius: 999,
        cursor: 'pointer',
      }}
    >
      {label}
      {count !== undefined && (
        <span
          style={{
            background: active ? 'rgba(255,255,255,.2)' : 'var(--wl-surface-2)',
            padding: '1px 5px',
            borderRadius: 999,
            fontSize: 9,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const limit = 12;

  const { orders, total, isLoading, isError } = useCustomerOrders({
    limit,
    offset: page * limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const totalPages = Math.ceil(total / limit);

  const years = [...new Set(orders.map((o) => getYear(o.createdAt)))].sort().reverse();

  return (
    <div>
      {/* Page head */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 18,
          paddingBottom: 18,
          borderBottom: '1px solid var(--wl-rule)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10.5,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--wl-text-soft)',
              marginBottom: 6,
            }}
          >
            <Link href="/account" style={{ color: 'var(--wl-text-soft)', textDecoration: 'none' }}>Account</Link>
            <span style={{ color: 'var(--wl-text-faint)', margin: '0 6px' }}>/</span>
            <span style={{ color: 'var(--wl-text)' }}>Orders</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontWeight: 500,
              fontSize: 38,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Your{' '}
            <em
              style={{ fontStyle: 'italic', fontWeight: 400 }}
            >
              orders
            </em>
          </h1>
          <div
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              color: 'var(--wl-text-soft)',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {total > 0 ? `${total} orders` : 'No orders yet'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>
          <button
            style={{
              fontFamily: 'var(--wl-font-body)',
              fontSize: 12,
              padding: '5px 10px',
              border: '1px solid var(--wl-rule)',
              color: 'var(--wl-text-soft)',
              borderRadius: 'var(--wl-radius-sm)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 16,
          marginBottom: 14,
        }}
      >
        {(
          [
            ['all',        'All'],
            ['processing', 'Processing'],
            ['shipped',    'Shipped'],
            ['delivered',  'Delivered'],
            ['returned',   'Returned'],
            ['cancelled',  'Cancelled'],
          ] as const
        ).map(([key, label]) => (
          <Chip
            key={key}
            active={statusFilter === key}
            label={label}
            onClick={() => { setStatusFilter(key); setPage(0); }}
          />
        ))}

        {years.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 10,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--wl-text-faint)',
              }}
            >
              Year
            </span>
            {years.map((yr) => (
              <Chip key={yr} active={false} label={yr} onClick={() => {}} />
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          padding: '4px 16px',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--wl-text-faint)' }}>
            Loading…
          </div>
        ) : isError ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--wl-text-soft)' }}>
            Failed to load orders. Please try again.
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--wl-text-soft)',
              }}
            >
              No orders found.
            </div>
            <Link
              href="/shop"
              style={{
                display: 'inline-block',
                marginTop: 10,
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 11,
                color: 'var(--wl-accent)',
                textDecoration: 'none',
              }}
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {[
                  { label: 'Order',  width: 100 },
                  { label: 'Placed', width: 130 },
                  { label: 'Items',  width: undefined },
                  { label: 'Status', width: 150 },
                  { label: 'Total',  width: 100, num: true },
                  { label: '',       width: 80 },
                ].map((h) => (
                  <th
                    key={h.label}
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 9.5,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: 'var(--wl-text-faint)',
                      textAlign: h.num ? 'right' : 'left',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--wl-rule)',
                      fontWeight: 500,
                      width: h.width,
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order: Order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: '1px solid var(--wl-rule-soft)' }}
                >
                  <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                    <span style={{ fontFamily: 'var(--wl-font-mono)', fontWeight: 600 }}>
                      #{order.orderNumber}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                    <div
                      style={{
                        fontFamily: 'var(--wl-font-display)',
                        fontStyle: 'italic',
                        color: 'var(--wl-text-soft)',
                        fontSize: 13,
                      }}
                    >
                      {formatDate(order.createdAt)}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 10,
                        color: 'var(--wl-text-faint)',
                        letterSpacing: '.04em',
                      }}
                    >
                      {getYear(order.createdAt)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                    <div
                      style={{
                        fontFamily: 'var(--wl-font-display)',
                        fontSize: 14,
                        lineHeight: 1.15,
                      }}
                    >
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                    <OrderStatusPill status={order.status} />
                  </td>
                  <td
                    style={{
                      padding: '12px 10px',
                      verticalAlign: 'middle',
                      textAlign: 'right',
                      fontFamily: 'var(--wl-font-mono)',
                    }}
                  >
                    {formatCurrency(order.total)}
                  </td>
                  <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                    <Link
                      href={`/account/orders/${order.id}`}
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 11,
                        color: 'var(--wl-accent)',
                        textDecoration: 'none',
                        letterSpacing: '.02em',
                      }}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 14,
            paddingTop: 12,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--wl-text-soft)',
            }}
          >
            Showing {page * limit + 1} – {Math.min((page + 1) * limit, total)} of {total}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 12,
                padding: '5px 10px',
                border: '1px solid var(--wl-rule)',
                color: 'var(--wl-text-soft)',
                borderRadius: 'var(--wl-radius-sm)',
                background: 'transparent',
                cursor: page === 0 ? 'default' : 'pointer',
                opacity: page === 0 ? 0.4 : 1,
              }}
            >
              ← Older
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 12,
                padding: '5px 10px',
                border: '1px solid var(--wl-text)',
                color: 'var(--wl-text)',
                borderRadius: 'var(--wl-radius-sm)',
                background: 'var(--wl-surface)',
                cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                opacity: page >= totalPages - 1 ? 0.4 : 1,
              }}
            >
              Load more
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
