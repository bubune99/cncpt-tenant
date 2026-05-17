'use client';

/**
 * Atlas Customer Wishlist (D5)
 * Saved items with stock/sale/OOS/purchased tags.
 * Uses --wl-* tokens exclusively.
 */

import Link from 'next/link';

type WishTag = '' | 'BACK IN STOCK' | 'SALE −20%' | 'OUT OF STOCK' | 'PURCHASED' | '6 LEFT';
type TagStyle = { background: string; color: string; border?: string };

function tagStyle(tag: WishTag): TagStyle {
  switch (tag) {
    case 'BACK IN STOCK': return { background: 'var(--wl-accent)',   color: 'var(--wl-accent-fg)' };
    case 'SALE −20%':     return { background: 'var(--wl-warning)',  color: '#fff' };
    case 'OUT OF STOCK':  return { background: 'var(--wl-text)',     color: 'var(--wl-bg)' };
    case '6 LEFT':        return { background: 'transparent', color: 'var(--wl-accent)', border: '1px solid var(--wl-accent)' };
    case 'PURCHASED':     return { background: 'transparent', color: 'var(--wl-text-soft)', border: '1px solid var(--wl-rule)' };
    default:              return { background: 'transparent', color: 'transparent' };
  }
}

const ITEMS: ReadonlyArray<{
  nm: string; v: string; price: string; tag: WishTag; added: string; sale?: boolean; oos?: boolean; bought?: boolean;
}> = [
  { nm: 'Seasonal tote',    v: 'Canvas · large',  price: '$58', tag: 'BACK IN STOCK', added: '12 May' },
  { nm: 'Heritage hoodie',  v: 'Brick · M',       price: '$92', tag: '',              added: '08 May' },
  { nm: 'Field journal',    v: 'A5 · linen',       price: '$22', tag: 'SALE −20%',    added: '02 May', sale: true },
  { nm: 'Wax candle',       v: 'Cardamom',         price: '$28', tag: '',              added: '28 Apr' },
  { nm: 'Linen apron',      v: 'Natural',          price: '$48', tag: 'OUT OF STOCK',  added: '20 Apr', oos: true },
  { nm: 'Patch set',        v: '3 pieces',         price: '$14', tag: '',              added: '14 Apr' },
  { nm: 'Heritage seed box',v: 'Spring 2026',      price: '$28', tag: '6 LEFT',        added: '12 Apr' },
  { nm: 'Classic cap',      v: 'Moss',             price: '$18', tag: 'PURCHASED',     added: '08 Apr', bought: true },
] as const;

export default function WishlistPage() {
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
            <span style={{ color: 'var(--wl-text)' }}>Wishlist</span>
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
            Your <em style={{ fontStyle: 'italic', fontWeight: 400 }}>wishlist</em>
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
            {ITEMS.length} saved · 1 back in stock · 1 on sale
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>
          <button
            style={{
              fontFamily: 'var(--wl-font-body)',
              fontSize: 12,
              padding: '5px 10px',
              border: '1px solid var(--wl-rule)',
              color: 'var(--wl-text-soft)',
              borderRadius: 'var(--wl-radius-sm)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Share list
          </button>
          <button
            style={{
              fontFamily: 'var(--wl-font-body)',
              fontSize: 12,
              padding: '5px 10px',
              background: 'var(--wl-text)',
              color: 'var(--wl-bg)',
              border: '1px solid var(--wl-text)',
              borderRadius: 'var(--wl-radius-sm)',
              cursor: 'pointer',
            }}
          >
            Move all to bag
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        {['All', 'In stock', 'Sale', 'Back in stock', 'Out of stock'].map((label, i) => (
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
              color: i === 0 ? 'var(--wl-accent-fg)' : 'var(--wl-text-soft)',
              background: i === 0 ? 'var(--wl-accent)' : 'transparent',
              border: `1px solid ${i === 0 ? 'var(--wl-accent)' : 'var(--wl-rule)'}`,
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--wl-text-faint)',
            }}
          >
            Sort
          </span>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10.5,
              letterSpacing: '.06em',
              color: 'var(--wl-text-soft)',
              background: 'transparent',
              border: '1px solid var(--wl-rule)',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            Recently added ▾
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
        }}
      >
        {ITEMS.map((item) => {
          const ts = tagStyle(item.tag);
          return (
            <div
              key={item.nm}
              style={{
                background: 'var(--wl-surface)',
                border: '1px solid var(--wl-rule)',
                borderRadius: 'var(--wl-radius)',
                overflow: 'hidden',
                opacity: item.bought ? 0.65 : 1,
                position: 'relative',
              }}
            >
              {/* Image area */}
              <div
                style={{
                  height: 140,
                  background: 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 6px, var(--wl-surface-3) 6px 12px)',
                  borderBottom: '1px solid var(--wl-rule-soft)',
                  position: 'relative',
                }}
              >
                {item.tag && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 9.5,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      lineHeight: 1.4,
                      borderRadius: 999,
                      background: ts.background,
                      color: ts.color,
                      border: ts.border ?? 'none',
                    }}
                  >
                    {item.tag}
                  </span>
                )}
                {/* Heart */}
                <button
                  aria-label="Remove from wishlist"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 26,
                    height: 26,
                    background: 'var(--wl-bg)',
                    border: 'none',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--wl-accent)',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21s-7-4.5-9-9c-1-2.5.5-6 4-6 2 0 3 1.5 5 4 2-2.5 3-4 5-4 3.5 0 5 3.5 4 6-2 4.5-9 9-9 9Z" />
                  </svg>
                </button>
              </div>

              {/* Meta */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 14, lineHeight: 1.15 }}>
                  {item.nm}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 12,
                    color: 'var(--wl-text-soft)',
                    marginTop: 4,
                  }}
                >
                  {item.v}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: item.sale ? 'var(--wl-warning)' : 'var(--wl-text)',
                    }}
                  >
                    {item.price}
                  </span>
                  {item.oos ? (
                    <a
                      href="#"
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 10,
                        color: 'var(--wl-accent)',
                        textDecoration: 'none',
                      }}
                    >
                      Notify me →
                    </a>
                  ) : item.bought ? (
                    <Link
                      href="/shop"
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 10,
                        color: 'var(--wl-accent)',
                        textDecoration: 'none',
                      }}
                    >
                      Buy again →
                    </Link>
                  ) : (
                    <button
                      style={{
                        fontFamily: 'var(--wl-font-body)',
                        fontSize: 11,
                        padding: '4px 8px',
                        background: 'var(--wl-accent)',
                        color: 'var(--wl-accent-fg)',
                        border: '1px solid var(--wl-accent)',
                        borderRadius: 'var(--wl-radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      Add to bag
                    </button>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--wl-font-mono)',
                    fontSize: 9.5,
                    color: 'var(--wl-text-faint)',
                    marginTop: 8,
                    letterSpacing: '.04em',
                  }}
                >
                  SAVED {item.added.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
