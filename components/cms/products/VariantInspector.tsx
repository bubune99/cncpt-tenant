"use client";
/**
 * VariantInspector — right-side drawer for single-row deep edit.
 * The design memo's answer to modal-vs-inline: bulk edits stay inline in the
 * grid; deep single-row edits open this drawer with the grid visible behind it.
 * Esc closes. Edits route through the same onCellChange used by the grid.
 */

import React from "react";
import type { AtlasGridColumn, AtlasGridRow } from "./atlas-types";

interface VariantInspectorProps {
  readonly row: AtlasGridRow;
  readonly rowIndex: number;
  readonly columns: ReadonlyArray<AtlasGridColumn>;
  readonly onChange: (rowIndex: number, colId: string, value: unknown) => void;
  readonly onClose: () => void;
}

const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 3, padding: "7px 0", borderBottom: "1px solid var(--rule-soft)" };
const lblStyle: React.CSSProperties = { fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)" };
const inputStyle: React.CSSProperties = { background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: "5px 8px", fontFamily: "var(--font-geist), sans-serif", fontSize: 13, color: "var(--ink)", width: "100%", boxSizing: "border-box" };

function toEditable(colId: string, raw: unknown): string {
  if (raw == null) return "";
  if (colId === "price" || colId === "costPrice") return (Number(raw) / 100).toString();
  return String(raw);
}
function fromEditable(colId: string, str: string): unknown {
  if (colId === "price" || colId === "costPrice") return Math.round(parseFloat(str) * 100) || 0;
  if (colId === "stock") return parseInt(str, 10) || 0;
  if (colId === "weight") return parseFloat(str) || 0;
  return str;
}

export function VariantInspector({ row, rowIndex, columns, onChange, onClose }: VariantInspectorProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Editable core + field columns (skip read-only display columns).
  const editable = columns.filter((c) => c.editable && c.id !== "status" && c.id !== "pace");
  const optionCols = columns.filter((c) => c.kind === "option");

  const title = optionCols.map((c) => row[c.id]).filter(Boolean).join(" · ") || (row.sku ? String(row.sku) : "Variant");

  return (
    <div
      style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(26,20,16,.18)" }} />
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", width: 360, height: "100%", background: "var(--paper)",
          borderLeft: "1px solid var(--ink)", boxShadow: "-8px 0 24px rgba(0,0,0,.12)",
          padding: "20px 22px", display: "flex", flexDirection: "column", overflow: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, paddingBottom: 10, borderBottom: "1px solid var(--ink)", marginBottom: 8 }}>
          <span className="display" style={{ fontSize: 19 }}>{title}</span>
          <span
            onClick={onClose}
            style={{ marginLeft: "auto", cursor: "pointer", fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--ink-soft)" }}
          >
            <span className="kbd" style={{ background: "var(--ink)", color: "var(--paper)", padding: "1px 5px", borderRadius: 2, marginRight: 4 }}>Esc</span>close
          </span>
        </div>

        {row.sku != null && (
          <div style={fieldWrap}>
            <span style={lblStyle}>SKU</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{String(row.sku)}</span>
          </div>
        )}

        {editable.map((col) => (
          <div key={col.id} style={fieldWrap}>
            <span style={lblStyle}>{col.label}</span>
            <input
              style={inputStyle}
              defaultValue={toEditable(col.id, row[col.id])}
              onBlur={(e) => onChange(rowIndex, col.id, fromEditable(col.id, e.target.value))}
            />
          </div>
        ))}

        <div style={{ marginTop: "auto", paddingTop: 14, fontFamily: "var(--font-display), Spectral, serif", fontStyle: "italic", fontSize: 12, color: "var(--ink-soft)" }}>
          Edits apply to this variant. Save the product to persist.
        </div>
      </aside>
    </div>
  );
}
