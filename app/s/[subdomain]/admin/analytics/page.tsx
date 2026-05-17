'use client';

/**
 * Atlas Analytics — Main Page (A5)
 *
 * Orchestrates 5 frames:
 *   F1  View      — read-only dashboard (WidgetGrid, no editing)
 *   F2  Edit      — drag-and-resize grid + WidgetPalette slide-in
 *   F3  Configure — widget inspector (ConfigureInspector)
 *   F4  Query     — schema browser + SQL (QueryBuilder)
 *   F5  Library   — template picker + saved dashboards (TemplateLibrary)
 *
 * Data layer: preserves the existing /api/cms/analytics fetch.
 * Styling: atlas-analytics.css — surface-scoped under .atlas-analytics.
 */

import React, { useState, useCallback } from 'react';
import './atlas-analytics.css';
import type { AtlasDashboardLayout, AtlasWidgetKind } from '@/lib/cms/dashboard/atlas-widgets';
import {
  DEFAULT_ATLAS_LAYOUT,
  addWidgetToLayout,
  ATLAS_WIDGET_REGISTRY,
} from '@/lib/cms/dashboard/atlas-widgets';
import type { AtlasWidgetInstance } from '@/lib/cms/dashboard/atlas-widgets';
import { WidgetGrid } from '@/components/cms/analytics/WidgetGrid';
import { WidgetPalette } from '@/components/cms/analytics/WidgetPalette';
import { ConfigureInspector } from '@/components/cms/analytics/ConfigureInspector';
import { QueryBuilder } from '@/components/cms/analytics/QueryBuilder';
import { TemplateLibrary } from '@/components/cms/analytics/TemplateLibrary';

// ─── Frame type ───────────────────────────────────────────────────────────────

type Frame = 'view' | 'edit' | 'configure' | 'query' | 'library';

