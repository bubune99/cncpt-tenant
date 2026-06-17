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
 * Data layer:
 *   - Fetches /api/cms/analytics?range=<range> on mount and on range change.
 *   - Wires salesByChannel → ChannelsWidget, topProducts → TopProductsWidget.
 *   - timeSeries (date,revenue,orders) is read when present; absent → empty state.
 *   - No DEMO_DATA fallbacks — show real data or Atlas empty states.
 *
 * Layout persistence:
 *   - Interim (until G02 AnalyticsDashboard model lands): stored in localStorage
 *     keyed as `atlas-dashboard-layout-{subdomain}`.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import './atlas-analytics.css';
import type { AtlasDashboardLayout, AtlasWidgetKind } from '@/lib/cms/dashboard/atlas-widgets';
import {
  DEFAULT_ATLAS_LAYOUT,
  addWidgetToLayout,
  ATLAS_WIDGET_REGISTRY,
} from '@/lib/cms/dashboard/atlas-widgets';
import type { AtlasWidgetInstance } from '@/lib/cms/dashboard/atlas-widgets';
import type { AnalyticsData } from '@/components/cms/analytics/WidgetGrid';
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

// ─── API response shape (only what we read) ──────────────────────────────────

interface AnalyticsApiResponse {
  readonly range: string;
  // Scalar fields (always present)
  readonly overview?: {
    readonly revenue?: number;
    readonly orders?: number;
  };
  readonly revenue?: number;
  readonly pageViews?: number;
  readonly uniqueVisitors?: number;
  readonly purchases?: number;
  // Real-data fields wired now
  readonly salesByChannel?: ReadonlyArray<{
    readonly name: string;
    readonly value: number;
    readonly color?: string;
    readonly pct?: number;
  }>;
  readonly topProducts?: ReadonlyArray<{
    readonly name: string;
    readonly sku?: string;
    readonly units: number;
    readonly rev: number;
    readonly pct?: number;
  }>;
  // Added by agent A9 when ready
  readonly timeSeries?: ReadonlyArray<{
    readonly date: string;
    readonly revenue: number;
    readonly orders: number;
  }>;
}

// ─── Channel palette (used when the API doesn't return colors) ───────────────

const CHANNEL_COLORS = [
  '#1a1410', '#8b2c1f', '#b58730', '#4f5e3a', '#2a4a73',
  '#6b4f8a', '#2d6a6a', '#8a4f2d',
];

// ─── Build AnalyticsData from API response ───────────────────────────────────

function buildAnalyticsData(apiData: AnalyticsApiResponse | null): AnalyticsData {
  if (!apiData) {
    return {
      timeSeries: null,
      channels: null,
      topProducts: null,
      funnel: null,
      activity: null,
      alerts: null,
      totalRevenue: null,
    };
  }

  // timeSeries: use if present (agent A9 adds this)
  const timeSeries = apiData.timeSeries && apiData.timeSeries.length > 0
    ? apiData.timeSeries
    : null;

  const totalRevenue = timeSeries
    ? timeSeries.reduce((s, p) => s + p.revenue, 0)
    : (apiData.overview?.revenue ?? apiData.revenue ?? null);

  // salesByChannel: wire to ChannelsWidget if present
  const channels = apiData.salesByChannel && apiData.salesByChannel.length > 0
    ? apiData.salesByChannel.map((c, i) => ({
        name: c.name,
        value: c.value,
        color: c.color ?? CHANNEL_COLORS[i % CHANNEL_COLORS.length],
        pct: c.pct ?? 0,
      }))
    : null;

  // topProducts: wire to TopProductsWidget if present
  const topProducts = apiData.topProducts && apiData.topProducts.length > 0
    ? (() => {
        const maxRev = Math.max(...apiData.topProducts!.map((p) => p.rev), 1);
        return apiData.topProducts!.map((p) => ({
          name: p.name,
          sku: p.sku ?? '—',
          units: p.units,
          rev: p.rev,
          pct: Math.round((p.rev / maxRev) * 100),
        }));
      })()
    : null;

  // funnel, activity, alerts: not yet in endpoint — show empty state
  // (NW-08, NW-09 track adding these)
  return {
    timeSeries,
    channels,
    topProducts,
    funnel: null,
    activity: null,
    alerts: null,
    totalRevenue,
  };
}

// ─── localStorage layout helpers ─────────────────────────────────────────────

function storageKey(subdomain: string): string {
  return `atlas-dashboard-layout-${subdomain}`;
}

function loadLayoutFromStorage(subdomain: string): AtlasDashboardLayout {
  try {
    const raw = localStorage.getItem(storageKey(subdomain));
    if (!raw) return DEFAULT_ATLAS_LAYOUT;
    const parsed = JSON.parse(raw) as unknown;
    // Basic shape validation — must have widgets array
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'widgets' in parsed &&
      Array.isArray((parsed as { widgets: unknown }).widgets)
    ) {
      return parsed as AtlasDashboardLayout;
    }
  } catch {
    // parse error — fall back to default
  }
  return DEFAULT_ATLAS_LAYOUT;
}

