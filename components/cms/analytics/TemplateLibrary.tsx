'use client';

/**
 * Atlas Analytics — F5 Template Library
 *
 * 6 pre-built dashboard templates + saved dashboards table.
 * Selecting a template fires onSelect. New dashboard fires onCreate.
 */

import React, { useState } from 'react';

// ─── Template definitions ─────────────────────────────────────────────────────

interface TemplateCard {
  readonly id: string;
  readonly title: string;
  readonly titleItalic: string;
  readonly desc: string;
  readonly widgets: number;
  readonly sources: number;
  readonly opens: number;
  /** Thumbnail block layout: array of [colSpan, colorKey?, heightOverride?] */
  readonly thumbRows: ReadonlyArray<ReadonlyArray<[number, string?]>>;
}

const TEMPLATES: readonly TemplateCard[] = [
  {
    id: 'storefront',
    title: 'Storefront',
    titleItalic: 'overview',
    desc: 'Revenue, orders, AOV, conversion and channels at a glance. The default daily-standup dashboard.',
    widgets: 9, sources: 3, opens: 142,
    thumbRows: [
      [[1,'k'],[1,'k'],[1,'k'],[1,'k']],
      [[3,'l'],[1,'d']],
      [[2,''],[1,'b'],[1,'']],
    ],
  },
  {
    id: 'product',
    title: 'Product',
    titleItalic: 'deep-dive',
    desc: 'One product, every angle. Sales trend, inventory, customer breakdown, returns, reviews — variant-level grids.',
    widgets: 12, sources: 5, opens: 38,
    thumbRows: [
      [[4,'l']],
      [[1,'k'],[1,'k'],[1,'b'],[1,'d']],
      [[2,''],[2,'']],
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing',
    titleItalic: 'channels',
    desc: 'Email, social, SEO. Per-channel attribution with funnel breakdowns and content-level tables.',
    widgets: 8, sources: 4, opens: 26,
    thumbRows: [
      [[1,'b'],[1,'b'],[1,'k'],[1,'k']],
      [[2,''],[2,'l']],
      [[4,'d']],
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    titleItalic: 'health',
    desc: 'Stock levels, sell-through rate, reorder thresholds, and a warning list of variants about to go sold-out.',
    widgets: 11, sources: 4, opens: 52,
    thumbRows: [
      [[1,'k'],[1,'k'],[1,'k'],[1,'k']],
      [[4,'d']],
      [[2,''],[2,'l']],
    ],
  },
  {
    id: 'cohorts',
    title: 'Customer',
    titleItalic: 'cohorts',
    desc: 'Retention by signup month, lifetime value buckets, top spenders and at-risk segments. Heatmap-heavy.',
    widgets: 10, sources: 3, opens: 14,
    thumbRows: [
      [[4,'']],
      [[4,'l']],
      [[1,'k'],[1,'k'],[1,'k'],[1,'k']],
    ],
  },
  {
    id: 'quarterly',
    title: 'Quarterly',
    titleItalic: 'report',
    desc: 'Print-friendly · 3 pages · big numbers, narrative copy slots, and a "story so far" comparison to last quarter.',
    widgets: 6, sources: 2, opens: 4,
    thumbRows: [
      [[4,'l']],
      [[4,'']],
      [[2,''],[2,'']],
    ],
  },
];

// ─── Saved dashboards ─────────────────────────────────────────────────────────

interface SavedRow {
  readonly pinned: boolean;
  readonly name: string;
  readonly sub: string;
  readonly audience: string;
  readonly audienceStyle: 'solid-ink' | 'out' | 'out-soft';
  readonly updated: string;
  readonly widgetCount: number;
  readonly archived?: boolean;
}

const SAVED: readonly SavedRow[] = [
  { pinned: true,  name: 'Storefront overview',          sub: '/analytics · default · auto-refresh',          audience: 'TEAM',       audienceStyle: 'solid-ink', updated: '2m ago',   widgetCount: 9  },
  { pinned: true,  name: 'Marigold jacket · live',       sub: '/analytics/product/jkt-mq · in-season',        audience: 'PERSONAL',   audienceStyle: 'out',       updated: '14m',      widgetCount: 12 },
  { pinned: false, name: 'Marketing · spring '25',       sub: 'scheduled report · weekly to founders@',       audience: 'SHARED · 3', audienceStyle: 'out',       updated: 'yesterday', widgetCount: 8  },
  { pinned: false, name: 'Inventory health · weekly',    sub: 'snapshot · last week\'s totals',                audience: 'TEAM',       audienceStyle: 'solid-ink', updated: '3d',       widgetCount: 11 },
  { pinned: false, name: 'Journal · article performance',sub: 'unread time, scroll-depth, share rate',        audience: 'PERSONAL',   audienceStyle: 'out',       updated: '2 weeks',  widgetCount: 6  },
  { pinned: false, name: 'Holiday box · post-mortem',    sub: 'archived · Q4 2024',                           audience: 'ARCHIVED',   audienceStyle: 'out-soft',  updated: 'Jan',      widgetCount: 14, archived: true },
];

// ─── Thumb builder ────────────────────────────────────────────────────────────

function TemplateThumbnail({ rows }: { rows: TemplateCard['thumbRows'] }) {
  const colorClass = (key?: string) => {
    if (!key) return 'at-thumb-t';
    return `at-thumb-t ${key}`;
  };

  return (
    <div className="at-templ-thumb">
      {rows.flatMap((row, ri) =>
        row.map(([span, col], ci) => (
          <div
            key={`${ri}-${ci}`}
            className={colorClass(col)}
            style={{ gridColumn: `span ${span}` }}
          />
        ))
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface TemplateLibraryProps {
  /** Currently active template id */
  activeTemplateId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function TemplateLibrary({ activeTemplateId = 'storefront', onSelect, onCreate }: TemplateLibraryProps) {
  const [selected, setSelected] = useState<string>(activeTemplateId);

  const handleSelect = (id: string) => {
    setSelected(id);
    onSelect(id);
  };

  const audiencePillCls = (style: SavedRow['audienceStyle']) => {
    switch (style) {
      case 'solid-ink': return 'at-pill at-pill-solid-ink';
      case 'out':       return 'at-pill at-pill-out';
      case 'out-soft':  return 'at-pill at-pill-out-soft';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: 12 }}>
      {/* Templates grid */}
      <div className="at-sec">
        <span className="at-sec-h">Templates</span>
        <span className="at-sec-meta">· ready-to-go · pick one and customize</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)' }}>+ submit your own</span>
      </div>

      <div className="at-templ-grid">
        {TEMPLATES.map((tpl) => {
          const isActive = selected === tpl.id;
          return (
            <div
              key={tpl.id}
              className={`at-templ-card${isActive ? ' on' : ''}`}
              onClick={() => handleSelect(tpl.id)}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="at-templ-h">
                  {tpl.title} <span style={{ fontStyle: 'italic', fontWeight: 400 }}>{tpl.titleItalic}</span>
                </div>
                {isActive ? (
                  <span className="at-pill at-pill-solid-accent">IN USE</span>
                ) : (
                  <span className="at-pill at-pill-out-soft">USE</span>
                )}
              </div>
              <div className="at-templ-desc">{tpl.desc}</div>
              <TemplateThumbnail rows={tpl.thumbRows} />
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10, fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, color: 'var(--at-ink-soft)', letterSpacing: '.04em' }}>
                <span><b style={{ color: 'var(--at-ink)', fontWeight: 500 }}>{tpl.widgets}</b> widgets · <b style={{ color: 'var(--at-ink)', fontWeight: 500 }}>{tpl.sources}</b> sources</span>
                <span>opened <b style={{ color: 'var(--at-ink)', fontWeight: 500 }}>{tpl.opens}×</b></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved dashboards */}
      <div className="at-sec">
        <span className="at-sec-h">Your saved dashboards</span>
        <span className="at-sec-meta">· 6 dashboards · pinned first</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)' }}>⌘O open · ⌘D duplicate · star to pin</span>
      </div>

      <div style={{ background: 'var(--at-paper-2)', border: '1px solid var(--at-rule)', borderRadius: 'var(--at-r-sm)', overflow: 'hidden' }}>
        {/* Table header */}
        <div className="at-saved-row" style={{ background: 'var(--at-paper-3)', borderBottom: '1px solid var(--at-ink)', padding: '6px 10px', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--at-ink-soft)' }}>
          <span></span>
          <span>Dashboard</span>
          <span>Audience</span>
          <span>Updated</span>
          <span style={{ textAlign: 'right' }}>Widgets</span>
          <span></span>
        </div>

        {SAVED.map((row, i) => (
          <div key={i} className="at-saved-row" style={{ opacity: row.archived ? 0.6 : undefined }}>
            <span style={{ color: row.pinned ? 'var(--at-accent)' : 'var(--at-ink-faint)', fontSize: 14, textAlign: 'center' }}>
              {row.pinned ? '★' : '◯'}
            </span>
            <div>
              <div className="at-saved-name">{row.name}</div>
              <div className="at-saved-sub">{row.sub}</div>
            </div>
            <span>
              <span className={audiencePillCls(row.audienceStyle)}>{row.audience}</span>
            </span>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11, fontStyle: 'italic' }}>{row.updated}</span>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11, textAlign: 'right' }}>{row.widgetCount}</span>
            <span style={{ color: 'var(--at-ink-faint)', textAlign: 'center', cursor: 'pointer' }}>⋯</span>
          </div>
        ))}
      </div>

      {/* Create new */}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="at-btn" onClick={() => {}}>
          <span className="at-kbd">⌘O</span> Open shared
        </button>
        <button className="at-btn at-btn-accent" onClick={onCreate}>
          <span className="at-kbd">N</span> New from blank
        </button>
      </div>
    </div>
  );
}