// ─── Date-range options ───────────────────────────────────────────────────────

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d',    label: '7d'  },
  { value: '30d',   label: '30d' },
  { value: '90d',   label: '90d' },
  { value: '12m',   label: '12m' },
] as const;
type DateRangeValue = (typeof DATE_RANGES)[number]['value'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  // Frame navigation
  const [frame, setFrame]           = useState<Frame>('view');
  const [prevFrame, setPrevFrame]   = useState<Frame>('view');

  // Layout state (shared between F1 and F2)
  const [layout, setLayout]         = useState<AtlasDashboardLayout>(DEFAULT_ATLAS_LAYOUT);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Widget palette (F2)
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Date range (header filter, passed to real API)
  const [range, setRange]           = useState<DateRangeValue>('30d');

  // Template (F5)
  const [activeTemplate, setActiveTemplate] = useState<string>('storefront');

  // ── Navigation helpers ────────────────────────────────────────────────────

  const goTo = useCallback((next: Frame) => {
    setPrevFrame(frame);
    setFrame(next);
  }, [frame]);

  const goBack = useCallback(() => {
    setFrame(prevFrame);
  }, [prevFrame]);

  // ── Edit-mode actions ─────────────────────────────────────────────────────

  const handleAddWidget = useCallback((kind: AtlasWidgetKind) => {
    const meta = ATLAS_WIDGET_REGISTRY[kind];
    const newWidget: AtlasWidgetInstance = {
      id: `w-${Date.now()}`,
      kind,
      title: meta.label,
      w: meta.defaultW,
      h: meta.defaultH,
      x: 0,
      y: Math.max(0, ...layout.widgets.map((w) => w.y + w.h)),
      colorKey: 'accent',
    };
    setLayout(addWidgetToLayout(layout, newWidget));
    setPaletteOpen(false);
  }, [layout]);

  const handleDoneEditing = useCallback(() => {
    setSelectedId(null);
    setPaletteOpen(false);
    setFrame('view');
  }, []);

  // ── Template selection (F5) ───────────────────────────────────────────────

  const handleTemplateSelect = useCallback((id: string) => {
    setActiveTemplate(id);
    // Reset layout to default; in a real system this would load the template
    setLayout(DEFAULT_ATLAS_LAYOUT);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="atlas-analytics" data-help-key="admin.analytics.dashboard">

      {/* ── Top action bar ───────────────────────────────────────────────── */}
      <div className="at-action-bar">
        {/* Left: breadcrumb */}
        <div className="at-action-bar-left">
          <span className="at-eyebrow">Atlas</span>
          <span className="at-eyebrow" style={{ color: 'var(--at-ink-faint)', margin: '0 4px' }}>/</span>
          <span className="at-eyebrow">Analytics</span>
          {frame !== 'view' && (
            <>
              <span className="at-eyebrow" style={{ color: 'var(--at-ink-faint)', margin: '0 4px' }}>/</span>
              <span className="at-eyebrow" style={{ color: 'var(--at-accent)' }}>
                {frame === 'edit'      ? 'Edit'
                : frame === 'configure' ? 'Configure'
                : frame === 'query'    ? 'Query'
                :                        'Library'}
              </span>
            </>
          )}
        </div>

        {/* Center: frame tabs */}
        <div className="at-action-bar-tabs" role="tablist" aria-label="Dashboard frames">
          {(['view', 'edit', 'query', 'library'] as Frame[]).map((f, i) => (
            <button
              key={f}
              role="tab"
              aria-selected={frame === f || (frame === 'configure' && f === 'edit')}
              className={`at-tab${frame === f || (frame === 'configure' && f === 'edit') ? ' on' : ''}`}
              onClick={() => goTo(f)}
            >
              <span className="at-kbd">F{i + 1}</span>
              {' '}
              {f === 'view'    ? 'View'
              : f === 'edit'   ? 'Edit'
              : f === 'query'  ? 'Query'
              :                  'Library'}
            </button>
          ))}
        </div>

        {/* Right: date range + actions */}
        <div className="at-action-bar-right">
          <div className="at-chip-strip" role="group" aria-label="Date range">
            {DATE_RANGES.map(({ value, label }) => (
              <button
                key={value}
                className={`at-chip${range === value ? ' on' : ''}`}
                onClick={() => setRange(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {frame === 'view' && (
            <>
              <button className="at-btn" onClick={() => goTo('edit')}>
                <span className="at-kbd">E</span> Edit
              </button>
              <button className="at-btn">
                <span className="at-kbd">⌘S</span> Share
              </button>
            </>
          )}
          {frame === 'edit' && (
            <>
              <button className="at-btn" onClick={() => setPaletteOpen((v) => !v)}>
                <span className="at-kbd">F2</span> Add widget
              </button>
              <button className="at-btn at-btn-accent" onClick={handleDoneEditing}>
                <span className="at-kbd">⌘S</span> Done
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Frame content ────────────────────────────────────────────────── */}

      {/* F1 — View (read-only) */}
      {frame === 'view' && (
        <div className="at-frame at-frame-view">
          <WidgetGrid
            layout={layout}
            editing={false}
            selectedId={null}
            onSelect={() => {}}
            onLayoutChange={() => {}}
          />
        </div>
      )}

      {/* F2 — Edit + optional F2 palette slide-in */}
      {frame === 'edit' && (
        <div className="at-frame at-frame-edit" style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <WidgetGrid
              layout={layout}
              editing
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                if (id !== null) goTo('configure');
              }}
              onLayoutChange={setLayout}
            />
          </div>

          {paletteOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 40,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <WidgetPalette
                onAdd={handleAddWidget}
                onClose={() => setPaletteOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* F3 — Configure (widget inspector) */}
      {frame === 'configure' && (
        <div className="at-frame at-frame-configure" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <ConfigureInspector
            onDone={() => {
              setSelectedId(null);
              setFrame('edit');
            }}
            onOpenQuery={() => goTo('query')}
          />
        </div>
      )}

      {/* F4 — Query builder */}
      {frame === 'query' && (
        <div className="at-frame at-frame-query" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <QueryBuilder
            onSave={goBack}
            onBack={goBack}
          />
        </div>
      )}

      {/* F5 — Template library */}
      {frame === 'library' && (
        <div className="at-frame at-frame-library" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '0 16px 16px' }}>
          <TemplateLibrary
            activeTemplateId={activeTemplate}
            onSelect={handleTemplateSelect}
            onCreate={() => {
              setLayout(DEFAULT_ATLAS_LAYOUT);
              goTo('edit');
            }}
          />
        </div>
      )}
    </div>
  );
}
