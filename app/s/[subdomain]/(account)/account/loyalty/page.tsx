'use client';

/**
 * Atlas Customer Loyalty & Store Credit (D7)
 * Tier badge, points balance, progress bar, rewards grid, activity log.
 * Uses --wl-* tokens exclusively.
 * Wired to /api/cms/account/loyalty.
 */

import Link from 'next/link';
import useSWR from 'swr';

// ---------- API Types ---------------------------------------------------

interface LoyaltyReward {
  readonly id: string;
  readonly label: string;
  readonly pts: number;
  readonly category: string;
}

interface LoyaltyActivity {
  readonly id: string;
  readonly type: string;
  readonly points: number;
  readonly description: string;
  readonly referenceId: string | null;
  readonly createdAt: string;
}

interface LoyaltyData {
  readonly tier: string;
  readonly points: number;
  readonly nextTierPts: number | null;
  readonly rewards: readonly LoyaltyReward[];
  readonly activityLog: readonly LoyaltyActivity[];
}

interface LoyaltyResponse {
  readonly success: boolean;
  readonly data: LoyaltyData;
}

// ---------- Tier colour map --------------------------------------------

const TIER_COLORS: Record<string, string> = {
  Bronze:   '#cd7f32',
  Silver:   '#aaaaaa',
  Gold:     '#c9a84c',
  Platinum: '#b0c4de',
};

const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const;
type KnownTier = typeof TIER_ORDER[number];

function isKnownTier(t: string): t is KnownTier {
  return (TIER_ORDER as readonly string[]).includes(t);
}

function tierColor(tier: string): string {
  return TIER_COLORS[tier] ?? 'var(--wl-accent)';
}

// ---------- Fetcher -----------------------------------------------------

const fetcher = async (url: string): Promise<LoyaltyResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json() as Promise<LoyaltyResponse>;
};

// ---------- Hook --------------------------------------------------------

function useLoyalty() {
  const { data, error, isLoading } = useSWR<LoyaltyResponse>(
    '/api/cms/account/loyalty',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );

  return {
    loyalty: data?.data ?? null,
    isLoading,
    isError: !!error,
  };
}

// ---------- Helpers -----------------------------------------------------

function formatActivityDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

function activityDelta(activity: LoyaltyActivity): string {
  const sign = activity.points >= 0 ? '+' : '';
  return `${sign}${activity.points} pts`;
}

// ---------- Component ---------------------------------------------------

