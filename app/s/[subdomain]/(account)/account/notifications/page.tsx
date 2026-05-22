'use client';

/**
 * Atlas Customer Notification Settings
 * Granular channel toggles per notification category.
 * Uses --wl-* tokens exclusively.
 */

import { useState } from 'react';
import Link from 'next/link';

type Channel = 'email' | 'sms' | 'push';

interface NotifCategory {
  readonly key: string;
  readonly label: string;
  readonly desc: string;
  readonly required?: boolean;
}

const CATEGORIES: ReadonlyArray<NotifCategory> = [
  { key: 'orders',     label: 'Order updates',        desc: 'Confirmation, processing, and cancellation',   required: true  },
  { key: 'shipping',   label: 'Shipping & delivery',   desc: 'Dispatch alerts and delivery confirmations'                    },
  { key: 'returns',    label: 'Returns & refunds',     desc: 'Status updates for open return requests'                       },
  { key: 'promotions', label: 'Promotions & offers',   desc: 'Sales, discount codes, and early access'                      },
  { key: 'stock',      label: 'Back in stock',         desc: 'Alerts when wishlisted items become available'                 },
  { key: 'loyalty',    label: 'Loyalty & rewards',     desc: 'Points earned, tier upgrades, and expiry warnings'            },
  { key: 'security',   label: 'Security & account',   desc: 'Login activity, password changes',             required: true  },
] as const;

type PrefMatrix = Record<string, Record<Channel, boolean>>;

function buildDefault(): PrefMatrix {
  const m: PrefMatrix = {};
  for (const cat of CATEGORIES) {
    m[cat.key] = { email: true, sms: cat.key === 'orders' || cat.key === 'shipping', push: false };
  }
  return m;
}

function Toggle({ on, onToggle, disabled }: { readonly on: boolean; readonly onToggle: () => void; readonly disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      role="switch"
      aria-checked={on}
      disabled={disabled}
      style={{
        width: 36,
        height: 20,
        borderRadius: 999,
        border: 'none',
        background: on ? 'var(--wl-accent)' : 'var(--wl-rule)',
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s',
        }}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<PrefMatrix>(buildDefault);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string, channel: Channel) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      {/* Page head */}
      <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--wl-rule)' }}>
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
          <span style={{ color: 'var(--wl-text)' }}>Notifications</span>
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
          Notification <em style={{ fontStyle: 'italic', fontWeight: 400 }}>settings</em>
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
          Choose how and when we reach you.
        </div>
      </div>

      {/* Matrix */}
      <div
        style={{
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          overflow: 'hidden',
          marginTop: 20,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 80px 80px',
            gap: 8,
            padding: '10px 18px',
            borderBottom: '1px solid var(--wl-rule)',
            background: 'var(--wl-surface-2)',
          }}
        >
          <div />
          {(['email', 'sms', 'push'] as Channel[]).map((ch) => (
            <div
              key={ch}
              style={{
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 9.5,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--wl-text-faint)',
                textAlign: 'center',
              }}
            >
              {ch}
            </div>
          ))}
        </div>

        {/* Category rows */}
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 80px',
              gap: 8,
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: i < CATEGORIES.length - 1 ? '1px solid var(--wl-rule-soft)' : 'none',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--wl-font-display)', fontSize: 13 }}>{cat.label}</span>
                {cat.required && (
                  <span
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 8.5,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'var(--wl-text-faint)',
                      border: '1px solid var(--wl-rule)',
                      borderRadius: 999,
                      padding: '1px 5px',
                    }}
                  >
                    Required
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--wl-text-faint)', marginTop: 1 }}>
                {cat.desc}
              </div>
            </div>
            {(['email', 'sms', 'push'] as Channel[]).map((ch) => (
              <div key={ch} style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle
                  on={prefs[cat.key][ch]}
                  onToggle={() => toggle(cat.key, ch)}
                  disabled={cat.required}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Save bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
        {saved && (
          <span style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--wl-success)' }}>
            Preferences saved.
          </span>
        )}
        <button
          onClick={handleSave}
          style={{
            fontFamily: 'var(--wl-font-body)',
            fontSize: 12,
            padding: '7px 18px',
            background: 'var(--wl-text)',
            color: 'var(--wl-bg)',
            border: '1px solid var(--wl-text)',
            borderRadius: 'var(--wl-radius-sm)',
            cursor: 'pointer',
          }}
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}
