'use client';

/**
 * Atlas Customer Communications (Email & SMS Preferences)
 * Marketing consent, frequency controls, topic subscriptions.
 * Uses --wl-* tokens exclusively.
 */

import { useState } from 'react';
import Link from 'next/link';

interface TopicPref {
  readonly key: string;
  readonly label: string;
  readonly desc: string;
}

const EMAIL_TOPICS: ReadonlyArray<TopicPref> = [
  { key: 'new_arrivals',   label: 'New arrivals',       desc: 'First to know when we drop something new'       },
  { key: 'sale_events',    label: 'Sale events',         desc: 'Flash sales, seasonal markdowns, clearance'    },
  { key: 'editorial',      label: 'Editorial & stories', desc: 'Brand stories, maker profiles, field notes'    },
  { key: 'loyalty_digest', label: 'Loyalty digest',      desc: 'Monthly points summary and reward expiry'      },
  { key: 'restock',        label: 'Restock picks',       desc: 'Curated restocks based on your wishlist'       },
] as const;

const SMS_TOPICS: ReadonlyArray<TopicPref> = [
  { key: 'flash_sales',  label: 'Flash sale alerts',  desc: 'Time-sensitive deals, text-only offers' },
  { key: 'shipping_sms', label: 'Shipping updates',   desc: 'Dispatch and delivery via SMS'          },
] as const;

type FrequencyOption = 'instantly' | 'daily' | 'weekly';

export default function CommunicationsPage() {
  const [emailEnabled,  setEmailEnabled]  = useState(true);
  const [smsEnabled,    setSmsEnabled]    = useState(false);
  const [emailTopics,   setEmailTopics]   = useState<ReadonlySet<string>>(new Set(['new_arrivals', 'sale_events']));
  const [smsTopics,     setSmsTopics]     = useState<ReadonlySet<string>>(new Set(['shipping_sms']));
  const [emailFreq,     setEmailFreq]     = useState<FrequencyOption>('weekly');
  const [saved,         setSaved]         = useState(false);

  const toggleEmailTopic = (key: string) => {
    setEmailTopics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const toggleSmsTopic = (key: string) => {
    setSmsTopics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
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
          <span style={{ color: 'var(--wl-text)' }}>Communications</span>
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
          Email &amp; <em style={{ fontStyle: 'italic', fontWeight: 400 }}>SMS</em>
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
          Control what you hear from us and how often.
        </div>
      </div>

      {/* Email section */}
      <section style={{ marginTop: 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div>
            <h2 style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 18, margin: 0 }}>
              Email marketing
            </h2>
            <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--wl-text-soft)', marginTop: 2 }}>
              Sent to your registered email address.
            </div>
          </div>
          {/* Master toggle */}
          <button
            type="button"
            onClick={() => setEmailEnabled((v) => !v)}
            role="switch"
            aria-checked={emailEnabled}
            style={{
              width: 44,
              height: 24,
              borderRadius: 999,
              border: 'none',
              background: emailEnabled ? 'var(--wl-accent)' : 'var(--wl-rule)',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: emailEnabled ? 22 : 3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left .15s',
              }}
            />
          </button>
        </div>

        {emailEnabled && (
          <div
            style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '0 18px',
            }}
          >
            {/* Frequency */}
            <div style={{ padding: '14px 0', borderBottom: '1px solid var(--wl-rule)' }}>
              <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--wl-text-faint)', marginBottom: 10 }}>
                Frequency
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['instantly', 'daily', 'weekly'] as FrequencyOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setEmailFreq(opt)}
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 10.5,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      padding: '5px 12px',
                      border: `1px solid ${emailFreq === opt ? 'var(--wl-accent)' : 'var(--wl-rule)'}`,
                      borderRadius: 999,
                      background: emailFreq === opt ? 'var(--wl-accent)' : 'transparent',
                      color: emailFreq === opt ? 'var(--wl-accent-fg)' : 'var(--wl-text-soft)',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {/* Topics */}
            {EMAIL_TOPICS.map((topic, i) => (
              <div
                key={topic.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < EMAIL_TOPICS.length - 1 ? '1px solid var(--wl-rule-soft)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 13 }}>{topic.label}</div>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--wl-text-faint)', marginTop: 1 }}>
                    {topic.desc}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailTopics.has(topic.key)}
                  onChange={() => toggleEmailTopic(topic.key)}
                  style={{ width: 16, height: 16, accentColor: 'var(--wl-accent)', cursor: 'pointer', flexShrink: 0 }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SMS section */}
      <section style={{ marginTop: 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div>
            <h2 style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 18, margin: 0 }}>
              SMS marketing
            </h2>
            <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--wl-text-soft)', marginTop: 2 }}>
              Standard message rates apply. Opt out any time.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSmsEnabled((v) => !v)}
            role="switch"
            aria-checked={smsEnabled}
            style={{
              width: 44,
              height: 24,
              borderRadius: 999,
              border: 'none',
              background: smsEnabled ? 'var(--wl-accent)' : 'var(--wl-rule)',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: smsEnabled ? 22 : 3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left .15s',
              }}
            />
          </button>
        </div>

        {smsEnabled && (
          <div
            style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '0 18px',
            }}
          >
            {SMS_TOPICS.map((topic, i) => (
              <div
                key={topic.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < SMS_TOPICS.length - 1 ? '1px solid var(--wl-rule-soft)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 13 }}>{topic.label}</div>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--wl-text-faint)', marginTop: 1 }}>
                    {topic.desc}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={smsTopics.has(topic.key)}
                  onChange={() => toggleSmsTopic(topic.key)}
                  style={{ width: 16, height: 16, accentColor: 'var(--wl-accent)', cursor: 'pointer', flexShrink: 0 }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Legal note */}
      <div
        style={{
          marginTop: 18,
          padding: '12px 16px',
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          fontFamily: 'var(--wl-font-display)',
          fontStyle: 'italic',
          fontSize: 11,
          color: 'var(--wl-text-faint)',
          lineHeight: 1.55,
        }}
      >
        You can unsubscribe from marketing at any time. Transactional emails (order confirmations, shipping updates) are sent regardless of these settings.
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
