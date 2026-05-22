'use client';

/**
 * Atlas Analytics — Widget Palette (F2 slide-in from right)
 *
 * Shows 10 chart type tiles + saved snippets.
 * Clicking a tile triggers onAdd; parent controls whether palette is visible.
 */

import React from 'react';
import type { AtlasWidgetKind } from '@/lib/cms/dashboard/atlas-widgets';
import { ATLAS_WIDGET_REGISTRY } from '@/lib/cms/dashboard/atlas-widgets';
import {
  MiniLine,
  MiniArea,
  MiniBar,
  MiniDonut,
  MiniKpi,
  MiniTable,
  MiniFunnel,
  MiniFeed,
  MiniHeat,
  MiniMap,
} from './charts';

// ─── Icon map ─────────────────────────────────────────────────────────────────

const MINI_ICONS: Record<AtlasWidgetKind, React.ReactNode> = {
  KPI:    <MiniKpi />,
  LINE:   <MiniLine />,
  AREA:   <MiniArea />,
  BAR:    <MiniBar />,
  DONUT:  <MiniDonut />,
  TABLE:  <MiniTable />,
  FUNNEL: <MiniFunnel />,
  FEED:   <MiniFeed />,
  HEAT:   <MiniHeat />,
  MAP:    <MiniMap />,
};

const WIDGET_KINDS = Object.keys(ATLAS_WIDGET_REGISTRY) as AtlasWidgetKind[];

// ─── Saved snippets ───────────────────────────────────────────────────────────

const SAVED_SNIPPETS = [
  { title: 'Top 10 SKUs by revenue', desc: 'table · 6 × 4 default' },
  { title: 'Inventory · low stock',  desc: 'alert list · 3 × 3'   },
  { title: 'Customer cohorts',       desc: 'heatmap · 8 × 4'       },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WidgetPaletteProps {
  onAdd: (kind: AtlasWidgetKind) => void;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WidgetPalette({ onAdd, onClose }: WidgetPaletteProps) {
  return (
    <div className="at-palette">
      <div className="at-palette-head">
        <span className="at-palette-h">Add widget</span>
        <button
          className="at-btn at-btn-ghost"
          style={{ padding: '2px 8px', fontSize: 10, border: 'none' }}
          onClick={onClose}
        >
          <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, color: 'var(--at-ink-soft)' }}>
            <span className="at-kbd">⎋</span> close
          </span>
        </button>
      </div>

      <div className="at-palette-body">
        <p style={{
          fontFamily: 'var(--font-display, Spectral, serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--at-ink-soft)',
          marginBottom: 10,
          lineHeight: 1.4,
        }}>
          Click a tile to add it to the next empty slot.
        </p>

        <div className="at-palette-grid">
          {WIDGET_KINDS.map((kind) => {
            const meta = ATLAS_WIDGET_REGISTRY[kind];
            return (
              <button
                key={kind}
                className={`at-wp-tile${kind === 'HEAT' ? ' featured' : ''}`}
                style={{ border: 'none', textAlign: 'center' }}
                onClick={() => onAdd(kind)}
              >
                <div className="at-icon-frame">{MINI_ICONS[kind]}</div>
                <div className="at-wp-label">{meta.label}</div>
                <div className="at-wp-desc">{meta.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="at-sec" style={{ marginTop: 4 }}>
          <span className="at-sec-h" style={{ fontSize: 14 }}>From templates</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SAVED_SNIPPETS.map((s) => (
            <div
              key={s.title}
              style={{
                padding: 8,
                background: 'var(--at-paper-2)',
                border: '1px solid var(--at-rule)',
                borderRadius: 'var(--at-r-sm)',
                fontSize: 12,
                cursor: 'grab',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontSize: 13 }}>{s.title}</div>
              <div className="at-fig" style={{ fontSize: 11 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