function saveLayoutToStorage(subdomain: string, layout: AtlasDashboardLayout): void {
  try {
    localStorage.setItem(storageKey(subdomain), JSON.stringify(layout));
  } catch {
    // localStorage unavailable (SSR guard / quota exceeded) — ignore
  }
}

// ─── Fetch state ──────────────────────────────────────────────────────────────

type FetchStatus = 'idle' | 'loading' | 'ok' | 'error';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { subdomain } = useParams<{ subdomain: string }>();

  // ── Layout state (shared between F1 and F2) ───────────────────────────────
  // Populated from localStorage on mount; saved on every change.
  const layoutInitialized = useRef(false);
  const [layout, setLayout] = useState<AtlasDashboardLayout>(DEFAULT_ATLAS_LAYOUT);

  // Load layout from localStorage after mount (client-only)
  useEffect(() => {
    if (layoutInitialized.current || !subdomain) return;
    layoutInitialized.current = true;
    const stored = loadLayoutFromStorage(subdomain);
    setLayout(stored);
  }, [subdomain]);

  // Save layout whenever it changes (after initialization)
  const handleLayoutChange = useCallback((next: AtlasDashboardLayout) => {
    setLayout(next);
    if (subdomain && layoutInitialized.current) {
      saveLayoutToStorage(subdomain, next);
    }
  }, [subdomain]);

  // ── Analytics data fetch ──────────────────────────────────────────────────
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
  const [apiData, setApiData] = useState<AnalyticsApiResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Frame navigation
  const [frame, setFrame]           = useState<Frame>('view');
  const [prevFrame, setPrevFrame]   = useState<Frame>('view');

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Widget palette (F2)
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Date range (header filter, passed to real API)
  const [range, setRange]           = useState<DateRangeValue>('30d');

  // Template (F5)
  const [activeTemplate, setActiveTemplate] = useState<string>('storefront');

  // ── Fetch analytics on mount and on range change ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    setFetchStatus('loading');
    setFetchError(null);

    // Map UI range labels to API-supported values
    const apiRange =
      range === '12m'   ? 'year'  :
      range === 'today' ? '24h'   :
      range;

    fetch(`/api/cms/analytics?range=${apiRange}`, { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? `HTTP ${res.status}`
          );
        }
        return res.json() as Promise<AnalyticsApiResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setApiData(data);
        setFetchStatus('ok');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchError(err instanceof Error ? err.message : 'Failed to load analytics');
        setFetchStatus('error');
      });

    return () => { cancelled = true; };
  }, [range]);

  // ── Derived analytics data bag ────────────────────────────────────────────
  const analyticsData: AnalyticsData = buildAnalyticsData(
    fetchStatus === 'ok' ? apiData : null
  );

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
    handleLayoutChange(addWidgetToLayout(layout, newWidget));
    setPaletteOpen(false);
  }, [layout, handleLayoutChange]);

  const handleDoneEditing = useCallback(() => {
    setSelectedId(null);
    setPaletteOpen(false);
    setFrame('view');
  }, []);

  // ── Template selection (F5) ───────────────────────────────────────────────

  const handleTemplateSelect = useCallback((id: string) => {
    setActiveTemplate(id);
    handleLayoutChange(DEFAULT_ATLAS_LAYOUT);
  }, [handleLayoutChange]);

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
          {/* Fetch status indicator */}
          {fetchStatus === 'loading' && (
            <span className="at-eyebrow" style={{ color: 'var(--at-ink-faint)', marginLeft: 8, fontStyle: 'italic' }}>
              loading…
            </span>
          )}
          {fetchStatus === 'error' && (
            <span className="at-eyebrow" style={{ color: 'var(--at-accent)', marginLeft: 8 }} title={fetchError ?? ''}>
              ⚠ data unavailable
            </span>
          )}
        </div>

        {/* Center: frame tabs */}
        <div className="at-action-bar-tabs" role="tablist" aria-label="Dashboard frames">
          {(['view', 'edit', 'query', 'library'] as Frame[]).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={frame === f || (frame === 'configure' && f === 'edit')}
              className={`at-tab${frame === f || (frame === 'configure' && f === 'edit') ? ' on' : ''}`}
              onClick={() => goTo(f)}
            >
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
                Edit
              </button>
            </>
          )}
          {frame === 'edit' && (
            <>
              <button className="at-btn" onClick={() => setPaletteOpen((v) => !v)}>
                Add widget
              </button>
              <button className="at-btn at-btn-accent" onClick={handleDoneEditing}>
                Done
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
            analyticsData={analyticsData}
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
              onLayoutChange={handleLayoutChange}
              analyticsData={analyticsData}
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
              handleLayoutChange(DEFAULT_ATLAS_LAYOUT);
              goTo('edit');
            }}
          />
        </div>
      )}
    </div>
  );
}
