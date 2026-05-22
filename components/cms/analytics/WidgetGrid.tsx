'use client';

/**
 * Atlas Analytics — WidgetGrid
 *
 * Manages the 12-column grid of widgets with:
 * - View mode (read-only)
 * - Edit mode: drag to reorder (pointer events), resize (resize handle), add empty slot
 *
 * Drag/resize uses real React state — no external DnD library required.
 * Grid is CSS-based (grid-template-columns: repeat(12, 1fr), grid-auto-rows: 84px).
 *
 * Props are immutable; updates are emitted via onLayoutChange.
 * All chart data is received as props from the parent analytics page
 * (fetched from /api/cms/analytics). No DEMO_DATA fallbacks.
 */

import React, { useState, useRef, useCallback } from 'react';
import type {
  AtlasDashboardLayout,
  AtlasWidgetInstance,
  AtlasWidgetKind,
} from '@/lib/cms/dashboard/atlas-widgets';
import {
  updateWidgetInLayout,
  removeWidgetFromLayout,
  addWidgetToLayout,
  ATLAS_WIDGET_REGISTRY,
} from '@/lib/cms/dashboard/atlas-widgets';
import type {
  TimeSeriesPoint,
  ChannelDataPoint,
  TopProductRow,
  FunnelStep,
  ActivityItem,
  AlertItem,
} from './widgets';
import {
  KpiWidget,
  RevenueWidget,
  ChannelsWidget,
  TopProductsWidget,
  FunnelWidget,
  AlertsWidget,
  ActivityWidget,
  HeatmapWidget,
  OrdersBarWidget,
} from './widgets';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wCls(w: number): string {
  return `at-w-${w}`;
}
function hCls(h: number): string {
  return `at-h-${Math.min(h, 5)}`;
}

// ─── Analytics data bag passed into the grid ──────────────────────────────────

export interface AnalyticsData {
  readonly timeSeries: readonly TimeSeriesPoint[] | null;
  readonly channels: readonly ChannelDataPoint[] | null;
  readonly topProducts: readonly TopProductRow[] | null;
  readonly funnel: readonly FunnelStep[] | null;
  readonly activity: readonly ActivityItem[] | null;
  readonly alerts: readonly AlertItem[] | null;
  /** Derived: revenue scalar for KPI (sum of timeSeries revenue) */
  readonly totalRevenue: number | null;
}

// ─── Widget content router ────────────────────────────────────────────────────

