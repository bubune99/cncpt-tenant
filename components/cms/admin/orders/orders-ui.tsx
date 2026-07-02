'use client';

/**
 * Grainy primitives, ported to TSX for the orders screens.
 *
 * These mirror the design-reference shell primitives (Badge / Btn / Segment /
 * Avatar / RowMenu / LiveSearch / Eyebrow) but render the grainy.css classes
 * directly and use lucide-react for iconography. Kept dependency-free so the
 * list, cards, kanban, and detail screens share one visual vocabulary.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Search, X, MoreHorizontal, type LucideIcon } from 'lucide-react';
import type { BadgeTone } from './orders-model';

// ── Eyebrow ─────────────────────────────────────────────────────────────────

export function Eyebrow({
  children,
  style,
}: {
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <span className="gr-eyebrow" style={style}>
      {children}
    </span>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export function Badge({
  tone = 'neutral',
  children,
  style,
}: {
  readonly tone?: BadgeTone;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <span className={`badge badge-${tone}`} style={style}>
      {children}
    </span>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────────

type BtnKind = 'primary' | 'secondary' | 'ghost';

export function Btn({
  kind = 'secondary',
  icon: Icon,
  size,
  children,
  disabled,
  title,
  onClick,
  style,
}: {
  readonly kind?: BtnKind;
  readonly icon?: LucideIcon;
  readonly size?: 'sm';
  readonly children?: React.ReactNode;
  readonly disabled?: boolean;
  readonly title?: string;
  readonly onClick?: () => void;
  readonly style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <button
      type="button"
      className={`btn btn-${kind}${size === 'sm' ? ' btn-sm' : ''}`}
      disabled={disabled}
      title={title}
      onClick={onClick}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 15} />}
      {children}
    </button>
  );
}

// ── Segment (view / filter toggle) ──────────────────────────────────────────────

export interface SegmentOption<T extends string> {
  readonly value: T;
  readonly label: React.ReactNode;
  readonly icon?: LucideIcon;
}

export function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  readonly options: readonly SegmentOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}): React.ReactElement {
  return (
    <div className="segment">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={opt.value === value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {opt.icon && <opt.icon size={14} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

export function Avatar({
  initials,
  color,
  size = 30,
}: {
  readonly initials: string;
  readonly color: string;
  readonly size?: number;
}): React.ReactElement {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: color,
        color: '#fff',
        fontFamily: 'var(--font-mono)',
        fontSize: size * 0.4,
        fontWeight: 600,
        letterSpacing: '0.02em',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.18)',
      }}
    >
      {initials}
    </span>
  );
}

// ── LiveSearch ───────────────────────────────────────────────────────────────

export function LiveSearch({
  value,
  onChange,
  placeholder = 'Search…',
  width = 210,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly width?: number;
}): React.ReactElement {
  return (
    <div className="search" style={{ width }}>
      <Search size={15} />
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <X
          size={14}
          style={{ cursor: 'pointer', flex: 'none' }}
          onClick={() => onChange('')}
        />
      )}
    </div>
  );
}

// ── RowMenu (kebab dropdown) ────────────────────────────────────────────────

export interface RowMenuItem {
  readonly icon?: LucideIcon;
  readonly label: string;
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly title?: string;
  readonly onClick?: () => void;
}

export function RowMenu({ items }: { readonly items: readonly RowMenuItem[] }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="row-act"
        aria-label="Row actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          className="menu"
          style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 40 }}
        >
          {items.map((it) => (
            <div
              key={it.label}
              className="menu-item"
              title={it.title}
              onClick={(e) => {
                e.stopPropagation();
                if (it.disabled) return;
                setOpen(false);
                it.onClick?.();
              }}
              style={{
                color: it.disabled
                  ? 'var(--text-muted)'
                  : it.danger
                    ? 'var(--rust-700)'
                    : 'var(--text)',
                cursor: it.disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {it.icon && <it.icon size={15} />}
              {it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

export function StatCard({
  icon: Icon,
  value,
  label,
  note,
}: {
  readonly icon: LucideIcon;
  readonly value: React.ReactNode;
  readonly label: string;
  readonly note: string;
}): React.ReactElement {
  return (
    <div className="gr-card" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: 'var(--surface-sunken)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--clay-600)',
          flex: 'none',
        }}
      >
        <Icon size={17} />
      </span>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{value}</span>
          <span className="gr-eyebrow">{label}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{note}</div>
      </div>
    </div>
  );
}
