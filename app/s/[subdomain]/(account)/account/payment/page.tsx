'use client';

/**
 * Atlas Customer Payment Methods (D8)
 * Saved cards, PayPal, Apple Pay; add new card flow.
 * Uses --wl-* tokens exclusively.
 */

import { useState } from 'react';
import Link from 'next/link';

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic';

interface SavedCard {
  readonly id: string;
  readonly brand: CardBrand;
  readonly last4: string;
  readonly expiry: string;
  readonly label: string;
  readonly isDefault: boolean;
}

interface AltMethod {
  readonly id: string;
  readonly type: string;
  readonly detail: string;
  readonly isDefault: boolean;
}

const CARDS: ReadonlyArray<SavedCard> = [
  { id: 'c1', brand: 'visa',       last4: '4242', expiry: '08/26', label: 'Personal Visa',    isDefault: true  },
  { id: 'c2', brand: 'mastercard', last4: '5555', expiry: '02/27', label: 'Business MC',      isDefault: false },
];

const ALT_METHODS: ReadonlyArray<AltMethod> = [
  { id: 'a1', type: 'PayPal',    detail: 'user@email.com', isDefault: false },
];

function brandLabel(b: CardBrand): string {
  switch (b) {
    case 'visa':       return 'VISA';
    case 'mastercard': return 'MC';
    case 'amex':       return 'AMEX';
    case 'discover':   return 'DISC';
    default:           return '••••';
  }
}

function brandColor(b: CardBrand): string {
  switch (b) {
    case 'visa':       return '#1a1f71';
    case 'mastercard': return '#eb001b';
    case 'amex':       return '#2e77bc';
    case 'discover':   return '#e65c00';
    default:           return 'var(--wl-text-soft)';
  }
}

