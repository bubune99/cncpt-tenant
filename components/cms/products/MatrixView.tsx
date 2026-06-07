"use client";
/**
 * MatrixView — Atlas Product Editor Frame F2
 * Size × Color crosstab with stock heat coloring.
 * Range-select cells; drag corner fill handle to fill 2D.
 */

import React, { useState, useCallback } from "react";
import { BulkBar, SaveBar } from "./atlas-product-ui";

// ── Types ─────────────────────────────────────────────────────────────────
export interface MatrixAxisValue {
  readonly id: string;
  readonly label: string;
  readonly code: string;
  readonly hex?: string;
}

export interface MatrixCell {
  readonly rowKey: string; // e.g. color id
  readonly colKey: string; // e.g. size id
  readonly variantId: string;
  readonly sku: string;
  readonly stock: number;
  readonly price: number; // cents
  readonly cost?: number; // cents
  readonly pace: number;
  readonly status: "in" | "low" | "out";
}

interface MatrixViewProps {
  readonly rows: ReadonlyArray<MatrixAxisValue>; // e.g. colors
  readonly cols: ReadonlyArray<MatrixAxisValue>; // e.g. sizes
  readonly cells: ReadonlyArray<MatrixCell>;
  readonly showing: "stock" | "price" | "pace" | "cost";
  readonly onShowingChange?: (s: "stock" | "price" | "pace" | "cost") => void;
  readonly onCellBulkEdit?: (keys: ReadonlyArray<{ rowKey: string; colKey: string }>, value: number) => void;
  readonly onViewChange?: (mode: "list" | "matrix" | "cards") => void;
  readonly onSave?: () => void;
  /** Option names for the axes (e.g. "Color", "Size"). Drives the corner + totals labels. */
  readonly rowAxisName?: string;
  readonly colAxisName?: string;
  readonly savedAt?: string;
  readonly isDirty?: boolean;
}

type CellKey = `${string}|${string}`;

function makeCellKey(rowKey: string, colKey: string): CellKey {
  return `${rowKey}|${colKey}`;
}

