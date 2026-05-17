'use client';

/**
 * Atlas Customer Profile & Notifications (D9)
 * Edit personal info + notification preference matrix.
 * Uses --wl-* tokens exclusively.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomerProfile, updateProfile } from '@/components/cms/account-dashboard/hooks';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontFamily: 'var(--wl-font-body)',
  fontSize: 13,
  background: 'var(--wl-bg)',
  border: '1px solid var(--wl-rule)',
  borderRadius: 'var(--wl-radius-sm)',
  color: 'var(--wl-text)',
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--wl-font-mono)',
  fontSize: 10,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: 'var(--wl-text-soft)',
  marginBottom: 5,
};

// Notification preference matrix
type Channel = 'email' | 'sms' | 'push';
type PrefKey = 'orders' | 'shipping' | 'promotions' | 'stock' | 'security';

interface NotifPref {
  readonly key: PrefKey;
  readonly label: string;
  readonly desc: string;
}

const NOTIF_PREFS: ReadonlyArray<NotifPref> = [
  { key: 'orders',     label: 'Order updates',       desc: 'Confirmation, changes, cancellations' },
  { key: 'shipping',   label: 'Shipping & delivery',  desc: 'Tracking events and delivery alerts'  },
  { key: 'promotions', label: 'Promotions & offers',  desc: 'Sales, discount codes, new arrivals'  },
  { key: 'stock',      label: 'Back in stock',        desc: 'Alerts for your wishlisted items'     },
  { key: 'security',   label: 'Security alerts',      desc: 'Login, password and account activity' },
];

type PrefMatrix = Record<PrefKey, Record<Channel, boolean>>;

const DEFAULT_PREFS: PrefMatrix = {
  orders:     { email: true,  sms: true,  push: true  },
  shipping:   { email: true,  sms: true,  push: false },
  promotions: { email: true,  sms: false, push: false },
  stock:      { email: true,  sms: false, push: true  },
  security:   { email: true,  sms: true,  push: true  },
};

export default function ProfilePage() {
  const { profile, isLoading, mutate } = useCustomerProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<PrefMatrix>(DEFAULT_PREFS);

  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    acceptsMarketing: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name ?? '',
        firstName: profile.customer?.firstName ?? '',
        lastName: profile.customer?.lastName ?? '',
        phone: profile.phone ?? profile.customer?.phone ?? '',
        company: profile.customer?.company ?? '',
        acceptsMarketing: profile.customer?.acceptsMarketing ?? false,
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await updateProfile(formData);
      await mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePref = (key: PrefKey, channel: Channel) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
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
          <span style={{ color: 'var(--wl-text)' }}>Profile</span>
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
          Profile &amp; <em style={{ fontStyle: 'italic', fontWeight: 400 }}>settings</em>
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
          Update your details and notification preferences.
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--wl-text-faint)', fontFamily: 'var(--wl-font-display)', fontStyle: 'italic' }}>
          Loading…
        </div>
      ) : (
        <>
          {/* Profile form */}
          <form onSubmit={handleSubmit}>
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
                Personal information
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: '10px 14px',
                    background: 'color-mix(in srgb, var(--wl-error) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--wl-error) 30%, transparent)',
                    borderRadius: 'var(--wl-radius-sm)',
                    fontFamily: 'var(--wl-font-body)',
                    fontSize: 13,
                    color: 'var(--wl-error)',
                  }}
                >
                  {error}
                </div>
              )}

              {saved && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: '10px 14px',
                    background: 'color-mix(in srgb, var(--wl-success) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--wl-success) 30%, transparent)',
                    borderRadius: 'var(--wl-radius-sm)',
                    fontFamily: 'var(--wl-font-body)',
                    fontSize: 13,
                    color: 'var(--wl-success)',
                  }}
                >
                  Profile saved.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={LABEL_STYLE}>First name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Last name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      style={INPUT_STYLE}
                    />
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Email</label>
                  <input
                    type="email"
                    value={profile?.email ?? ''}
                    disabled
                    style={{ ...INPUT_STYLE, opacity: 0.5, cursor: 'not-allowed' }}
                  />
                  <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, color: 'var(--wl-text-faint)', marginTop: 4 }}>
                    Email cannot be changed here.
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Company (optional)</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    fontFamily: 'var(--wl-font-body)',
                    fontSize: 12,
                    padding: '6px 16px',
                    background: 'var(--wl-text)',
                    color: 'var(--wl-bg)',
                    border: '1px solid var(--wl-text)',
                    borderRadius: 'var(--wl-radius-sm)',
                    cursor: isSaving ? 'default' : 'pointer',
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>

          {/* Notification matrix */}
          <div
            style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '20px 22px',
              marginTop: 16,
            }}
          >
            <div style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 16, marginBottom: 16 }}>
              Notification preferences
            </div>

            {/* Column headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 72px 72px 72px',
                gap: 8,
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: '1px solid var(--wl-rule)',
              }}
            >
              <div />
              {(['email', 'sms', 'push'] as Channel[]).map((ch) => (
                <div
                  key={ch}
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 9.5,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    color: 'var(--wl-text-faint)',
                    textAlign: 'center',
                  }}
                >
                  {ch}
                </div>
              ))}
            </div>

            {NOTIF_PREFS.map((pref, i) => (
              <div
                key={pref.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 72px 72px 72px',
                  gap: 8,
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < NOTIF_PREFS.length - 1 ? '1px solid var(--wl-rule-soft)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 13 }}>{pref.label}</div>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--wl-text-faint)', marginTop: 1 }}>
                    {pref.desc}
                  </div>
                </div>
                {(['email', 'sms', 'push'] as Channel[]).map((ch) => {
                  const on = prefs[pref.key][ch];
                  return (
                    <div key={ch} style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => togglePref(pref.key, ch)}
                        style={{
                          width: 36,
                          height: 20,
                          borderRadius: 999,
                          border: 'none',
                          background: on ? 'var(--wl-accent)' : 'var(--wl-rule)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background .2s',
                          flexShrink: 0,
                        }}
                        aria-checked={on}
                        role="switch"
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
                            transition: 'left .2s',
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Danger zone */}
          <div
            style={{
              marginTop: 20,
              padding: '16px 22px',
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
            }}
          >
            <div style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 15, marginBottom: 8 }}>
              Danger zone
            </div>
            <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--wl-text-soft)', marginBottom: 12 }}>
              Once you close your account, all data will be permanently removed.
            </div>
            <button
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 12,
                padding: '5px 12px',
                border: '1px solid color-mix(in srgb, var(--wl-error) 50%, transparent)',
                color: 'var(--wl-error)',
                borderRadius: 'var(--wl-radius-sm)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Close account
            </button>
          </div>
        </>
      )}
    </div>
  );
}