export default function PaymentPage() {
  const [showAddCard, setShowAddCard] = useState(false);

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
            <span style={{ color: 'var(--wl-text)' }}>Payment</span>
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
            Payment <em style={{ fontStyle: 'italic', fontWeight: 400 }}>methods</em>
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
            Manage cards and wallets for faster checkout.
          </div>
        </div>
        <div style={{ paddingTop: 12 }}>
          <button
            onClick={() => setShowAddCard(true)}
            style={{
              fontFamily: 'var(--wl-font-body)',
              fontSize: 12,
              padding: '5px 12px',
              background: 'var(--wl-text)',
              color: 'var(--wl-bg)',
              border: '1px solid var(--wl-text)',
              borderRadius: 'var(--wl-radius-sm)',
              cursor: 'pointer',
            }}
          >
            + Add card
          </button>
        </div>
      </div>

      {/* Add card form */}
      {showAddCard && (
        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: '20px 22px',
            marginTop: 20,
          }}
        >
          <div style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 16, marginBottom: 16 }}>
            Add a card
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[
              { label: 'Card number',     placeholder: '•••• •••• •••• ••••', type: 'text' as const },
              { label: 'Cardholder name', placeholder: 'Full name on card',  type: 'text' as const },
            ].map((f) => (
              <div key={f.label}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 10,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--wl-text-soft)',
                    marginBottom: 6,
                  }}
                >
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 13,
                    background: 'var(--wl-bg)',
                    border: '1px solid var(--wl-rule)',
                    borderRadius: 'var(--wl-radius-sm)',
                    color: 'var(--wl-text)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
            {[
              { label: 'Expiry',  placeholder: 'MM / YY', type: 'text' as const },
              { label: 'CVC',     placeholder: '•••',     type: 'text' as const },
            ].map((f) => (
              <div key={f.label}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 10,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--wl-text-soft)',
                    marginBottom: 6,
                  }}
                >
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 13,
                    background: 'var(--wl-bg)',
                    border: '1px solid var(--wl-rule)',
                    borderRadius: 'var(--wl-radius-sm)',
                    color: 'var(--wl-text)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAddCard(false)}
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 12,
                padding: '6px 12px',
                border: '1px solid var(--wl-rule)',
                color: 'var(--wl-text-soft)',
                borderRadius: 'var(--wl-radius-sm)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 12,
                padding: '6px 14px',
                background: 'var(--wl-text)',
                color: 'var(--wl-bg)',
                border: '1px solid var(--wl-text)',
                borderRadius: 'var(--wl-radius-sm)',
                cursor: 'pointer',
              }}
            >
              Save card
            </button>
          </div>
        </div>
      )}

      {/* Saved cards */}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--wl-text-faint)', marginBottom: 10 }}>
          Cards
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CARDS.map((card) => (
            <div
              key={card.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--wl-surface)',
                border: card.isDefault ? '1px solid var(--wl-accent)' : '1px solid var(--wl-rule)',
                borderRadius: 'var(--wl-radius)',
                padding: '14px 16px',
              }}
            >
              {/* Card chip icon */}
              <div
                style={{
                  width: 44,
                  height: 30,
                  borderRadius: 4,
                  background: `linear-gradient(135deg, ${brandColor(card.brand)} 0%, color-mix(in srgb, ${brandColor(card.brand)} 70%, black) 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  flexShrink: 0,
                }}
              >
                {brandLabel(card.brand)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--wl-font-display)', fontSize: 14 }}>{card.label}</span>
                  {card.isDefault && (
                    <span
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 9,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: 'var(--wl-accent)',
                        border: '1px solid var(--wl-accent)',
                        borderRadius: 999,
                        padding: '1px 6px',
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 12, color: 'var(--wl-text-soft)', marginTop: 3 }}>
                  •••• •••• •••• {card.last4} · exp {card.expiry}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!card.isDefault && (
                  <button
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 10,
                      padding: '4px 8px',
                      border: '1px solid var(--wl-rule)',
                      color: 'var(--wl-text-soft)',
                      borderRadius: 'var(--wl-radius-sm)',
                      background: 'transparent',
                      cursor: 'pointer',
                      letterSpacing: '.04em',
                    }}
                  >
                    Set default
                  </button>
                )}
                <button
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 10,
                    padding: '4px 8px',
                    border: '1px solid var(--wl-rule)',
                    color: 'var(--wl-error)',
                    borderRadius: 'var(--wl-radius-sm)',
                    background: 'transparent',
                    cursor: 'pointer',
                    letterSpacing: '.04em',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alt payment methods */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--wl-text-faint)', marginBottom: 10 }}>
          Wallets &amp; other methods
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ALT_METHODS.map((m) => (
            <div
              key={m.id}
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
              <div
                style={{
                  width: 44,
                  height: 30,
                  borderRadius: 4,
                  background: '#003087',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '.04em',
                  flexShrink: 0,
                }}
              >
                {m.type.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 14 }}>{m.type}</div>
                <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 12, color: 'var(--wl-text-soft)', marginTop: 3 }}>{m.detail}</div>
              </div>
              <button
                style={{
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 10,
                  padding: '4px 8px',
                  border: '1px solid var(--wl-rule)',
                  color: 'var(--wl-error)',
                  borderRadius: 'var(--wl-radius-sm)',
                  background: 'transparent',
                  cursor: 'pointer',
                  letterSpacing: '.04em',
                }}
              >
                Remove
              </button>
            </div>
          ))}

          {/* Add PayPal CTA */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px',
              border: '1px dashed var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              background: 'transparent',
              color: 'var(--wl-text-soft)',
              fontFamily: 'var(--wl-font-body)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <span>+</span>
            <span>Connect PayPal or Apple Pay</span>
          </button>
        </div>
      </div>

      {/* Security note */}
      <div
        style={{
          marginTop: 20,
          padding: '12px 16px',
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--wl-text-faint)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--wl-text-faint)', lineHeight: 1.5 }}>
          Your payment details are encrypted and stored securely. We never store full card numbers.
        </div>
      </div>
    </div>
  );
}
