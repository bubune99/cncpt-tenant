'use client';

/**
 * Atlas Customer Loyalty & Store Credit (D7)
 * Tier badge, points balance, progress bar, rewards grid, activity log.
 * Uses --wl-* tokens exclusively.
 */

import Link from 'next/link';

const TIERS = [
  { key: 'bronze',   label: 'Bronze',   pts: 0,    color: '#cd7f32' },
  { key: 'silver',   label: 'Silver',   pts: 500,  color: '#aaaaaa' },
  { key: 'gold',     label: 'Gold',     pts: 1200, color: '#c9a84c' },
  { key: 'platinum', label: 'Platinum', pts: 3000, color: '#b0c4de' },
] as const;

type TierKey = typeof TIERS[number]['key'];

const CURRENT_TIER: TierKey = 'silver';
const CURRENT_PTS = 820;
const NEXT_TIER_PTS = 1200;

const REWARDS = [
  { id: 'r1', label: '$5 off your next order',       pts: 200, category: 'Discount' },
  { id: 'r2', label: 'Free shipping (one order)',     pts: 150, category: 'Shipping' },
  { id: 'r3', label: '15% off seasonal collection',  pts: 350, category: 'Discount' },
  { id: 'r4', label: 'Early access — new arrivals',  pts: 500, category: 'Access'   },
  { id: 'r5', label: 'Personalised gift wrap',        pts: 80,  category: 'Gift'     },
  { id: 'r6', label: '$25 store credit',              pts: 600, category: 'Credit'   },
] as const;

const ACTIVITY = [
  { date: '12 May', desc: 'Purchase #1042',      delta: '+120 pts' },
  { date: '08 May', desc: 'Referral bonus',      delta: '+200 pts' },
  { date: '02 May', desc: 'Purchase #1037',      delta: '+55 pts'  },
  { date: '28 Apr', desc: 'Reward redeemed',     delta: '−150 pts' },
  { date: '20 Apr', desc: 'Purchase #1031',      delta: '+88 pts'  },
  { date: '14 Apr', desc: 'Birthday bonus',      delta: '+50 pts'  },
] as const;

export default function LoyaltyPage() {
  const pct = Math.min(100, Math.round(((CURRENT_PTS - 500) / (NEXT_TIER_PTS - 500)) * 100));
  const currentTierObj = TIERS.find((t) => t.key === CURRENT_TIER)!;

  return (
    <div>
      {/* Page head */}
      <div
        style={{
          paddingBottom: 18,
          borderBottom: '1px solid var(--wl-rule)',
        }}
      >
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
          <span style={{ color: 'var(--wl-text)' }}>Loyalty</span>
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
          Loyalty &amp; <em style={{ fontStyle: 'italic', fontWeight: 400 }}>rewards</em>
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
          Earn points with every purchase and redeem for perks.
        </div>
      </div>

      {/* Tier hero + progress */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        {/* Tier badge */}
        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: '22px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${currentTierObj.color}, color-mix(in srgb, ${currentTierObj.color} 60%, black))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 0 4px color-mix(in srgb, ${currentTierObj.color} 20%, transparent)`,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity={0.9}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--wl-text-faint)', marginBottom: 4 }}>
              Current tier
            </div>
            <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 26, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {currentTierObj.label}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {TIERS.map((t) => (
                <div
                  key={t.key}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: TIERS.indexOf(t) <= TIERS.findIndex((x) => x.key === CURRENT_TIER) ? t.color : 'var(--wl-rule)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Points balance + progress */}
        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: '22px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--wl-text-faint)', marginBottom: 4 }}>
                Points balance
              </div>
              <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 32, fontWeight: 500 }}>
                {CURRENT_PTS.toLocaleString()}
                <span style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 12, color: 'var(--wl-text-faint)', marginLeft: 6 }}>pts</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, color: 'var(--wl-text-faint)', letterSpacing: '.06em' }}>
                NEXT: GOLD
              </div>
              <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 11, color: 'var(--wl-accent)', marginTop: 2 }}>
                {NEXT_TIER_PTS - CURRENT_PTS} pts away
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: 'var(--wl-surface-2)',
              overflow: 'hidden',
              marginTop: 12,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'var(--wl-accent)',
                borderRadius: 999,
                transition: 'width .4s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, color: 'var(--wl-text-faint)' }}>Silver (500)</span>
            <span style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, color: 'var(--wl-text-faint)' }}>Gold ({NEXT_TIER_PTS})</span>
          </div>
        </div>
      </div>

      {/* Rewards grid */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 18, margin: '0 0 12px 0' }}>
          Redeem rewards
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {REWARDS.map((r) => {
            const canRedeem = CURRENT_PTS >= r.pts;
            return (
              <div
                key={r.id}
                style={{
                  background: 'var(--wl-surface)',
                  border: '1px solid var(--wl-rule)',
                  borderRadius: 'var(--wl-radius)',
                  padding: 'var(--wl-card-pad)',
                  opacity: canRedeem ? 1 : 0.55,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 9.5,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: 'var(--wl-text-faint)',
                    }}
                  >
                    {r.category}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--wl-accent)',
                    }}
                  >
                    {r.pts} pts
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 14, lineHeight: 1.3 }}>
                  {r.label}
                </div>
                <button
                  disabled={!canRedeem}
                  style={{
                    marginTop: 'auto',
                    fontFamily: 'var(--wl-font-body)',
                    fontSize: 11,
                    padding: '5px 10px',
                    background: canRedeem ? 'var(--wl-accent)' : 'transparent',
                    color: canRedeem ? 'var(--wl-accent-fg)' : 'var(--wl-text-faint)',
                    border: canRedeem ? '1px solid var(--wl-accent)' : '1px solid var(--wl-rule)',
                    borderRadius: 'var(--wl-radius-sm)',
                    cursor: canRedeem ? 'pointer' : 'default',
                  }}
                >
                  {canRedeem ? 'Redeem' : `Need ${r.pts - CURRENT_PTS} more`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity log */}
      <div>
        <h2 style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 18, margin: '0 0 12px 0' }}>
          Points activity
        </h2>
        <div
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            overflow: 'hidden',
          }}
        >
          {ACTIVITY.map((a, i) => {
            const isPos = a.delta.startsWith('+');
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--wl-rule-soft)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isPos ? 'var(--wl-success)' : 'var(--wl-text-faint)',
                    marginRight: 12,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 13 }}>{a.desc}</div>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 11, color: 'var(--wl-text-faint)', marginTop: 1 }}>{a.date}</div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: isPos ? 'var(--wl-success)' : 'var(--wl-text-soft)',
                  }}
                >
                  {a.delta}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
