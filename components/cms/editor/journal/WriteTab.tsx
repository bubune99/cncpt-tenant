'use client';

import dynamic from 'next/dynamic';

// Keep SSR-safe dynamic import for TipTap
const TipTapEditor = dynamic(
  () => import('@/components/cms/editor/TipTapEditor'),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 24 }}>
        <div style={{
          height: 8, background: 'var(--rule)', borderRadius: 2, marginBottom: 12, width: '40%',
        }} />
        <div style={{
          height: 400, background: 'var(--paper-2)', border: '1px solid var(--rule)',
          borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-faint)', fontFamily: 'var(--font-geist-mono)',
          fontSize: 12, letterSpacing: '0.1em',
        }}>Loading editor…</div>
      </div>
    ),
  }
);

interface OutlineHeading {
  readonly level: 1 | 2 | 3;
  readonly text: string;
}

interface SeriesInfo {
  readonly title: string;
  readonly position: number;
  readonly total: number;
  readonly items: ReadonlyArray<'live' | 'this' | 'draft' | 'plan'>;
}

interface Contributor {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
  readonly accentClass?: 'gold' | 'moss';
}

interface WriteTabProps {
  readonly contentHtml: string;
  readonly onContentChange: (html: string) => void;
  readonly onJsonChange: (json: object) => void;
  readonly wordCount: number;
  readonly headings: ReadonlyArray<OutlineHeading>;
  readonly series?: SeriesInfo;
  readonly contributors?: ReadonlyArray<Contributor>;
  readonly coverImageUrl?: string;
  readonly coverAlt?: string;
  readonly kicker?: string;
  readonly readTime: number;
}

function Sec({ h, meta }: { h: string; meta?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 6,
      borderBottom: '1px solid var(--rule-soft)', paddingBottom: 4, marginBottom: 8,
    }}>
      <span style={{
        fontFamily: 'var(--font-geist-mono)', fontSize: 10,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)',
        fontWeight: 600,
      }}>{h}</span>
      {meta && <span className="fig" style={{ fontSize: 11 }}>· {meta}</span>}
    </div>
  );
}

function SeriesProgressBar({ items }: { items: ReadonlyArray<'live' | 'this' | 'draft' | 'plan'> }) {
  const colorMap: Record<string, string> = {
    live:  'var(--accent)',
    this:  'var(--ink)',
    draft: 'var(--gold)',
    plan:  'var(--rule)',
  };
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
      {items.map((s, i) => (
        <div key={i} style={{
          flex: 1, height: 20,
          background: colorMap[s],
          border: `1px solid var(--ink)`,
          borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-geist-mono)', fontSize: 9,
          color: s === 'plan' ? 'var(--ink-faint)' : 'var(--paper)',
        }}>{i + 1}</div>
      ))}
    </div>
  );
}

export function WriteTab({
  contentHtml, onContentChange, onJsonChange,
  wordCount, headings, series, contributors, coverImageUrl, coverAlt,
  kicker, readTime,
}: WriteTabProps) {
  const targetWords = 3000;
  const pct = Math.min(100, Math.round((wordCount / targetWords) * 100));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, alignItems: 'start' }}>
      {/* LEFT — Write canvas */}
      <div>
        {/* Prose toolbar hint */}
        <div className="ed-toolbar" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '6px 0 8px', borderBottom: '1px solid var(--rule-soft)',
          marginBottom: 0,
          fontFamily: 'var(--font-geist-mono)', fontSize: 11, color: 'var(--ink-soft)',
        }}>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}><b>{wordCount.toLocaleString()}</b> words</span>
          <span><b>{readTime}</b> min read</span>
          <span style={{ color: pct >= 80 ? 'var(--moss)' : 'var(--ink-soft)' }}>
            <b>{pct}%</b> to target
          </span>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-faint)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            {kicker ?? 'Journal · Feature'}
          </span>
        </div>

        {/* TipTap editor — Atlas-styled via globals/atlas.css wrapper */}
        <div style={{
          background: 'var(--paper)',
          borderLeft: '1px solid var(--rule-soft)',
          borderRight: '1px solid var(--rule-soft)',
          borderBottom: '1px solid var(--rule-soft)',
        }}>
          <TipTapEditor
            content={contentHtml}
            onChange={onContentChange}
            onJsonChange={onJsonChange}
            placeholder="The first seeds went into the soil on a grey morning…"
            minHeight="560px"
            maxHeight="none"
            showWordCount={false}
            autofocus
          />
        </div>

        {/* Pro-tip strip */}
        <div className="action-bar" style={{ borderTop: '1px solid var(--ink)', marginTop: 0, padding: '8px 0' }}>
          <span><span className="kbd">/</span>insert block</span>
          <span><span className="kbd">⌘K</span>link</span>
          <span><span className="kbd">&quot;</span>pull-quote</span>
          <span><span className="kbd">⌘⇧K</span>comment</span>
          <span style={{ marginLeft: 'auto', color: 'var(--moss)' }}>● autosaved</span>
        </div>
      </div>

      {/* RIGHT — Frontmatter rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Outline */}
        {headings.length > 0 && (
          <div>
            <Sec h="Outline" meta={`${headings.length} headings`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {headings.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 6, alignItems: 'baseline',
                  paddingLeft: h.level === 1 ? 0 : h.level === 2 ? 8 : 16,
                  fontSize: 12, color: 'var(--ink-soft)',
                  fontFamily: h.level === 1 ? 'var(--font-display)' : undefined,
                }}>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', minWidth: 16 }}>H{h.level}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Series */}
        {series && (
          <div>
            <Sec h="Series" meta={`${series.position} of ${series.total}`} />
            <div style={{
              background: 'var(--paper-2)', border: '1px solid var(--rule)',
              borderRadius: 2, padding: '8px 10px',
            }}>
              <div className="display-i" style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.2 }}>
                {series.title}
              </div>
              <SeriesProgressBar items={series.items} />
              <div className="fig" style={{ fontSize: 10, marginTop: 4 }}>
                {series.items.filter(s => s === 'live').length} published ·{' '}
                {series.items.filter(s => s === 'draft').length} drafting ·{' '}
                {series.items.filter(s => s === 'plan').length} planned
              </div>
            </div>
          </div>
        )}

        {/* Contributors */}
        {contributors && contributors.length > 0 && (
          <div>
            <Sec h="Byline" meta="who wrote this" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {contributors.map((c, i) => {
                const bgColor = c.accentClass === 'gold' ? 'var(--gold)' :
                                c.accentClass === 'moss' ? 'var(--moss)' :
                                'var(--accent)';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 0', borderBottom: '1px solid var(--rule-soft)',
                  }}>
                    <div style={{
                      width: 28, height: 28, background: bgColor, color: 'var(--paper)',
                      borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 500, flexShrink: 0,
                    }}>{c.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-display)' }}>{c.name}</div>
                      <div className="fig" style={{ fontSize: 10 }}>{c.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cover image */}
        <div>
          <Sec h="Cover" />
          {coverImageUrl ? (
            <div>
              <img
                src={coverImageUrl}
                alt={coverAlt ?? 'Cover image'}
                style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 2 }}
              />
              <div className="fig" style={{ fontSize: 10, marginTop: 4 }}>Cover image set</div>
            </div>
          ) : (
            <div style={{
              height: 90, background: 'var(--paper-2)',
              border: '1px dashed var(--rule)', borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-faint)', fontSize: 11, fontFamily: 'var(--font-geist-mono)',
              letterSpacing: '0.1em', cursor: 'pointer',
            }}>
              + add cover
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
