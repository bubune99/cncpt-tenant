'use client';

/**
 * Atlas Customer Reviews
 * Written reviews, pending review queue, average star rating display.
 * Uses --wl-* tokens exclusively.
 */

import { useState } from 'react';
import Link from 'next/link';

type ReviewTab = 'written' | 'pending';

interface WrittenReview {
  readonly id: string;
  readonly productName: string;
  readonly variant: string;
  readonly rating: number;
  readonly date: string;
  readonly body: string;
  readonly helpful: number;
}

interface PendingItem {
  readonly id: string;
  readonly productName: string;
  readonly variant: string;
  readonly orderedOn: string;
}

const WRITTEN: ReadonlyArray<WrittenReview> = [
  {
    id: 'rv1',
    productName: 'Heritage hoodie',
    variant: 'Brick · M',
    rating: 5,
    date: '10 May',
    body: 'Incredible quality — the fabric gets better with every wash. The fit is generous without being sloppy. My new favourite.',
    helpful: 12,
  },
  {
    id: 'rv2',
    productName: 'Field journal',
    variant: 'A5 · linen',
    rating: 4,
    date: '28 Apr',
    body: 'Beautiful object. Paper is thick and fountain-pen friendly. Lost a star because the binding cracked slightly after a month.',
    helpful: 7,
  },
  {
    id: 'rv3',
    productName: 'Wax candle',
    variant: 'Cardamom',
    rating: 5,
    date: '02 Apr',
    body: 'Burns clean and slow. The scent is subtle — cardamom forward but not overpowering.',
    helpful: 4,
  },
] as const;

const PENDING: ReadonlyArray<PendingItem> = [
  { id: 'p1', productName: 'Seasonal tote',    variant: 'Canvas · large', orderedOn: '12 May' },
  { id: 'p2', productName: 'Classic cap',       variant: 'Moss',           orderedOn: '08 Apr' },
] as const;

