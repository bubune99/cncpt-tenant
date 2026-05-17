'use client';

/**
 * Atlas Analytics — F3 Configure Inspector
 *
 * Shows live preview on the left + full inspector on the right.
 * Uses real React state to track viz selection, filters, comparison.
 */

import React, { useState } from 'react';
import { LineChart } from './charts';
import { MiniLine, MiniArea, MiniBar, MiniKpi } from './charts';
import { DEMO_DATA } from '@/lib/cms/analytics/demo-data';

type VizType = 'LINE' | 'AREA' | 'BAR' | 'KPI';
type ComparisonType = 'prev' | 'year' | 'none';

const VIZ_OPTIONS: { type: VizType; icon: React.ReactNode }[] = [
  { type: 'LINE', icon: <MiniLine /> },
  { type: 'AREA', icon: <MiniArea /> },
  { type: 'BAR',  icon: <MiniBar />  },
  { type: 'KPI',  icon: <MiniKpi />  },
];

interface FilterRow {
  readonly field: string;
  readonly op: string;
  readonly value: string;
}

const DEFAULT_FILTERS: FilterRow[] = [
  { field: "orders.status", op: "=",  value: "'paid'"  },
  { field: "orders.test",   op: "=",  value: "false"   },
];

const COLOR_OPTIONS: string[] = [
  'var(--at-accent)',
  'var(--at-moss)',
  'var(--at-gold)',
  'var(--at-indigo)',
];

export interface ConfigureInspectorProps {
  /** Called when user clicks "Done" */
  onDone: () => void;
  /** Called when user clicks "open query" */
  onOpenQuery: () => void;
}

