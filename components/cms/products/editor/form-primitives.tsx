"use client";
/**
 * Shared Grainy building blocks for the product-editor form tabs.
 *
 * SectionHead + Field wrap the grainy.css classes (.gr-eyebrow, .field,
 * .field-label, .input, .select, .textarea, .toggle) so every tab shares one
 * visual vocabulary. Cents<->dollars helpers are shared by the pricing rows.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";

// ── SectionHead — eyebrow-style section divider ─────────────────────────────

export function SectionHead({
  icon: Icon,
  title,
  meta,
  action,
}: {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly meta?: string;
  readonly action?: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 0 10px",
        borderBottom: "1px solid var(--line-faint)",
        marginBottom: 14,
      }}
    >
      {Icon && <Icon size={15} style={{ color: "var(--clay-600)" }} />}
      <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>{title}</span>
      {meta && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {meta}</span>}
      {action && <span style={{ marginLeft: "auto" }}>{action}</span>}
    </div>
  );
}

// ── Field — labelled control wrapper ────────────────────────────────────────

export function Field({
  label,
  hint,
  full,
  children,
}: {
  readonly label: string;
  readonly hint?: React.ReactNode;
  readonly full?: boolean;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="field" style={full ? { gridColumn: "1 / -1" } : undefined}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  );
}

export const hintStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--text-muted)",
  margin: "5px 0 0",
  lineHeight: 1.4,
};

// ── Layout grids ────────────────────────────────────────────────────────────

export const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px 22px",
  paddingBottom: 20,
};
export const threeCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "16px 22px",
  paddingBottom: 20,
};
export const fourCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px 16px",
  paddingBottom: 20,
};

// The editor tabs render inside a scrolling column with breathing room.
export const tabShell: React.CSSProperties = {
  padding: "6px 2px 8px",
};

// ── Cents <-> dollars ───────────────────────────────────────────────────────

export function centsToDollars(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

export function dollarsToCents(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

// ── Toggle — grainy on/off pill with a caption ──────────────────────────────

export function Toggle({
  on,
  onLabel,
  offLabel,
  onChange,
}: {
  readonly on: boolean;
  readonly onLabel: string;
  readonly offLabel: string;
  readonly onChange: (on: boolean) => void;
}): React.ReactElement {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 13 }}>
      <span className={"toggle" + (on ? " on" : "")} onClick={() => onChange(!on)} />
      <span style={{ color: on ? "var(--text)" : "var(--text-muted)" }}>{on ? onLabel : offLabel}</span>
    </label>
  );
}
