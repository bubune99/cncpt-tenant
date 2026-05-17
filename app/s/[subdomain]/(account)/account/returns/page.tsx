'use client';

/**
 * Atlas Customer Returns & Exchanges (D6)
 * Eligible items, how-it-works strip, past returns ledger, store-credit hero.
 * Uses --wl-* tokens exclusively.
 */

import Link from 'next/link';

const ELIGIBLE = [
  { nm: 'Heritage hoodie',  v: 'Brick · M',   price: '$92', ordered: '08 May', days: 14 },
  { nm: 'Field journal',    v: 'A5 · linen',   price: '$22', ordered: '02 May', days: 21 },
] as const;

const PAST_RETURNS = [
  { id: 'RET-0041', nm: 'Linen shirt (White · S)', date: '12 Apr', refund: '$64', method: 'Store credit', status: 'Completed' },
  { id: 'RET-0038', nm: 'Ceramic mug (Matte)',     date: '01 Mar', refund: '$18', method: 'Original card', status: 'Completed' },
  { id: 'RET-0027', nm: 'Canvas tote (Sage)',       date: '14 Jan', refund: '$44', method: 'Store credit', status: 'Refunded' },
] as const;

const STEPS = [
  { n: '1', title: 'Select item', body: 'Choose an eligible order item below.' },
  { n: '2', title: 'Pack & ship', body: 'Print label, drop off within 5 days.' },
  { n: '3', title: 'Inspect',     body: 'We check quality in 2–3 business days.' },
  { n: '4', title: 'Credit back', body: 'Refund or store credit, your choice.' },
] as const;

function StatusPill({ status }: { readonly status: string }) {
  const ok = status === 'Completed' || status === 'Refunded';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontFamily: 'var(--wl-font-mono)',
        fontSize: 9.5,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        borderRadius: 999,
        background: ok ? 'color-mix(in srgb, var(--wl-success) 15%, transparent)' : 'var(--wl-surface-2)',
        color: ok ? 'var(--wl-success)' : 'var(--wl-text-soft)',
        border: ok ? '1px solid color-mix(in srgb, var(--wl-success) 30%, transparent)' : '1px solid var(--wl-rule)',
      }}
    >
      {status}
    </span>
  );
}

export default function ReturnsPage() {
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
            <span style={{ color: 'var(--wl-text)' }}>Returns</span>
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
            Returns &amp; <em style={{ fontStyle: 'italic', fontWeight: 400 }}>exchanges</em>
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
            30-day returns on most items · free label included
          </div>
        </div>
      </div>

      {/* How-it-works strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
          marginTop: 20,
          marginBottom: 20,
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          overflow: 'hidden',
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            style={{
              padding: '16px 18px',
              borderRight: i < STEPS.length - 1 ? '1px solid var(--wl-rule)' : 'none',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--wl-accent)',
                color: 'var(--wl-accent-fg)',
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              {step.n}
            </div>
            <div style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
              {step.title}
            </div>
            <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--wl-text-soft)', lineHeight: 1.4 }}>
              {step.body}
            </div>
          </div>
        ))}
      </div>

      {/* Eligible items */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: 'var(--wl-font-display)',
            fontWeight: 500,
            fontSize: 18,
            margin: '0 0 12px 0',
          }}
        >
          Eligible for return
        </h2>
        {ELIGIBLE.length === 0 ? (
          <div
            style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '32px',
              textAlign: 'center',
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              color: 'var(--wl-text-soft)',
            }}
          >
            No eligible items right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ELIGIBLE.map((item) => (
              <div
                key={item.nm}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'var(--wl-surface)',
                  border: '1px solid var(--wl-rule)',
                  borderRadius: 'var(--wl-radius)',
                  padding: '14px 16px',
                }}
              >
                {/* Image placeholder */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 'var(--wl-radius-sm)',
                    background: 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 4px, var(--wl-surface-3) 4px 8px)',
                    border: '1px solid var(--wl-rule)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 15, fontWeight: 500 }}>{item.nm}</div>
                  <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 11, color: 'var(--wl-text-soft)', marginTop: 2 }}>
                    {item.v} · {item.price}
                  </div>
                  <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 10, color: 'var(--wl-text-faint)', marginTop: 2, letterSpacing: '.04em' }}>
                    ORDERED {item.ordered.toUpperCase()} · {item.days} DAYS LEFT TO RETURN
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{
                      fontFamily: 'var(--wl-font-body)',
                      fontSize: 11,
                      padding: '5px 10px',
                      border: '1px solid var(--wl-rule)',
                      color: 'var(--wl-text-soft)',
                      borderRadius: 'var(--wl-radius-sm)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    Exchange
                  </button>
                  <button
                    style={{
                      fontFamily: 'var(--wl-font-body)',
                      fontSize: 11,
                      padding: '5px 10px',
                      background: 'var(--wl-text)',
                      color: 'var(--wl-bg)',
                      border: '1px solid var(--wl-text)',
                      borderRadius: 'var(--wl-radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    Start return
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Store credit hero */}
      <div
        style={{
          background: 'color-mix(in srgb, var(--wl-accent) 8%, var(--wl-surface))',
          border: '1px solid color-mix(in srgb, var(--wl-accent) 25%, transparent)',
          borderRadius: 'var(--wl-radius)',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--wl-accent)', marginBottom: 4 }}>
            Store credit balance
          </div>
          <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>
            $108.00
          </div>
          <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--wl-text-soft)', marginTop: 2 }}>
            From 3 returns · no expiry
          </div>
        </div>
        <button
          style={{
            fontFamily: 'var(--wl-font-body)',
            fontSize: 12,
            padding: '7px 14px',
            background: 'var(--wl-accent)',
            color: 'var(--wl-accent-fg)',
            border: '1px solid var(--wl-accent)',
            borderRadius: 'var(--wl-radius-sm)',
            cursor: 'pointer',
          }}
        >
          Use at checkout →
        </button>
      </div>

      {/* Past returns ledger */}
      <div>
        <h2
          style={{
            fontFamily: 'var(--wl-font-display)',
            fontWeight: 500,
            fontSize: 18,
            margin: '0 0 12px 0',
          }}
        >
          Return history
        </h2>
        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Return ID', 'Item', 'Date', 'Method', 'Amount', 'Status'].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 9.5,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: 'var(--wl-text-faint)',
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--wl-rule)',
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAST_RETURNS.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--wl-rule-soft)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--wl-font-mono)', fontSize: 12, fontWeight: 600 }}>
                    {r.id}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--wl-font-display)', fontSize: 13 }}>
                    {r.nm}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--wl-text-soft)' }}>
                    {r.date}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--wl-font-mono)', fontSize: 11, color: 'var(--wl-text-soft)' }}>
                    {r.method}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--wl-font-mono)', fontSize: 13, fontWeight: 600 }}>
                    {r.refund}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
