/**
 * Atlas Editor Primitives — shared building blocks for A2 editor surfaces.
 * Port of atlas-editors-main.jsx helpers: Crumbs, EditorTabs, Sec, SaveBar.
 * Uses only Phase-0 atlas.css classes + --wl-* tokens. No new hex values.
 */

import React from 'react';

// ── Breadcrumb ──────────────────────────────────────────────────────────────

export interface CrumbItem {
  readonly label: string;
  readonly href?: string;
}

interface CrumbsProps {
  readonly items: readonly CrumbItem[];
}

export function Crumbs({ items }: CrumbsProps): React.ReactElement {
  return (
    <div className="crumbs">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {isLast
              ? <span className="here">{item.label}</span>
              : <a href={item.href ?? '#'}>{item.label}</a>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Editor tab strip ────────────────────────────────────────────────────────

export interface EditorTabItem {
  readonly label: string;
  readonly count?: number | null;
  readonly active?: boolean;
}

interface EditorTabsProps {
  readonly items: readonly EditorTabItem[];
  readonly right?: React.ReactNode;
  readonly onTabChange?: (index: number) => void;
  readonly activeIndex?: number;
}

export function EditorTabs({
  items,
  right,
  onTabChange,
  activeIndex,
}: EditorTabsProps): React.ReactElement {
  return (
    <div className="e-tabs">
      {items.map((item, i) => {
        const isActive = activeIndex !== undefined ? i === activeIndex : item.active;
        return (
          <span
            key={item.label}
            className={'tab' + (isActive ? ' on' : '')}
            onClick={() => onTabChange?.(i)}
            style={{ cursor: onTabChange ? 'pointer' : undefined }}
          >
            {item.label}
            {item.count != null && (
              <span className="ct">{item.count}</span>
            )}
          </span>
        );
      })}
      {right && <span className="right">{right}</span>}
    </div>
  );
}

// ── Section head ────────────────────────────────────────────────────────────

interface SecProps {
  readonly n?: string;
  readonly h: string;
  readonly meta?: string;
  readonly right?: React.ReactNode;
}

export function Sec({ n, h, meta, right }: SecProps): React.ReactElement {
  return (
    <div className="sec">
      {n && <span className="n">{n}</span>}
      <span className="h">{h}</span>
      {meta && <span className="meta">· {meta}</span>}
      {right && <span className="right">{right}</span>}
    </div>
  );
}

// ── Save bar ────────────────────────────────────────────────────────────────

export interface SaveBarHint {
  readonly key: string;
  readonly label: string;
}

interface SaveBarProps {
  readonly savedAt?: string;
  readonly hints?: readonly SaveBarHint[];
  readonly actions?: React.ReactNode;
}

export function SaveBar({ savedAt, hints, actions }: SaveBarProps): React.ReactElement {
  return (
    <div className="action-bar">
      {hints?.map((h, i) => (
        <span key={i}>
          <span className="kbd">{h.key}</span>
          {h.label}
        </span>
      ))}
      <span className="right">
        <span className="savestate">{savedAt ?? '— autosaved —'}</span>
        {actions}
      </span>
    </div>
  );
}

// ── Form field (label + value row) ──────────────────────────────────────────

interface FieldRowProps {
  readonly label: string;
  readonly children: React.ReactNode;
}

export function FieldRow({ label, children }: FieldRowProps): React.ReactElement {
  return (
    <div className="field">
      <span className="lbl">{label}</span>
      <span className="val">{children}</span>
    </div>
  );
}

// ── Input row (stacked label + input) ───────────────────────────────────────

interface InputRowProps {
  readonly label: string;
  readonly children: React.ReactNode;
}

export function InputRow({ label, children }: InputRowProps): React.ReactElement {
  return (
    <div className="input-row">
      <span className="lbl">{label}</span>
      {children}
    </div>
  );
}

// ── Stat brick ──────────────────────────────────────────────────────────────

interface StatBrickProps {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly delta?: string;
  readonly valueStyle?: React.CSSProperties;
}

export function StatBrick({ label, value, delta, valueStyle }: StatBrickProps): React.ReactElement {
  return (
    <div className="brick">
      <div className="l">{label}</div>
      <div className="v" style={valueStyle}>{value}</div>
      {delta && <div className="d">{delta}</div>}
    </div>
  );
}

// ── Pill (status badge) ──────────────────────────────────────────────────────

export type PillVariant =
  | 'solid-ink'
  | 'solid-accent'
  | 'solid-gold'
  | 'solid-moss'
  | 'out'
  | 'out-accent'
  | 'soft';

interface PillProps {
  readonly variant?: PillVariant;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}

export function Pill({ variant = 'out', children, style }: PillProps): React.ReactElement {
  return (
    <span className={`pill pill-${variant}`} style={style}>
      {children}
    </span>
  );
}

// ── Timeline item ────────────────────────────────────────────────────────────

interface TimelineItemProps {
  readonly when: string;
  readonly current?: boolean;
  readonly children: React.ReactNode;
}

export function TimelineItem({ when, current, children }: TimelineItemProps): React.ReactElement {
  return (
    <div className={'tl-item' + (current ? ' now' : '')}>
      <div className="when">{when}</div>
      <div className="what">{children}</div>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  readonly initials: string;
  readonly size?: number;
  readonly bg?: string;
  readonly fontSize?: number;
  readonly style?: React.CSSProperties;
}

export function Avatar({ initials, size = 38, bg, fontSize = 13, style }: AvatarProps): React.ReactElement {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: bg ?? 'var(--ink)',
        fontSize,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </span>
  );
}
