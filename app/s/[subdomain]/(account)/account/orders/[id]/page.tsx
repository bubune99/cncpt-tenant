'use client';

/**
 * Atlas Customer Order Detail + Tracking (D2)
 * Full timeline, items, addresses, summary.
 * Uses --wl-* tokens exclusively.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { TrackingTimeline } from '@/components/cms/account/TrackingTimeline';
import { OrderStatusPill } from '@/components/cms/account/OrderStatusPill';
import type { TrackingStep } from '@/components/cms/account/types';
import { useOrderTracking, type Order } from '@/components/cms/account-dashboard/hooks';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildTrackingSteps(
  orderStatus: string,
  trackingStatus?: string,
): readonly TrackingStep[] {
  const statuses = ['placed', 'paid', 'packed', 'shipped', 'delivered'] as const;
  type S = typeof statuses[number];

  const STATUS_MAP: Record<string, S> = {
    pending:    'placed',
    processing: 'packed',
    paid:       'paid',
    packed:     'packed',
    shipped:    'shipped',
    in_transit: 'shipped',
    TRANSIT:    'shipped',
    delivered:  'delivered',
    DELIVERED:  'delivered',
  };

  const currentKey: S = STATUS_MAP[trackingStatus ?? orderStatus] ?? 'placed';
  const currentIdx = statuses.indexOf(currentKey);

  return statuses.map((key, idx) => ({
    key,
    label: key === 'shipped' ? 'In transit' : key.charAt(0).toUpperCase() + key.slice(1),
    when:  idx < currentIdx ? 'done' : idx === currentIdx ? 'current' : 'estimated',
    state: idx < currentIdx ? 'done' : idx === currentIdx ? 'now' : 'future',
  })) satisfies readonly TrackingStep[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: orderData, isLoading: orderLoading } = useSWR<{ orders: Order[] }>(
    orderId ? `/api/cms/customer/orders?limit=50` : null,
    fetcher,
  );

  const order = orderData?.orders?.find((o) => o.id === orderId);
  const { tracking, isLoading: trackingLoading } = useOrderTracking(orderId);

  if (orderLoading || trackingLoading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--wl-text-faint)' }}>
        Loading order…
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--wl-font-display)',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'var(--wl-text-soft)',
          }}
        >
          Order not found.
        </div>
        <Link
          href="/account/orders"
          style={{
            display: 'inline-block',
            marginTop: 12,
            fontFamily: 'var(--wl-font-mono)',
            fontSize: 11,
            color: 'var(--wl-accent)',
            textDecoration: 'none',
          }}
        >
          ← Back to orders
        </Link>
      </div>
    );
  }

  const trackingStatus = tracking?.tracking?.currentStatus?.status;
  const steps = buildTrackingSteps(order.status, trackingStatus);
  const eta = tracking?.tracking?.eta;
  const trackingNumber = tracking?.tracking?.trackingNumber ?? order.shipment?.trackingNumber;
  const carrier = (tracking?.tracking?.carrier ?? order.shipment?.carrier ?? '').toUpperCase();
  const trackingUrl = tracking?.shipment?.trackingUrl ?? order.shipment?.trackingUrl;

  return (
    <div>
      {/* Head */}
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
            <Link href="/account/orders" style={{ color: 'var(--wl-text-soft)', textDecoration: 'none' }}>Orders</Link>
            <span style={{ color: 'var(--wl-text-faint)', margin: '0 6px' }}>/</span>
            <span style={{ color: 'var(--wl-text)' }}>#{order.orderNumber}</span>
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
            Order{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>#{order.orderNumber}</em>
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
            Placed {formatDateLong(order.createdAt)} · {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, alignItems: 'center', flexShrink: 0 }}>
          <a
            href="/account/orders"
            style={{
              fontFamily: 'var(--wl-font-body)',
              fontSize: 12,
              padding: '5px 10px',
              border: '1px solid var(--wl-rule)',
              color: 'var(--wl-text-soft)',
              borderRadius: 'var(--wl-radius-sm)',
              textDecoration: 'none',
              background: 'transparent',
            }}
          >
            Get help
          </a>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 12,
                padding: '5px 10px',
                background: 'var(--wl-text)',
                color: 'var(--wl-bg)',
                border: '1px solid var(--wl-text)',
                borderRadius: 'var(--wl-radius-sm)',
                textDecoration: 'none',
              }}
            >
              Track package →
            </a>
          )}
        </div>
      </div>

      {/* Tracking panel */}
      <div
        style={{
          marginTop: 18,
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          padding: '18px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 10,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--wl-accent)',
                marginBottom: 4,
              }}
            >
              <OrderStatusPill status={order.status} />
            </div>
            {eta && (
              <div
                style={{
                  fontFamily: 'var(--wl-font-display)',
                  fontSize: 24,
                  marginTop: 4,
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                }}
              >
                Arriving{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--wl-text-soft)' }}>
                  {new Date(eta).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </em>
              </div>
            )}
          </div>
          {trackingNumber && (
            <div style={{ textAlign: 'right' }}>
              {carrier && (
                <div
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 10,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    color: 'var(--wl-text-faint)',
                  }}
                >
                  {carrier} · priority
                </div>
              )}
              <div
                style={{
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 13,
                  marginTop: 4,
                  color: 'var(--wl-text)',
                }}
              >
                {trackingNumber}
              </div>
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 11,
                    color: 'var(--wl-accent)',
                    textDecoration: 'none',
                  }}
                >
                  open carrier site →
                </a>
              )}
            </div>
          )}
        </div>
        <TrackingTimeline steps={steps} />
      </div>

      {/* Items + summary */}
      <div
        style={{
          marginTop: 22,
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 18,
        }}
      >
        {/* Items */}
        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: 'var(--wl-card-pad)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontWeight: 500,
                fontSize: 18,
                margin: 0,
              }}
            >
              Items{' '}
              <span
                style={{
                  fontFamily: 'var(--wl-font-display)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--wl-text-soft)',
                }}
              >
                {order.itemCount}
              </span>
            </h2>
          </div>
          {(order.items ?? []).map((item) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '64px 1fr auto auto',
                gap: 14,
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--wl-rule-soft)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  border: '1px solid var(--wl-rule)',
                  borderRadius: 'var(--wl-radius-sm)',
                  background: item.image
                    ? `url(${item.image}) center/cover`
                    : 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 6px, var(--wl-surface-3) 6px 12px)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--wl-font-display)',
                    fontSize: 15,
                    lineHeight: 1.2,
                  }}
                >
                  {item.productTitle}
                </div>
                {item.variantSku && (
                  <div
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 11,
                      color: 'var(--wl-text-soft)',
                      marginTop: 2,
                    }}
                  >
                    {item.variantSku}
                  </div>
                )}
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <a
                    href="/shop"
                    style={{
                      fontFamily: 'var(--wl-font-body)',
                      fontSize: 12,
                      padding: '5px 10px',
                      border: '1px solid var(--wl-rule)',
                      color: 'var(--wl-text-soft)',
                      borderRadius: 'var(--wl-radius-sm)',
                      textDecoration: 'none',
                      background: 'transparent',
                    }}
                  >
                    Buy again
                  </a>
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 12,
                  color: 'var(--wl-text-soft)',
                }}
              >
                × {item.quantity}
              </div>
              <div
                style={{
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 13.5,
                  minWidth: 64,
                  textAlign: 'right',
                }}
              >
                {formatCurrency(item.totalPrice)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary + actions */}
        <div>
          <div
            style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 10,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--wl-text-faint)',
                marginBottom: 10,
              }}
            >
              Summary
            </div>
            {[
              ['Subtotal',  formatCurrency(order.subtotal ?? 0)],
              ['Shipping',  order.shippingTotal ? formatCurrency(order.shippingTotal) : 'Free'],
              ['Tax',       order.taxTotal ? formatCurrency(order.taxTotal) : '—'],
              ...(order.discountTotal ? [['Discount', `−${formatCurrency(order.discountTotal)}`]] : []),
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--wl-text-soft)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--wl-font-mono)' }}>{v}</span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0 2px',
                marginTop: 4,
                borderTop: '1px solid var(--wl-rule)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--wl-font-display)',
                  fontWeight: 500,
                  fontSize: 16,
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontFamily: 'var(--wl-font-display)',
                  fontWeight: 500,
                  fontSize: 18,
                  color: 'var(--wl-accent)',
                }}
              >
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a
              href="/account/returns"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px 10px',
                fontSize: 12,
                fontFamily: 'var(--wl-font-body)',
                background: 'var(--wl-surface)',
                color: 'var(--wl-text)',
                border: '1px solid var(--wl-text)',
                borderRadius: 'var(--wl-radius-sm)',
                textDecoration: 'none',
              }}
            >
              Request return
            </a>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px 10px',
                fontSize: 12,
                fontFamily: 'var(--wl-font-body)',
                background: 'transparent',
                color: 'var(--wl-text-soft)',
                border: '1px solid var(--wl-rule)',
                borderRadius: 'var(--wl-radius-sm)',
                cursor: 'pointer',
              }}
            >
              Re-order all items
            </button>
          </div>
        </div>
      </div>

      {/* Addresses */}
      {(order.shippingAddress ?? order.billingAddress) && (
        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
          }}
        >
          {order.shippingAddress && (
            <div
              style={{
                background: 'var(--wl-surface)',
                border: '1px solid var(--wl-text)',
                borderRadius: 'var(--wl-radius)',
                padding: '14px 16px',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 9.5,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--wl-text-faint)',
                  marginBottom: 6,
                }}
              >
                Shipping to
              </div>
              <div
                style={{
                  fontFamily: 'var(--wl-font-display)',
                  fontSize: 15,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                {order.shippingAddress.name}
              </div>
              <div>
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                <br />
                {order.shippingAddress.country}
              </div>
            </div>
          )}
          {order.billingAddress && (
            <div
              style={{
                background: 'var(--wl-surface)',
                border: '1px solid var(--wl-rule)',
                borderRadius: 'var(--wl-radius)',
                padding: '14px 16px',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 9.5,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--wl-text-faint)',
                  marginBottom: 6,
                }}
              >
                Billing
              </div>
              <div
                style={{
                  fontFamily: 'var(--wl-font-display)',
                  fontSize: 15,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                {order.billingAddress.name}
              </div>
              <div>
                {order.billingAddress.line1}
                <br />
                {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zip}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