function StarRow({ rating, interactive, onRate }: { readonly rating: number; readonly interactive?: boolean; readonly onRate?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (interactive ? (hover || rating) : rating);
        return (
          <span
            key={n}
            onClick={() => interactive && onRate?.(n)}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            style={{
              fontSize: 14,
              color: filled ? 'var(--wl-accent)' : 'var(--wl-rule)',
              cursor: interactive ? 'pointer' : 'default',
              lineHeight: 1,
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

export default function ReviewsPage() {
  const [tab, setTab] = useState<ReviewTab>('written');
  const [draftRatings, setDraftRatings] = useState<Record<string, number>>({});
  const [draftBodies, setDraftBodies]   = useState<Record<string, string>>({});
  const [submitted, setSubmitted]       = useState<ReadonlySet<string>>(new Set());

  const avgRating = WRITTEN.reduce((s, r) => s + r.rating, 0) / WRITTEN.length;

  const submitReview = (id: string) => {
    setSubmitted((prev) => new Set([...prev, id]));
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
          <span style={{ color: 'var(--wl-text)' }}>Reviews</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
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
              My <em style={{ fontStyle: 'italic', fontWeight: 400 }}>reviews</em>
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
              {WRITTEN.length} reviews written · {PENDING.length} awaiting your thoughts
            </div>
          </div>
          {/* Average rating badge */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {avgRating.toFixed(1)}
              <span style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 13, color: 'var(--wl-text-faint)', marginLeft: 4 }}>/ 5</span>
            </div>
            <StarRow rating={Math.round(avgRating)} />
            <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9, color: 'var(--wl-text-faint)', marginTop: 3, letterSpacing: '.06em' }}>
              AVG ACROSS {WRITTEN.length} REVIEWS
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 16 }}>
        {([
          ['written', `Written (${WRITTEN.length})`],
          ['pending', `Write a review (${PENDING.length})`],
        ] as [ReviewTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '5px 12px',
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10.5,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: tab === key ? 'var(--wl-accent-fg)' : 'var(--wl-text-soft)',
              background: tab === key ? 'var(--wl-accent)' : 'transparent',
              border: `1px solid ${tab === key ? 'var(--wl-accent)' : 'var(--wl-rule)'}`,
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Written reviews */}
      {tab === 'written' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {WRITTEN.map((r) => (
            <div
              key={r.id}
              style={{
                background: 'var(--wl-surface)',
                border: '1px solid var(--wl-rule)',
                borderRadius: 'var(--wl-radius)',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 15 }}>{r.productName}</div>
                  <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 11, color: 'var(--wl-text-soft)', marginTop: 2 }}>{r.variant}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <StarRow rating={r.rating} />
                  <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, color: 'var(--wl-text-faint)', marginTop: 3 }}>{r.date}</div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--wl-font-display)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--wl-text-soft)',
                  lineHeight: 1.55,
                  paddingTop: 10,
                  borderTop: '1px solid var(--wl-rule-soft)',
                }}
              >
                &ldquo;{r.body}&rdquo;
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, color: 'var(--wl-text-faint)' }}>
                  {r.helpful} people found this helpful
                </div>
                <button
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 9.5,
                    letterSpacing: '.04em',
                    color: 'var(--wl-text-faint)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending reviews */}
      {tab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PENDING.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', color: 'var(--wl-text-soft)' }}>
              You're all caught up — no reviews pending.
            </div>
          ) : (
            PENDING.map((item) => {
              if (submitted.has(item.id)) {
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'color-mix(in srgb, var(--wl-success) 8%, var(--wl-surface))',
                      border: '1px solid color-mix(in srgb, var(--wl-success) 30%, transparent)',
                      borderRadius: 'var(--wl-radius)',
                      padding: '18px',
                      fontFamily: 'var(--wl-font-display)',
                      fontStyle: 'italic',
                      color: 'var(--wl-success)',
                      fontSize: 13,
                    }}
                  >
                    Review for "{item.productName}" submitted — thank you!
                  </div>
                );
              }
              const rating = draftRatings[item.id] ?? 0;
              const body   = draftBodies[item.id] ?? '';
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--wl-surface)',
                    border: '1px solid var(--wl-rule)',
                    borderRadius: 'var(--wl-radius)',
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--wl-radius-sm)',
                        background: 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 4px, var(--wl-surface-3) 4px 8px)',
                        border: '1px solid var(--wl-rule)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 14 }}>{item.productName}</div>
                      <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 11, color: 'var(--wl-text-soft)', marginTop: 2 }}>
                        {item.variant} · ordered {item.orderedOn}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--wl-text-faint)', marginBottom: 6 }}>
                      Your rating
                    </div>
                    <StarRow
                      rating={rating}
                      interactive
                      onRate={(n) => setDraftRatings((prev) => ({ ...prev, [item.id]: n }))}
                    />
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setDraftBodies((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Share your honest thoughts…"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontFamily: 'var(--wl-font-display)',
                      fontStyle: 'italic',
                      fontSize: 13,
                      background: 'var(--wl-bg)',
                      border: '1px solid var(--wl-rule)',
                      borderRadius: 'var(--wl-radius-sm)',
                      color: 'var(--wl-text)',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      disabled={rating === 0 || body.trim() === ''}
                      onClick={() => submitReview(item.id)}
                      style={{
                        fontFamily: 'var(--wl-font-body)',
                        fontSize: 12,
                        padding: '6px 14px',
                        background: rating > 0 && body.trim() ? 'var(--wl-text)' : 'var(--wl-surface-2)',
                        color: rating > 0 && body.trim() ? 'var(--wl-bg)' : 'var(--wl-text-faint)',
                        border: '1px solid var(--wl-rule)',
                        borderRadius: 'var(--wl-radius-sm)',
                        cursor: rating > 0 && body.trim() ? 'pointer' : 'default',
                      }}
                    >
                      Submit review
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