// ── Component ─────────────────────────────────────────────────────────────
export function MatrixView({
  rows,
  cols,
  cells,
  showing,
  onShowingChange,
  onCellBulkEdit,
  onViewChange,
  onSave,
  rowAxisName,
  colAxisName,
  savedAt,
  isDirty = false,
}: MatrixViewProps) {
  const cornerLabel = colAxisName && rowAxisName
    ? `${rowAxisName} × ${colAxisName}`
    : colAxisName || "matrix";
  const colAxisLower = (colAxisName || "size").toLowerCase();
  const [selectedKeys, setSelectedKeys] = useState<ReadonlyArray<CellKey>>([]);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragStart, setDragStart] = useState<CellKey | null>(null);

  // Build lookup
  const cellMap = React.useMemo(() => {
    const m = new Map<CellKey, MatrixCell>();
    for (const c of cells) {
      m.set(makeCellKey(c.rowKey, c.colKey), c);
    }
    return m;
  }, [cells]);

  const getCell = (rowKey: string, colKey: string) =>
    cellMap.get(makeCellKey(rowKey, colKey));

  // Totals
  const rowTotals = rows.map((r) =>
    cols.reduce((sum, c) => sum + (getCell(r.id, c.id)?.stock ?? 0), 0)
  );
  const colTotals = cols.map((c) =>
    rows.reduce((sum, r) => sum + (getCell(r.id, c.id)?.stock ?? 0), 0)
  );
  const grand = rowTotals.reduce((a, b) => a + b, 0);

  // Selection
  const isSelected = (rowKey: string, colKey: string) =>
    selectedKeys.includes(makeCellKey(rowKey, colKey));

  const handleCellClick = useCallback(
    (rowKey: string, colKey: string, e: React.MouseEvent) => {
      const key = makeCellKey(rowKey, colKey);
      if (e.shiftKey && selectedKeys.length > 0) {
        // Expand range to rectangle between first selected and this
        const firstKey = selectedKeys[0];
        const [firstRow, firstCol] = firstKey.split("|");
        const r1 = rows.findIndex((r) => r.id === firstRow);
        const r2 = rows.findIndex((r) => r.id === rowKey);
        const c1 = cols.findIndex((c) => c.id === firstCol);
        const c2 = cols.findIndex((c) => c.id === colKey);
        const minR = Math.min(r1, r2);
        const maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2);
        const maxC = Math.max(c1, c2);
        const range: CellKey[] = [];
        for (let ri = minR; ri <= maxR; ri++) {
          for (let ci = minC; ci <= maxC; ci++) {
            range.push(makeCellKey(rows[ri].id, cols[ci].id));
          }
        }
        setSelectedKeys(range);
      } else if (e.ctrlKey || e.metaKey) {
        setSelectedKeys((prev) =>
          prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
      } else {
        setSelectedKeys([key]);
      }
    },
    [selectedKeys, rows, cols]
  );

  const handleHeaderRowClick = useCallback((rowKey: string) => {
    setSelectedKeys(cols.map((c) => makeCellKey(rowKey, c.id)));
  }, [cols]);

  const handleHeaderColClick = useCallback((colKey: string) => {
    setSelectedKeys(rows.map((r) => makeCellKey(r.id, colKey)));
  }, [rows]);

  const selectedCells = selectedKeys
    .map((k) => {
      const [rk, ck] = k.split("|");
      return cellMap.get(k) ?? null;
    })
    .filter((c): c is MatrixCell => c !== null);

  const allSoldOut = selectedCells.length > 0 && selectedCells.every((c) => c.status === "out");

  // ── Cell display ────────────────────────────────────────────────────────
  const cellDisplay = (cell: MatrixCell | undefined) => {
    if (!cell) return "—";
    switch (showing) {
      case "stock": return cell.stock;
      case "price": return `$${(cell.price / 100).toFixed(0)}`;
      case "cost": return cell.cost != null ? `$${(cell.cost / 100).toFixed(0)}` : "—";
      case "pace": return cell.pace;
      default: return cell.stock;
    }
  };

  // ── Bulk actions ────────────────────────────────────────────────────────
  const handleBulkSetStock = () => {
    const val = window.prompt(`Set stock for ${selectedKeys.length} cells:`, "");
    if (!val) return;
    const stock = parseInt(val);
    if (!isNaN(stock)) {
      const keys = selectedKeys.map((k) => {
        const [rowKey, colKey] = k.split("|");
        return { rowKey, colKey };
      });
      onCellBulkEdit?.(keys, stock);
    }
  };

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      {/* Toolbar */}
      <div className="ss-toolbar">
        <div className="group">
          <span className="lbl-mono">Showing</span>
          {(["stock", "price", "pace", "cost"] as const).map((s) => (
            <span
              key={s}
              className={"chip" + (s === showing ? " on" : " dash")}
              onClick={() => onShowingChange?.(s)}
              style={{ cursor: "pointer" }}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="group">
          <span className="lbl-mono">Cells</span>
          <span className="chip">color → stock heat</span>
        </div>
        <div className="group" style={{ marginLeft: "auto" }}>
          <span className="lbl-mono">View</span>
          <div className="view-switch">
            <button onClick={() => onViewChange?.("list")}>List</button>
            <button className="on">Matrix</button>
            <button onClick={() => onViewChange?.("cards")}>Cards</button>
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedKeys.length > 0 && (
        <div className="bulk-bar">
          <span className="ct">
            <b>{selectedKeys.length}</b> cells selected
          </span>
          <span className="sep">│</span>
          <button onClick={handleBulkSetStock}>Set stock</button>
          <button>+ PO for these</button>
          <button>Mark restocking</button>
          <button onClick={() => setSelectedKeys([])}>Open as list</button>
          {allSoldOut && (
            <span className="right">
              <span style={{ fontFamily: "var(--font-display), Spectral, serif", fontStyle: "italic", fontSize: 13, opacity: .9 }}>
                all sold out · {selectedCells.reduce((s, c) => s + c.pace, 0)} sold last 30d combined
              </span>
            </span>
          )}
        </div>
      )}

      {/* Matrix */}
      <div className="matrix-wrap">
        <div
          className="matrix"
          style={{
            display: "grid",
            gridTemplateColumns: `140px repeat(${cols.length}, 1fr) 90px`,
            gap: 0,
          }}
        >
          {/* Header: corner */}
          <div className="mx-cell head corner" style={{ minHeight: 44 }}>
            <span style={{
              fontFamily: "var(--font-display), Spectral, serif",
              fontStyle: "italic", fontSize: 12,
              textTransform: "none", letterSpacing: 0, color: "var(--ink-soft)"
            }}>
              {cornerLabel}
            </span>
          </div>

          {/* Header: sizes */}
          {cols.map((c) => (
            <div
              key={c.id}
              className="mx-cell head"
              onClick={() => handleHeaderColClick(c.id)}
              style={{ cursor: "pointer" }}
            >
              {c.label}
            </div>
          ))}

          {/* Header: total */}
          <div className="mx-cell head" style={{ background: "var(--paper-2)" }}>Total</div>

          {/* Body: rows (colors) */}
          {rows.map((row, ri) => (
            <React.Fragment key={row.id}>
              {/* Row header */}
              <div
                className="mx-cell row-head"
                onClick={() => handleHeaderRowClick(row.id)}
                style={{ cursor: "pointer" }}
              >
                {row.hex && (
                  <span className="sw" style={{ background: row.hex }} />
                )}
                <div>
                  <div className="lbl">{row.label}</div>
                  <div className="sub">{row.code}</div>
                </div>
              </div>

              {/* Cells */}
              {cols.map((col) => {
                const cell = getCell(row.id, col.id);
                const key = makeCellKey(row.id, col.id);
                const sel = selectedKeys.includes(key);
                const isFirst = selectedKeys[0] === key;
                return (
                  <div
                    key={col.id}
                    className={
                      "mx-cell" +
                      (isFirst ? " active" : sel ? " in-range" : "")
                    }
                    onClick={(e) => handleCellClick(row.id, col.id, e)}
                  >
                    <span className="badge-mini">{row.code ? `${col.label}·${row.code}` : col.label}</span>
                    <div
                      className={"stock-big" +
                        (cell?.status === "out" ? " out" : cell?.status === "low" ? " low" : "")}
                    >
                      {cell != null ? cellDisplay(cell) : "—"}
                    </div>
                    {cell && (
                      <div className="price-sm">
                        ${(cell.price / 100).toFixed(0)} · {cell.pace}/mo
                      </div>
                    )}
                    {/* Fill handle on last selected */}
                    {sel && selectedKeys[selectedKeys.length - 1] === key && (
                      <span className="fill-handle" title="Drag to fill" />
                    )}
                  </div>
                );
              })}

              {/* Row total */}
              <div className="mx-cell totals" style={{ alignItems: "flex-start", justifyContent: "center" }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{rowTotals[ri]}</span>
                <span className="fig" style={{ fontSize: 10 }}>units</span>
              </div>
            </React.Fragment>
          ))}

          {/* Totals row */}
          <div className="mx-cell totals row-head" style={{ minHeight: 50 }}>
            <span style={{
              fontFamily: "var(--font-geist-mono), monospace", fontSize: 10,
              color: "var(--ink-soft)", letterSpacing: ".08em", textTransform: "uppercase"
            }}>Total / {colAxisLower}</span>
          </div>
          {cols.map((c, ci) => (
            <div key={c.id} className="mx-cell totals" style={{ alignItems: "center", justifyContent: "center", minHeight: 50 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{colTotals[ci]}</span>
              <span className="fig" style={{ fontSize: 10 }}>units</span>
            </div>
          ))}
          <div className="mx-cell totals" style={{ alignItems: "center", justifyContent: "center", minHeight: 50, background: "var(--paper-3)" }}>
            <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 500 }}>{grand}</span>
            <span className="fig" style={{ fontSize: 10 }}>on hand</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, padding: "12px 4px 0", fontSize: 12, color: "var(--ink-soft)", flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase" }}>Legend</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span className="status-dot out" /></span>
          <span>Sold out</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span className="status-dot low" /></span>
          <span>Low (&lt; 10)</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span className="status-dot" /></span>
          <span>In stock</span>
          <span style={{ marginLeft: "auto" }} className="fig">
            Click a cell to inspect · drag the corner handle to fill · click a header to bulk-edit row/column
          </span>
        </div>
      </div>

      <SaveBar
        savedAt={selectedKeys.length > 0 ? `${selectedKeys.length} cells selected` : savedAt}
        isDirty={isDirty}
        onSave={onSave}
        hints={[
          ["↵", "inspect"],
          ["⌘D", "fill"],
          ["⌘⇧F", "find"],
          ["Esc", "deselect"],
        ]}
      />
    </div>
  );
}
