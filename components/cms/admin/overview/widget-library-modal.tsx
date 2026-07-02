'use client';

/**
 * Grainy Overview — "Add a widget" library modal.
 *
 * A self-contained overlay styled after design-reference/cms-ui/grainy-modals.jsx
 * (scrim rgba(26,22,15,.5); a surface-raised sheet). Lists only widgets that are
 * implementable AND not already on the dashboard — so the library can never
 * offer something with no backing data.
 */

import { useEffect } from 'react';
import { Plus, X, LayoutGrid } from 'lucide-react';
import { WIDGETS, WIDGET_IDS } from './overview-widgets';
import type { WidgetId } from './overview-types';

export function WidgetLibraryModal({
  used,
  onAdd,
  onClose,
}: {
  used: readonly WidgetId[];
  onAdd: (k: WidgetId) => void;
  onClose: () => void;
}) {
  // Close on Escape — matches the click-scrim affordance.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const available = WIDGET_IDS.filter((k) => !used.includes(k));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,22,15,0.5)', zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a widget"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', background: 'var(--surface-raised)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-xl, 18px)', boxShadow: 'var(--shadow-lg), var(--sheen-clay)',
        }}
      >
        {/* Head */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 14px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--primary) 16%, var(--surface))', color: 'var(--primary)' }}>
            <LayoutGrid size={19} aria-hidden="true" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>Add a widget</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Pick what this dashboard should show</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', flex: 'none', display: 'inline-flex', padding: 4 }}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', overflow: 'auto' }}>
          {available.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
              Every available widget is already on the dashboard.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {available.map((k) => {
              const d = WIDGETS[k];
              const Icon = d.icon;
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, flex: 'none', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clay-600)' }}>
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{d.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{d.blurb}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onAdd(k)} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} aria-hidden="true" /> Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Foot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--line)' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>Done</button>
        </div>
      </div>
    </div>
  );
}