export function ConfigureInspector({ onDone, onOpenQuery }: ConfigureInspectorProps) {
  const [viz, setViz] = useState<VizType>('LINE');
  const [comparison, setComparison] = useState<ComparisonType>('prev');
  const [title, setTitle] = useState('Revenue');
  const [subtitle, setSubtitle] = useState('last 30 days · daily');
  const [selectedColor, setSelectedColor] = useState(0);
  const [filters, setFilters] = useState<FilterRow[]>(DEFAULT_FILTERS);

  const removeFilter = (i: number) => {
    setFilters((prev) => prev.filter((_, idx) => idx !== i));
  };

  const chartColor = COLOR_OPTIONS[selectedColor] ?? 'var(--at-accent)';

  return (
    <div className="at-config-wrap">
      {/* LEFT — live preview */}
      <div className="at-config-stage">
        <div className="preview-banner" style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingBottom: 10,
          marginBottom: 14,
          borderBottom: '1px solid var(--at-rule)',
        }}>
          <span style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontSize: 16 }}>Live preview · 8 × 3 tile</span>
          <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)', letterSpacing: '.04em' }}>renders on update · 28ms · cached</span>
        </div>

        <div className="at-widget-isolate">
          <div className="at-w-head">
            <span className="at-w-title">{title || 'Revenue'}</span>
            <span className="at-w-sub">{subtitle}</span>
            <span className="at-w-right">
              <span className="at-badge">$28,940</span>
              <span style={{ color: 'var(--at-moss)' }}>+24%</span>
            </span>
          </div>
          <div className="at-chart-canvas">
            <LineChart
              series={[
                { name: 'this period', color: chartColor, data: [...DEMO_DATA.revenue30] },
                ...(comparison !== 'none'
                  ? [{ name: 'prev period', color: 'var(--at-ink-faint)', data: [...DEMO_DATA.prevRevenue30] }]
                  : []),
              ]}
              xLabels={[...DEMO_DATA.days]}
              dotted={comparison !== 'none'}
              height={260}
            />
          </div>
          <div className="at-legend">
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span className="at-sw" style={{ background: chartColor }}></span>
              this period · $28,940
            </span>
            {comparison !== 'none' && (
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span className="at-sw" style={{ background: 'var(--at-ink-faint)' }}></span>
                prev 30d · $23,380
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)' }}>
              30 points · daily
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: 'var(--at-ink-soft)' }}>
          <span><b style={{ color: 'var(--at-ink)' }}>Bounds</b> · y-axis 0 → 1.8k</span>
          <span><b style={{ color: 'var(--at-ink)' }}>Aggregation</b> · sum(daily)</span>
          <span><b style={{ color: 'var(--at-ink)' }}>Refresh</b> · 5m</span>
          <span style={{ marginLeft: 'auto' }}>
            <button
              onClick={onOpenQuery}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--at-accent)', fontSize: 11 }}
            >
              ↗ view full data · jump to query
            </button>
          </span>
        </div>
      </div>

      {/* RIGHT — inspector */}
      <div className="at-inspector">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span className="at-eyebrow">Widget · {viz}</span>
          <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9, color: 'var(--at-ink-soft)', letterSpacing: '.1em' }}>
            cell B-2 · 8 × 3
          </span>
        </div>

        {/* Title */}
        <div className="at-cfg-section">
          <div className="at-cfg-h">Title <span style={{ color: 'var(--at-ink-soft)', fontSize: 9.5 }}>visible on the tile</span></div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              fontFamily: 'var(--font-display, Spectral, serif)',
              fontSize: 14,
              padding: '4px 8px',
              background: 'var(--at-paper)',
              border: '1px solid var(--at-rule)',
              borderRadius: 'var(--at-r-sm)',
              color: 'var(--at-ink)',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Subtitle</span>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'var(--font-display, Spectral, serif)',
                fontStyle: 'italic',
                fontSize: 13,
                padding: '3px 8px',
                background: 'var(--at-paper)',
                border: '1px solid var(--at-rule)',
                borderRadius: 'var(--at-r-sm)',
                color: 'var(--at-ink-soft)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Visualization */}
        <div className="at-cfg-section">
          <div className="at-cfg-h">
            Visualization{' '}
            <span style={{ color: 'var(--at-ink-soft)', fontSize: 9.5 }}>5 types available for this data</span>
          </div>
          <div className="at-viz-picker">
            {VIZ_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                className={`at-viz-opt${viz === opt.type ? ' on' : ''}`}
                title={opt.type}
                onClick={() => setViz(opt.type)}
                style={{ cursor: 'pointer', border: viz === opt.type ? undefined : undefined }}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Data / query */}
        <div className="at-cfg-section">
          <div className="at-cfg-h">Data · query</div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, color: 'var(--at-ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Metric</div>
            <span className="at-field-chip">
              <span className="at-chip-tag met">Σ</span>
              sum(orders.total_cents) / 100
              <span style={{ color: 'var(--at-ink-faint)', cursor: 'pointer' }}>▾</span>
            </span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, color: 'var(--at-ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Group by</div>
            <span className="at-field-chip">
              <span className="at-chip-tag dim">▭</span>
              date_trunc(&apos;day&apos;, orders.created_at)
              <span style={{ color: 'var(--at-ink-faint)', cursor: 'pointer' }}>▾</span>
            </span>
            <span className="at-field-chip dash">+ breakdown</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, color: 'var(--at-ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Filters · {filters.length}
            </div>
            {filters.map((f, i) => (
              <div key={i} className="at-filter-row">
                <span className="at-filter-ctrl">{f.field}</span>
                <span className="at-filter-op">{f.op}</span>
                <span className="at-filter-ctrl">{f.value}</span>
                <button
                  onClick={() => removeFilter(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--at-ink-faint)', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11, textAlign: 'center' }}
                >
                  ×
                </button>
              </div>
            ))}
            <span className="at-field-chip dash" style={{ marginTop: 4 }}>+ filter</span>
          </div>
        </div>

        {/* Comparison */}
        <div className="at-cfg-section">
          <div className="at-cfg-h">Comparison</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {(['prev', 'year', 'none'] as ComparisonType[]).map((c) => (
              <button
                key={c}
                className={`at-chip${comparison === c ? ' on' : ''}`}
                style={{ borderRadius: 'var(--at-r-sm)' }}
                onClick={() => setComparison(c)}
              >
                {c === 'prev' ? 'prev period' : c === 'year' ? 'prev year' : '—'}
              </button>
            ))}
          </div>
          {comparison !== 'none' && (
            <div style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontStyle: 'italic', fontSize: 11.5, color: 'var(--at-ink-soft)' }}>
              Comparison line dashed · same y-axis · delta surfaced in header
            </div>
          )}
        </div>

        {/* Style */}
        <div className="at-cfg-section">
          <div className="at-cfg-h">Style</div>
          <div style={{ display: 'flex', gap: 6, padding: '4px 0', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase', width: 50 }}>color</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {COLOR_OPTIONS.map((col, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 2,
                    background: col,
                    border: selectedColor === i ? '2px solid var(--at-ink)' : '1px solid var(--at-rule)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '4px 0' }}>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase', width: 50 }}>fill</span>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11 }}>area · 12%</span>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '4px 0' }}>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase', width: 50 }}>y-axis</span>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11 }}>auto · start at 0</span>
          </div>
        </div>

        {/* Drill */}
        <div className="at-cfg-section">
          <div className="at-cfg-h">Drill</div>
          <div style={{ fontSize: 12, color: 'var(--at-ink-soft)', fontFamily: 'var(--font-display, Spectral, serif)', fontStyle: 'italic' }}>
            Click a point opens{' '}
            <span style={{ color: 'var(--at-accent)', fontStyle: 'normal' }}>orders</span>{' '}
            for that day, filtered.
          </div>
        </div>

        {/* Done */}
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <button className="at-btn at-btn-accent" style={{ width: '100%', justifyContent: 'center' }} onClick={onDone}>
            <span className="at-kbd">⌘S</span> Done
          </button>
        </div>
      </div>
    </div>
  );
}
