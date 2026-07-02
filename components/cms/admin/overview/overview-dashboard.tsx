'use client';

/**
 * Grainy Overview — a customizable widget dashboard (the admin home screen).
 *
 * Customize mode: drag to reorder · resize S/M/L/XL · remove · add from library.
 * Layout persists per browser in localStorage ('grainy-dash-v1'). Every widget
 * renders from real tenant data passed in via `data`.
 */

import { useEffect, useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { Plus, X, GripVertical, Check, SlidersHorizontal, LayoutGrid } from 'lucide-react';
import {
  type OverviewData, type NavHandlers, type WidgetId, type WidgetSize, type WidgetSlot,
  SIZE_LABEL, SIZE_ORDER, DEFAULT_LAYOUT, loadLayout, saveLayout,
} from './overview-types';
import { WIDGETS, WIDGET_IDS } from './overview-widgets';
import { WidgetLibraryModal } from './widget-library-modal';

export function OverviewDashboard({
  data,
  nav,
  loading = false,
  storeLabel,
}: {
  data: OverviewData;
  nav: NavHandlers;
  loading?: boolean;
  storeLabel?: string;
}) {
  // Start from the default so server and first client render agree; hydrate the
  // persisted layout once mounted (localStorage is client-only).
  const [layout, setLayout] = useState<readonly WidgetSlot[]>(DEFAULT_LAYOUT);
  const [edit, setEdit] = useState(false);
  const [adding, setAdding] = useState(false);
  const [dragK, setDragK] = useState<WidgetId | null>(null);
  const [overK, setOverK] = useState<WidgetId | null>(null);

  useEffect(() => { setLayout(loadLayout(WIDGET_IDS)); }, []);

  const update = (next: readonly WidgetSlot[]) => { setLayout(next); saveLayout(next); };
  const setSize = (k: WidgetId, s: WidgetSize) => update(layout.map((w) => (w.k === k ? { ...w, s } : w)));
  const remove = (k: WidgetId) => update(layout.filter((w) => w.k !== k));
  const add = (k: WidgetId) => { update([...layout, { k, s: WIDGETS[k].defSize }]); toast.success(`${WIDGETS[k].title} added`); };
  const reset = () => { update(DEFAULT_LAYOUT); toast.success('Dashboard reset to the default layout'); };
  const reorder = (from: WidgetId, to: WidgetId) => {
    if (from === to) return;
    const next = [...layout];
    const i = next.findIndex((w) => w.k === from);
    if (i < 0) return;
    const [moved] = next.splice(i, 1);
    const j = next.findIndex((w) => w.k === to);
    next.splice(j < 0 ? next.length : j, 0, moved);
    update(next);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const usedIds = layout.map((w) => w.k);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* ── Header ── */}
      <div style={{ padding: '18px 26px 0', flex: 'none' }} data-tour-id="admin-dashboard-heading">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div className="gr-eyebrow">{storeLabel ? `${storeLabel} · ${today}` : today}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
              <h2 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.015em' }}>Overview</h2>
              {!edit && <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{layout.length} widgets</span>}
              {edit && <span style={{ fontSize: 12.5, color: 'var(--clay-ink)' }}>Drag to reorder · resize · remove — changes save automatically.</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {edit && (
              <button className="btn btn-secondary" onClick={() => setAdding(true)} style={btnRow}>
                <Plus size={15} aria-hidden="true" /> Add widget
              </button>
            )}
            {edit && <button className="btn btn-secondary" onClick={reset}>Reset layout</button>}
            {edit ? (
              <button className="btn btn-primary" onClick={() => setEdit(false)} style={btnRow}>
                <Check size={15} aria-hidden="true" /> Done
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => setEdit(true)} style={btnRow} data-tour-id="dashboard-customize">
                <SlidersHorizontal size={15} aria-hidden="true" /> Customize
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="gr-scroll" style={{ flex: 1, minHeight: 0, padding: '18px 26px 26px' }} data-tour-id="dashboard-widgets">
        {loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '4px 0 14px' }} className="gr-eyebrow">Loading your numbers…</div>
        )}

        {layout.length === 0 && !edit ? (
          <div style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-sunken)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 12 }}>
                <LayoutGrid size={22} aria-hidden="true" />
              </div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>An empty dashboard</div>
              <p style={{ margin: '5px 0 12px', color: 'var(--text-muted)', fontSize: 13 }}>Add the widgets that matter to you.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setEdit(true)} style={btnRow}>
                <SlidersHorizontal size={14} aria-hidden="true" /> Customize
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, alignItems: 'start' }}>
            {layout.map((w) => {
              const d = WIDGETS[w.k];
              const Icon = d.icon;
              const isOver = edit && overK === w.k && dragK !== null && dragK !== w.k;
              const metaText = !edit && d.meta ? d.meta(data) : null;
              return (
                <div
                  key={w.k}
                  className="gr-card"
                  draggable={edit}
                  onDragStart={() => setDragK(w.k)}
                  onDragEnd={() => { setDragK(null); setOverK(null); }}
                  onDragOver={(e) => { if (edit) { e.preventDefault(); setOverK(w.k); } }}
                  onDrop={() => { if (dragK) reorder(dragK, w.k); setDragK(null); setOverK(null); }}
                  style={{
                    gridColumn: `span ${w.s}`, padding: '14px 16px',
                    opacity: dragK === w.k ? 0.45 : 1,
                    cursor: edit ? 'grab' : 'default',
                    transition: 'box-shadow .14s, border-color .14s',
                    borderColor: isOver ? 'var(--primary)' : edit ? 'var(--line-strong)' : 'var(--line)',
                    borderStyle: edit ? 'dashed' : 'solid',
                  }}
                >
                  {/* widget header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {edit && <GripVertical size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />}
                    <Icon size={15} style={{ color: 'var(--clay-600)' }} aria-hidden="true" />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{d.title}</span>
                    {metaText && <span className="gr-num" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{metaText}</span>}
                    {edit && (
                      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-flex', gap: 2, background: 'var(--surface-sunken)', borderRadius: 7, padding: 2 }}>
                          {SIZE_ORDER.map((s) => (
                            <button
                              key={s}
                              onClick={() => setSize(w.k, s)}
                              title={`Width ${SIZE_LABEL[s]}`}
                              style={{
                                border: 'none', cursor: 'pointer', borderRadius: 5, padding: '2px 7px',
                                fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
                                background: w.s === s ? 'var(--surface-raised)' : 'transparent',
                                color: w.s === s ? 'var(--text)' : 'var(--text-muted)',
                                boxShadow: w.s === s ? 'var(--shadow-xs)' : 'none',
                              }}
                            >
                              {SIZE_LABEL[s]}
                            </button>
                          ))}
                        </span>
                        <button onClick={() => remove(w.k)} title="Remove widget" aria-label={`Remove ${d.title}`}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', padding: 3 }}>
                          <X size={14} aria-hidden="true" />
                        </button>
                      </span>
                    )}
                  </div>
                  {d.render(data, nav)}
                </div>
              );
            })}

            {edit && (
              <div
                onClick={() => setAdding(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAdding(true); } }}
                style={{
                  gridColumn: 'span 2', minHeight: 150, borderRadius: 'var(--r-lg)',
                  border: '1.5px dashed var(--line-strong)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                <Plus size={20} aria-hidden="true" /><span style={{ fontSize: 13 }}>Add widget</span>
              </div>
            )}
          </div>
        )}
      </div>

      {adding && <WidgetLibraryModal used={usedIds} onAdd={add} onClose={() => setAdding(false)} />}
    </div>
  );
}

const btnRow: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6 };