export default function LoyaltyPage() {
  const { loyalty, isLoading, isError } = useLoyalty();

  const tier = loyalty?.tier ?? 'Bronze';
  const points = loyalty?.points ?? 0;
  const nextTierPts = loyalty?.nextTierPts ?? null;
  const rewards = loyalty?.rewards ?? [];
  const activityLog = loyalty?.activityLog ?? [];

  const currentColor = tierColor(tier);

  /** Progress percentage within current tier band */
  const tierIdx = isKnownTier(tier) ? TIER_ORDER.indexOf(tier) : 0;
  const prevTierMin = tierIdx > 0 ? ([0, 500, 1500, 5000] as const)[tierIdx] : 0;
  const nextTierMax = nextTierPts !== null ? points + nextTierPts : null;
  const pct =
    nextTierMax !== null
      ? Math.min(100, Math.round(((points - prevTierMin) / (nextTierMax - prevTierMin)) * 100))
      : 100;

  const nextTierLabel = isKnownTier(tier) && tierIdx < TIER_ORDER.length - 1
    ? TIER_ORDER[tierIdx + 1]
    : null;

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

      {/* Loading state */}
      {isLoading && (
        <div
          style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--wl-text-faint)',
            fontFamily: 'var(--wl-font-mono)',
            fontSize: 11,
            letterSpacing: '.06em',
          }}
        >
          Loading loyalty data…
        </div>
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <div
          style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--wl-text-soft)',
            fontFamily: 'var(--wl-font-display)',
            fontStyle: 'italic',
            fontSize: 14,
          }}
        >
          Could not load loyalty data. Please try again later.
        </div>
      )}

      {/* Main content */}
      {!isLoading && !isError && loyalty !== null && (
        <>
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
                  background: `radial-gradient(circle at 35% 35%, ${currentColor}, color-mix(in srgb, ${currentColor} 60%, black))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 0 0 4px color-mix(in srgb, ${currentColor} 20%, transparent)`,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity={0.9}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 9.5,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: 'var(--wl-text-faint)',
                    marginBottom: 4,
                  }}
                >
                  Current tier
                </div>
                <div
                  style={{
                    fontFamily: 'var(--wl-font-display)',
                    fontSize: 26,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {tier}
                </div>
                {/* Tier dot indicators */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {TIER_ORDER.map((t, idx) => (
                    <div
                      key={t}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: idx <= tierIdx ? tierColor(t) : 'var(--wl-rule)',
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 9.5,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: 'var(--wl-text-faint)',
                      marginBottom: 4,
                    }}
                  >
                    Points balance
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--wl-font-display)',
                      fontSize: 32,
                      fontWeight: 500,
                    }}
                  >
                    {points.toLocaleString()}
                    <span
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 12,
                        color: 'var(--wl-text-faint)',
                        marginLeft: 6,
                      }}
                    >
                      pts
                    </span>
                  </div>
                </div>
                {nextTierLabel !== null && nextTierPts !== null && (
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 9.5,
                        color: 'var(--wl-text-faint)',
                        letterSpacing: '.06em',
                      }}
                    >
                      NEXT: {nextTierLabel.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 11,
                        color: 'var(--wl-accent)',
                        marginTop: 2,
                      }}
                    >
                      {nextTierPts} pts away
                    </div>
                  </div>
                )}
                {(nextTierLabel === null || nextTierPts === null) && (
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 9.5,
                        color: 'var(--wl-accent)',
                        letterSpacing: '.06em',
                      }}
                    >
                      MAX TIER
                    </div>
                  </div>
                )}
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 9.5,
                    color: 'var(--wl-text-faint)',
                  }}
                >
                  {tier} ({prevTierMin})
                </span>
                {nextTierLabel !== null && nextTierMax !== null && (
                  <span
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 9.5,
                      color: 'var(--wl-text-faint)',
                    }}
                  >
                    {nextTierLabel} ({nextTierMax})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rewards grid */}
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontWeight: 500,
                fontSize: 18,
                margin: '0 0 12px 0',
              }}
            >
              Redeem rewards
            </h2>
            {rewards.length === 0 ? (
              <div
                style={{
                  background: 'var(--wl-surface)',
                  border: '1px solid var(--wl-rule)',
                  borderRadius: 'var(--wl-radius)',
                  padding: '24px 20px',
                  fontFamily: 'var(--wl-font-display)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--wl-text-soft)',
                }}
              >
                No rewards available yet — check back soon.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {rewards.map((r) => {
                  const canRedeem = points >= r.pts;
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                        }}
                      >
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
                      <div
                        style={{
                          fontFamily: 'var(--wl-font-display)',
                          fontSize: 14,
                          lineHeight: 1.3,
                        }}
                      >
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
                        {canRedeem ? 'Redeem' : `Need ${r.pts - points} more`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity log */}
          <div>
            <h2
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontWeight: 500,
                fontSize: 18,
                margin: '0 0 12px 0',
              }}
            >
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
              {activityLog.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    fontFamily: 'var(--wl-font-display)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--wl-text-soft)',
                  }}
                >
                  No points activity yet.
                </div>
              ) : (
                activityLog.map((a, i) => {
                  const delta = activityDelta(a);
                  const isPos = a.points >= 0;
                  return (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom:
                          i < activityLog.length - 1 ? '1px solid var(--wl-rule-soft)' : 'none',
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
                        <div
                          style={{
                            fontFamily: 'var(--wl-font-display)',
                            fontSize: 13,
                          }}
                        >
                          {a.description}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--wl-font-display)',
                            fontStyle: 'italic',
                            fontSize: 11,
                            color: 'var(--wl-text-faint)',
                            marginTop: 1,
                          }}
                        >
                          {formatActivityDate(a.createdAt)}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--wl-font-mono)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: isPos ? 'var(--wl-success)' : 'var(--wl-text-soft)',
                        }}
                      >
                        {delta}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
