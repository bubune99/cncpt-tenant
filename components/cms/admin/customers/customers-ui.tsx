'use client';

/**
 * Customer-screen filter primitives — the dropdown pills the Grainy customers
 * design references (FilterSelect / SortSelect). They render the grainy.css
 * `.filter-chip` trigger + `.menu` dropdown so they match the orders screen's
 * visual vocabulary while staying dependency-free.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ArrowUpDown, Check } from 'lucide-react';

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, close]);
  return ref;
}

// ── FilterSelect ────────────────────────────────────────────────────────────
// A labelled filter pill: shows "label · value", highlights when narrowed.

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  anyLabel = 'Any',
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly string[];
  readonly onChange: (value: string) => void;
  readonly anyLabel?: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const active = value !== anyLabel;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className={`filter-chip${active ? ' active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="fc-key">{label}</span>
        <span className="fc-val">{value}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 40, minWidth: 160 }} role="listbox">
          {options.map((opt) => (
            <div
              key={opt}
              className="menu-item"
              role="option"
              aria-selected={opt === value}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{ justifyContent: 'space-between', color: 'var(--text)' }}
            >
              <span>{opt}</span>
              {opt === value && <Check size={14} style={{ color: 'var(--clay-600)' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SortSelect ──────────────────────────────────────────────────────────────

export function SortSelect({
  value,
  options,
  onChange,
}: {
  readonly value: string;
  readonly options: readonly string[];
  readonly onChange: (value: string) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="filter-chip"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <ArrowUpDown size={13} />
        <span className="fc-key">sort</span>
        <span className="fc-val">{value}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 40, minWidth: 160 }} role="listbox">
          {options.map((opt) => (
            <div
              key={opt}
              className="menu-item"
              role="option"
              aria-selected={opt === value}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{ justifyContent: 'space-between', color: 'var(--text)' }}
            >
              <span>{opt}</span>
              {opt === value && <Check size={14} style={{ color: 'var(--clay-600)' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SegTabs (segment pill tabs, dark active state) ──────────────────────────

export interface SegTab<T extends string> {
  readonly key: T;
  readonly label: string;
  readonly count: number;
}

export function SegTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  readonly tabs: readonly SegTab<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              border: '1px solid ' + (on ? 'transparent' : 'var(--line)'),
              background: on ? 'var(--ink-900, var(--text))' : 'var(--surface-raised)',
              color: on ? 'var(--surface-raised)' : 'var(--text-secondary)',
              borderRadius: 999, padding: '6px 13px', cursor: 'pointer',
              fontSize: 13, fontWeight: on ? 600 : 500,
              boxShadow: on ? 'var(--shadow-sm)' : 'var(--shadow-xs)', transition: 'all .14s',
            }}
          >
            {t.label}
            <span
              className="gr-num"
              style={{ fontSize: 11, color: on ? 'color-mix(in srgb, var(--surface-raised) 70%, transparent)' : 'var(--text-muted)' }}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
