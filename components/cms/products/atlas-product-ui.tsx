"use client";
/**
 * Atlas Product Editor — shared UI helpers
 * Small, focused components reused across all 9 frames.
 */

import React from "react";
import type { AtlasFilterChip, VariantsViewMode } from "./atlas-types";

// ── Crumbs ─────────────────────────────────────────────────────────────────
interface CrumbsProps {
  readonly items: ReadonlyArray<readonly [string, string?]>;
}
export function Crumbs({ items }: CrumbsProps) {
  return (
    <div className="crumbs">
      {items.map(([label, href], i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {isLast
              ? <span className="here">{label}</span>
              : <a href={href ?? "#"}>{label}</a>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Editor tab strip ───────────────────────────────────────────────────────
export interface TabItem {
  readonly label: string;
  readonly count?: number | null;
}
interface EditorTabsProps {
  readonly items: ReadonlyArray<TabItem>;
  readonly active: string;
  readonly onChange: (label: string) => void;
  readonly right?: React.ReactNode;
}
export function EditorTabs({ items, active, onChange, right }: EditorTabsProps) {
  return (
    <div className="e-tabs">
      {items.map(({ label, count }) => (
        <button
          key={label}
          className={"tab" + (label === active ? " on" : "")}
          onClick={() => onChange(label)}
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          {label}
          {count != null && <span className="ct">{count}</span>}
        </button>
      ))}
      {right && <span className="right">{right}</span>}
    </div>
  );
}

// ── Sec helper (section heading) ───────────────────────────────────────────
interface SecProps {
  readonly n?: string;
  readonly h: string;
  readonly meta?: string;
  readonly right?: React.ReactNode;
}
export function Sec({ n, h, meta, right }: SecProps) {
  return (
    <div className="sec">
      {n && <span className="n">{n}</span>}
      <span className="h">{h}</span>
      {meta && <span className="meta">· {meta}</span>}
      {right && <span className="right">{right}</span>}
    </div>
  );
}

// ── Save bar ───────────────────────────────────────────────────────────────
interface SaveBarProps {
  readonly savedAt?: string;
  readonly hints?: ReadonlyArray<readonly [string, string]>;
  readonly isDirty?: boolean;
  readonly onSave?: () => void;
}
export function SaveBar({ savedAt, hints, isDirty, onSave }: SaveBarProps) {
  return (
    <div className="action-bar">
      {hints?.map(([k, label], i) => (
        <span key={i}><span className="kbd">{k}</span>{label}</span>
      ))}
      <span className="right">
        {isDirty && onSave && (
          <button className="btn btn-accent btn-sm" onClick={onSave} style={{ marginRight: 10 }}>
            <span className="kbd">⌘S</span>Save
          </button>
        )}
        <span className="savestate">{savedAt ?? "— autosaved —"}</span>
      </span>
    </div>
  );
}

// ── Compact masthead ───────────────────────────────────────────────────────
interface CompactHeadProps {
  readonly kicker: string;
  readonly title: string;
  readonly sku?: string;
  readonly pills?: React.ReactNode;
  readonly stats?: string;
  readonly actions?: React.ReactNode;
}
export function CompactHead({ kicker, title, sku, pills, stats, actions }: CompactHeadProps) {
  return (
    <div className="ed-head-compact">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow">{kicker}</div>
        <div className="title">{title}</div>
        <div className="meta-row">
          {sku && <span className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{sku}</span>}
          {pills}
          {stats && <span className="fig" style={{ fontSize: 12 }}>{stats}</span>}
        </div>
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

// ── SS Toolbar (filter/sort/view bar above grid) ───────────────────────────
interface SsToolbarProps {
  readonly filters: ReadonlyArray<AtlasFilterChip>;
  readonly onRemoveFilter: (id: string) => void;
  readonly onAddFilter: () => void;
  readonly sortLabel?: string;
  readonly viewMode: VariantsViewMode;
  readonly onViewChange: (mode: VariantsViewMode) => void;
  readonly children?: React.ReactNode; // extra groups
}
export function SsToolbar({
  filters,
  onRemoveFilter,
  onAddFilter,
  sortLabel,
  viewMode,
  onViewChange,
  children,
}: SsToolbarProps) {
  return (
    <div className="ss-toolbar">
      <div className="group">
        <span className="lbl-mono">Filter</span>
        {filters.map((f) => (
          <span key={f.id} className="chip accent">
            {f.label}
            <span
              className="x"
              style={{ cursor: "pointer" }}
              onClick={() => onRemoveFilter(f.id)}
            >✕</span>
          </span>
        ))}
        <span className="chip dash" onClick={onAddFilter} style={{ cursor: "pointer" }}>+ filter</span>
      </div>
      {sortLabel && (
        <div className="group">
          <span className="lbl-mono">Sort</span>
          <span className="chip">{sortLabel}</span>
        </div>
      )}
      {children}
      <div className="group" style={{ marginLeft: "auto" }}>
        <span className="lbl-mono">View</span>
        <div className="view-switch">
          {(["list", "matrix", "cards"] as VariantsViewMode[]).map((m) => (
            <button key={m} className={viewMode === m ? "on" : ""} onClick={() => onViewChange(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bulk action bar ────────────────────────────────────────────────────────
interface BulkBarProps {
  readonly count: number;
  readonly label?: string;
  readonly onSetPrice?: () => void;
  readonly onSetStock?: () => void;
  readonly onSetStatus?: () => void;
  readonly onDelete?: () => void;
  readonly onClear?: () => void;
  readonly extraInfo?: string;
  readonly children?: React.ReactNode;
}
export function BulkBar({
  count,
  label,
  onSetPrice,
  onSetStock,
  onSetStatus,
  onDelete,
  onClear,
  extraInfo,
  children,
}: BulkBarProps) {
  if (count === 0) return null;
  return (
    <div className="bulk-bar">
      <span className="ct">
        <b>{count}</b> selected
        {label && <span style={{ opacity: .6 }}> · {label}</span>}
      </span>
      <span className="sep">│</span>
      {onSetPrice && <button onClick={onSetPrice}>⊞ Set price</button>}
      {onSetStock && <button onClick={onSetStock}>⊞ Set stock</button>}
      {onSetStatus && <button onClick={onSetStatus}>⊞ Set status</button>}
      {children}
      {onDelete && (
        <>
          <span className="sep">│</span>
          <button style={{ borderColor: "var(--accent-2)", color: "var(--accent-2)" }} onClick={onDelete}>
            Delete
          </button>
        </>
      )}
      <span className="right">
        {extraInfo && <span style={{ fontFamily: "var(--font-display), Spectral, serif", fontStyle: "italic", fontSize: 12, opacity: .9 }}>{extraInfo}</span>}
        {onClear && (
          <span
            style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, opacity: .7, cursor: "pointer" }}
            onClick={onClear}
          >Esc clear</span>
        )}
      </span>
    </div>
  );
}

// ── Status dot ─────────────────────────────────────────────────────────────
interface StatusDotProps {
  readonly status: "in" | "low" | "out";
}
export function StatusDot({ status }: StatusDotProps) {
  const label = status === "out" ? "Sold out" : status === "low" ? "Low" : "In stock";
  return (
    <span className={"status-dot" + (status === "low" ? " low" : status === "out" ? " out" : "")}>
      {label}
    </span>
  );
}

// ── Color swatch inline ────────────────────────────────────────────────────
interface ColorSwatchProps {
  readonly hex: string;
  readonly size?: number;
}
export function ColorSwatch({ hex, size = 14 }: ColorSwatchProps) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        background: hex,
        border: "1px solid var(--rule)",
        borderRadius: 2,
        flexShrink: 0,
      }}
    />
  );
}

// ── Toggle (on/off pill) ───────────────────────────────────────────────────
interface TogglePillProps {
  readonly on: boolean;
  readonly onLabel?: string;
  readonly offLabel?: string;
  readonly onChange?: (on: boolean) => void;
}
export function TogglePill({ on, onLabel = "shown", offLabel = "hidden", onChange }: TogglePillProps) {
  return (
    <span
      className={"cf-toggle" + (on ? " on" : "")}
      onClick={() => onChange?.(!on)}
      style={{ cursor: onChange ? "pointer" : "default" }}
    >
      <span className="pip" />
      {on ? onLabel : offLabel}
    </span>
  );
}
