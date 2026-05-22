'use client';

/**
 * Atlas Customer Subscriptions (D4)
 * Active recurring shipments with schedule strip and controls.
 * Uses --wl-* tokens exclusively.
 */

import Link from 'next/link';

export default function SubscriptionsPage() {
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
            <span style={{ color: 'var(--wl-text)' }}>Subscriptions</span>
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
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>subscriptions</em>
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
            Manage recurring shipments and renewals.
          </div>
        </div>
        <div style={{ paddingTop: 12 }}>
          <Link
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
            Add a subscription
          </Link>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 14 }}>
        {['Active', 'Paused', 'Cancelled'].map((label) => (
          <button
            key={label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10.5,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: label === 'Active' ? 'var(--wl-accent-fg)' : 'var(--wl-text-soft)',
              background: label === 'Active' ? 'var(--wl-accent)' : 'transparent',
              border: `1px solid ${label === 'Active' ? 'var(--wl-accent)' : 'var(--wl-rule)'}`,
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div
        style={{
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          padding: '48px 32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--wl-font-display)',
            fontSize: 22,
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          No active subscriptions
        </div>
        <div
          style={{
            fontFamily: 'var(--wl-font-display)',
            fontStyle: 'italic',
            color: 'var(--wl-text-soft)',
            fontSize: 14,
            lineHeight: 1.5,
            marginBottom: 18,
            maxWidth: 400,
            margin: '0 auto 18px',
          }}
        >
          Subscribe to products for regular shipments and save on each order.
        </div>
        <Link
          href="/shop"
          style={{
            fontFamily: 'var(--wl-font-body)',
            fontSize: 13,
            padding: '8px 16px',
            background: 'var(--wl-text)',
            color: 'var(--wl-bg)',
            border: '1px solid var(--wl-text)',
            borderRadius: 'var(--wl-radius-sm)',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Browse subscribable products →
        </Link>
      </div>

      {/* Marisol suggests */}
      <div style={{ marginTop: 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            marginBottom: 12,
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
            Popular subscriptions
          </h2>
          <span
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--wl-text-soft)',
              marginLeft: 'auto',
            }}
          >
            based on what others love
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { nm: 'Monthly essentials box',  cad: 'monthly',   pr: '$32', desc: 'Curated selection · hand-packed' },
            { nm: 'Seasonal variety set',     cad: 'quarterly', pr: '$28', desc: 'Four items · zone-matched' },
            { nm: 'Weekly fresh delivery',    cad: 'weekly',    pr: '$14', desc: 'Fresh produce · local farms' },
          ].map(({ nm, cad, pr, desc }) => (
            <div
              key={nm}
              style={{
                background: 'var(--wl-surface)',
                border: '1px solid var(--wl-rule)',
                borderRadius: 'var(--wl-radius)',
                padding: 'var(--wl-card-pad)',
              }}
            >
              <div
                style={{
                  height: 84,
                  marginBottom: 10,
                  background: 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 6px, var(--wl-surface-3) 6px 12px)',
                  borderRadius: 'var(--wl-radius-sm)',
                  border: '1px solid var(--wl-rule)',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontFamily: 'var(--wl-font-display)',
                    fontWeight: 500,
                    fontSize: 15,
                  }}
                >
                  {nm}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 11.5,
                    color: 'var(--wl-accent)',
                  }}
                >
                  {pr}
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--wl-font-display)',
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: 'var(--wl-text-soft)',
                  marginTop: 2,
                }}
              >
                {cad} · {desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
