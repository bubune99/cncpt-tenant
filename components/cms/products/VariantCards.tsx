"use client";
/**
 * VariantCards — Atlas Product Editor, Variants "Cards" view.
 * A browsable card grid of variants (read-first; edit happens in List/Matrix).
 * Includes the view-switch so the view is navigable (List · Matrix · Cards).
 */

import React from "react";
import { Sec, SaveBar, StatusDot } from "./atlas-product-ui";
import type { AtlasGridColumn, AtlasGridRow, AtlasProductOption, VariantsViewMode } from "./atlas-types";

interface VariantCardsProps {
  readonly rows: ReadonlyArray<AtlasGridRow>;
  readonly options: ReadonlyArray<AtlasProductOption>;
  readonly fieldColumns?: ReadonlyArray<AtlasGridColumn>;
  readonly viewMode: VariantsViewMode;
  readonly onViewChange: (mode: VariantsViewMode) => void;
  readonly onSave?: () => void;
  readonly isDirty?: boolean;
  readonly savedAt?: string;
}

function formatCents(cents: unknown): string {
  const n = Number(cents);
  return Number.isFinite(n) ? `$${(n / 100).toFixed(2)}` : "—";
}

export function VariantCards({
  rows,
  options,
  fieldColumns = [],
  viewMode,
  onViewChange,
  onSave,
  isDirty = false,
  savedAt,
}: VariantCardsProps) {
  const sortedOptions = [...options].sort((a, b) => a.position - b.position);

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      {/* Toolbar */}
      <div className="ss-toolbar">
        <div className="group">
          <span className="lbl-mono">Variants</span>
          <span className="chip">{rows.length} total</span>
        </div>
        <div className="group" style={{ marginLeft: "auto" }}>
          <span className="lbl-mono">View</span>
          <div className="view-switch">
            <button onClick={() => onViewChange("list")}>List</button>
            <button onClick={() => onViewChange("matrix")}>Matrix</button>
            <button className="on">Cards</button>
          </div>
        </div>
      </div>

      <Sec h="All variants" meta="cards · browse · edit in list or matrix" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          padding: "8px 0 4px",
          overflow: "auto",
          flex: 1,
          minHeight: 0,
        }}
      >
        {rows.map((row) => {
          const optParts = sortedOptions
            .map((o) => row[`opt_${o.id}`])
            .filter((v): v is string => typeof v === "string" && v.length > 0);
          const stock = Number(row.stock ?? 0);
          const status: "in" | "low" | "out" =
            (row.status as "in" | "low" | "out") ?? (stock <= 0 ? "out" : stock <= 5 ? "low" : "in");
          const stockColor =
            stock <= 0 ? "var(--accent)" : stock < 10 ? "var(--gold)" : "var(--ink)";
          return (
            <div
              key={String(row.id)}
              style={{
                background: "var(--paper)",
                border: "1px solid var(--rule)",
                borderRadius: "var(--r-sm)",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                className="display"
                style={{ fontSize: 17, lineHeight: 1.1, color: "var(--ink)" }}
              >
                {optParts.length ? optParts.join(" · ") : "Default"}
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-soft)" }}
              >
                {row.sku ? String(row.sku) : "— no SKU —"}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--rule-soft)",
                  paddingTop: 8,
                  marginTop: 2,
                }}
              >
                <span
                  className="display"
                  style={{ fontSize: 20, color: "var(--ink)" }}
                >
                  {formatCents(row.price)}
                </span>
                <span
                  className="fig"
                  style={{ fontSize: 11, fontStyle: "italic" }}
                >
                  cost {formatCents(row.costPrice)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 13 }}>
                  <span
                    className="mono"
                    style={{ color: stockColor, fontWeight: stock <= 0 ? 600 : 400 }}
                  >
                    {stock}
                  </span>{" "}
                  <span className="fig" style={{ fontSize: 11 }}>
                    on hand
                  </span>
                </span>
                <StatusDot status={status} />
              </div>

              {fieldColumns.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    borderTop: "1px dashed var(--rule-soft)",
                    paddingTop: 6,
                  }}
                >
                  {fieldColumns.map((fc) => {
                    const val = row[fc.id];
                    if (val == null || val === "") return null;
                    return (
                      <span key={fc.id} className="cell-chip">
                        {fc.label}: {String(val)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SaveBar savedAt={savedAt} isDirty={isDirty} onSave={onSave} hints={[["↵", "edit in list"], ["Esc", "close"]]} />
    </div>
  );
}