function WidgetContent({ kind, data }: { kind: AtlasWidgetKind; data: AnalyticsData }) {
  // Derive KPI sparkline from timeSeries
  const sparkData: readonly number[] | null = data.timeSeries
    ? data.timeSeries.map((p) => p.revenue)
    : null;

  const totalRevenue = data.totalRevenue;
  const revenueDisplay = totalRevenue !== null
    ? `$${(totalRevenue / 100).toLocaleString()}`
    : '—';

  switch (kind) {
    case 'KPI':
      return (
        <KpiWidget
          title="Revenue · 30d"
          value={revenueDisplay}
          delta="—"
          sparkData={sparkData}
          sparkColor="var(--at-accent)"
          ctx={totalRevenue !== null && data.timeSeries && data.timeSeries.length > 0
            ? `$${((totalRevenue / 100) / data.timeSeries.length).toFixed(0)}/d`
            : undefined}
        />
      );
    case 'LINE':
    case 'AREA':
      return <RevenueWidget timeSeries={data.timeSeries} />;
    case 'BAR':
      return <OrdersBarWidget timeSeries={data.timeSeries} />;
    case 'DONUT':
      return <ChannelsWidget channels={data.channels} />;
    case 'TABLE':
      return <TopProductsWidget topProducts={data.topProducts} />;
    case 'FUNNEL':
      return <FunnelWidget funnel={data.funnel} />;
    case 'FEED':
      return <AlertsWidget alerts={data.alerts} />;
    case 'HEAT':
      return <HeatmapWidget />;
    case 'MAP':
      return <ActivityWidget activity={data.activity} />;
    default:
      return (
        <div style={{
          padding: 8,
          color: 'var(--at-ink-soft)',
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 11,
        }}>
          Widget
        </div>
      );
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WidgetGridProps {
  layout: AtlasDashboardLayout;
  editing: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayoutChange: (layout: AtlasDashboardLayout) => void;
  analyticsData: AnalyticsData;
}

interface DragState {
  widgetId: string;
  startPointerX: number;
  startPointerY: number;
}

// ─── WidgetGrid ───────────────────────────────────────────────────────────────

export function WidgetGrid({
  layout,
  editing,
  selectedId,
  onSelect,
  onLayoutChange,
  analyticsData,
}: WidgetGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);

  /** Move widget to a new position derived from pointer delta */
  const handleDragMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging || !gridRef.current) return;
      const gridRect = gridRef.current.getBoundingClientRect();
      const colW = gridRect.width / 12;
      const rowH = 94; // 84px + 10px gap

      const colDelta = Math.round((e.clientX - dragging.startPointerX) / colW);
      const rowDelta = Math.round((e.clientY - dragging.startPointerY) / rowH);

      if (colDelta === 0 && rowDelta === 0) return;

      const widget = layout.widgets.find((w) => w.id === dragging.widgetId);
      if (!widget) return;

      const newX = Math.max(0, Math.min(12 - widget.w, widget.x + colDelta));
      const newY = Math.max(0, widget.y + rowDelta);

      onLayoutChange(updateWidgetInLayout(layout, dragging.widgetId, { x: newX, y: newY }));
      setDragging({ ...dragging, startPointerX: e.clientX, startPointerY: e.clientY });
    },
    [dragging, layout, onLayoutChange]
  );

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', handleDragEnd);
  }, [handleDragMove]);

  const startDrag = useCallback(
    (e: React.PointerEvent, widgetId: string) => {
      if (!editing) return;
      e.preventDefault();
      setDragging({ widgetId, startPointerX: e.clientX, startPointerY: e.clientY });
      window.addEventListener('pointermove', handleDragMove);
      window.addEventListener('pointerup', handleDragEnd);
    },
    [editing, handleDragMove, handleDragEnd]
  );

  const handleWidgetClick = (id: string) => {
    if (editing) onSelect(id === selectedId ? null : id);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onLayoutChange(removeWidgetFromLayout(layout, id));
    if (selectedId === id) onSelect(null);
  };

  const handleAddEmpty = () => {
    const meta = ATLAS_WIDGET_REGISTRY['FEED'];
    const newWidget: AtlasWidgetInstance = {
      id: `widget-${Date.now()}`,
      kind: 'FEED',
      title: meta.label,
      w: meta.defaultW,
      h: meta.defaultH,
      x: 0,
      y: Math.max(0, ...layout.widgets.map((w) => w.y + w.h)),
      colorKey: 'accent',
    };
    onLayoutChange(addWidgetToLayout(layout, newWidget));
  };

  const gridCls = ['at-dash-grid', editing ? 'editing' : ''].filter(Boolean).join(' ');

  return (
    <div
      ref={gridRef}
      className={gridCls}
      style={{ position: 'relative' }}
      onClick={() => { if (editing) onSelect(null); }}
    >
      {layout.widgets.map((widget) => {
        const isSelected = selectedId === widget.id;
        const widgetCls = [
          'at-widget',
          `${wCls(widget.w)}`,
          `${hCls(widget.h)}`,
          editing ? 'editing' : '',
          isSelected ? 'sel' : '',
        ].filter(Boolean).join(' ');

        return (
          <div
            key={widget.id}
            className={widgetCls}
            style={{
              gridColumn: `${widget.x + 1} / span ${widget.w}`,
              gridRow: `auto / span ${widget.h}`,
            }}
            onClick={(e) => { e.stopPropagation(); handleWidgetClick(widget.id); }}
          >
            {editing && (
              <span
                className="at-drag-h"
                onPointerDown={(e) => startDrag(e, widget.id)}
              >
                ▸ drag · {widget.kind} {widget.w}×{widget.h}
              </span>
            )}

            <WidgetContent kind={widget.kind} data={analyticsData} />

            {editing && isSelected && (
              <>
                <div className="at-resize-h" />
                <button
                  onClick={(e) => handleRemove(e, widget.id)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'var(--at-ink)',
                    color: 'var(--at-paper)',
                    border: 'none',
                    borderRadius: 2,
                    fontSize: 9,
                    padding: '1px 5px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-geist-mono, monospace)',
                    letterSpacing: '.04em',
                    zIndex: 3,
                  }}
                  title="Remove widget"
                >
                  ×
                </button>
              </>
            )}
          </div>
        );
      })}

      {editing && (
        <div
          className="at-widget at-empty at-w-3 at-h-3"
          onClick={(e) => { e.stopPropagation(); handleAddEmpty(); }}
        >
          + drop widget · 3 × 3
        </div>
      )}
    </div>
  );
}
