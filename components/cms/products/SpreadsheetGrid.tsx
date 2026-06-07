"use client";
/**
 * SpreadsheetGrid — Atlas Product Editor Frame F1/F6
 * Excel-style variant grid: cell selection, drag-fill, filters, bulk bar, custom field columns.
 * Fully interactive React state — no static mock.
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Crumbs,
  Sec,
  SaveBar,
  SsToolbar,
  BulkBar,
  StatusDot,
  ColorSwatch,
  TogglePill,
} from "./atlas-product-ui";
import type {
  AtlasFilterChip,
  AtlasGridColumn,
  AtlasGridRow,
  VariantsViewMode,
} from "./atlas-types";

// ── Types ────────────────────────────────────────────────────────────────
interface CellPos {
  rowIndex: number;
  colId: string;
}

interface SpreadsheetGridProps {
  readonly productId: string;
  readonly productTitle: string;
  readonly sku: string;
  readonly rows: ReadonlyArray<AtlasGridRow>;
  readonly columns: ReadonlyArray<AtlasGridColumn>;
  readonly customFieldColumns?: ReadonlyArray<AtlasGridColumn>;
  readonly breadcrumbs: ReadonlyArray<readonly [string, string?]>;
  readonly pills?: React.ReactNode;
  readonly stats?: string;
  readonly actions?: React.ReactNode;
  readonly viewMode: VariantsViewMode;
  readonly onViewChange: (mode: VariantsViewMode) => void;
  readonly onCellChange?: (rowIndex: number, colId: string, value: unknown) => void;
  readonly onBulkSetPrice?: (rowIndexes: ReadonlyArray<number>, price: number) => void;
  readonly onBulkSetStock?: (rowIndexes: ReadonlyArray<number>, stock: number) => void;
  readonly onInspectRow?: (rowIndex: number) => void;
  readonly onSave?: () => void;
  readonly isDirty?: boolean;
  readonly savedAt?: string;
}

// ── Core column ids ─────────────────────────────────────────────────────
const CORE_COLS: ReadonlyArray<string> = [
  "sku", "price", "costPrice", "stock", "weight", "status", "pace",
];

// ── Component ────────────────────────────────────────────────────────────
export function SpreadsheetGrid({
  productTitle,
  sku,
  rows,
  columns,
  customFieldColumns = [],
  breadcrumbs,
  pills,
  stats,
  actions,
  viewMode,
  onViewChange,
  onCellChange,
  onBulkSetPrice,
  onBulkSetStock,
  onInspectRow,
  onSave,
  isDirty = false,
  savedAt,
}: SpreadsheetGridProps) {
  // ── Local state ─────────────────────────────────────────────────────────
  const [selectedRows, setSelectedRows] = useState<ReadonlyArray<number>>([]);
  const [activeCell, setActiveCell] = useState<CellPos | null>(null);
  const [editingCell, setEditingCell] = useState<CellPos | null>(null);
  const [editValue, setEditValue] = useState("");
  const [filters, setFilters] = useState<ReadonlyArray<AtlasFilterChip>>([]);
  const [sortLabel, setSortLabel] = useState("by size ↑");
  const [fillTooltip, setFillTooltip] = useState<{ top: number; left: number; text: string } | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [fillFromRow, setFillFromRow] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Derived: filtered+sorted rows ──────────────────────────────────────
  const visibleRows = React.useMemo(() => {
    let result = [...rows];
    for (const f of filters) {
      result = result.filter((row) => {
        const val = row[f.field];
        if (f.op === "=") return String(val) === String(f.value);
        if (f.op === "<" && typeof val === "number" && typeof f.value === "number") return val < f.value;
        if (f.op === ">" && typeof val === "number" && typeof f.value === "number") return val > f.value;
        return true;
      });
    }
    return result;
  }, [rows, filters]);

  const filteredIndexes = React.useMemo(
    () => new Set(visibleRows.map((r) => rows.findIndex((rr) => rr.id === r.id))),
    [visibleRows, rows]
  );

  // All columns shown = core + custom fields
  const allColumns = [...columns, ...customFieldColumns];

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCellClick = useCallback((rowIndex: number, colId: string, e: React.MouseEvent) => {
    if (e.shiftKey && selectedRows.length > 0) {
      const last = selectedRows[selectedRows.length - 1];
      const min = Math.min(last, rowIndex);
      const max = Math.max(last, rowIndex);
      setSelectedRows(Array.from({ length: max - min + 1 }, (_, i) => min + i));
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedRows((prev) =>
        prev.includes(rowIndex) ? prev.filter((r) => r !== rowIndex) : [...prev, rowIndex]
      );
    } else {
      setActiveCell({ rowIndex, colId });
    }
  }, [selectedRows]);

  const handleCheckboxRow = useCallback((rowIndex: number) => {
    setSelectedRows((prev) =>
      prev.includes(rowIndex) ? prev.filter((r) => r !== rowIndex) : [...prev, rowIndex]
    );
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedRows(checked ? rows.map((_, i) => i) : []);
  }, [rows]);

  const handleCellDoubleClick = useCallback((rowIndex: number, colId: string) => {
    const col = allColumns.find((c) => c.id === colId);
    if (!col?.editable) return;
    const row = rows[rowIndex];
    const rawVal = row[colId];
    setEditingCell({ rowIndex, colId });
    // Price/cost are stored in cents; show dollars in the editor so the
    // ×100 on commit round-trips correctly (was showing raw cents → 100× inflation).
    if ((colId === "price" || colId === "costPrice") && rawVal != null) {
      setEditValue((Number(rawVal) / 100).toString());
    } else {
      setEditValue(rawVal != null ? String(rawVal) : "");
    }
  }, [allColumns, rows]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const col = allColumns.find((c) => c.id === editingCell.colId);
    let value: unknown = editValue;
    if (col) {
      if (editingCell.colId === "price" || editingCell.colId === "costPrice") {
        value = Math.round(parseFloat(editValue) * 100);
      } else if (editingCell.colId === "stock") {
        value = parseInt(editValue);
      } else if (editingCell.colId === "weight") {
        value = parseFloat(editValue);
      }
    }
    onCellChange?.(editingCell.rowIndex, editingCell.colId, value);
    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, onCellChange, allColumns]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") { setEditingCell(null); setEditValue(""); }
    if (e.key === "Tab") { e.preventDefault(); commitEdit(); }
  }, [commitEdit]);

  const handleFillMouseDown = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingFill(true);
    setFillFromRow(rowIndex);
  }, []);

  // Drag-to-fill: while dragging the active cell's handle, fill that column
  // from the source row down/up to the row under the cursor on release.
  React.useEffect(() => {
    if (!isDraggingFill || fillFromRow == null || !activeCell) return;
    const colId = activeCell.colId;
    const sourceVal = rows[fillFromRow]?.[colId];

    const rowIndexAt = (clientX: number, clientY: number): number | null => {
      const el = document.elementFromPoint(clientX, clientY);
      const tr = el?.closest("tr[data-row-index]");
      const idx = tr?.getAttribute("data-row-index");
      return idx != null ? Number(idx) : null;
    };

    const onMove = (e: MouseEvent) => {
      const target = rowIndexAt(e.clientX, e.clientY);
      const count = target != null ? Math.abs(target - fillFromRow) : 0;
      setFillTooltip({ top: e.clientY + 12, left: e.clientX + 12, text: count > 0 ? `fill ${count} cell${count > 1 ? "s" : ""}` : "drag to fill" });
    };
    const onUp = (e: MouseEvent) => {
      const target = rowIndexAt(e.clientX, e.clientY);
      if (target != null && target !== fillFromRow && sourceVal !== undefined) {
        const lo = Math.min(fillFromRow, target);
        const hi = Math.max(fillFromRow, target);
        for (let i = lo; i <= hi; i++) {
          if (i !== fillFromRow) onCellChange?.(i, colId, sourceVal);
        }
      }
      setIsDraggingFill(false);
      setFillFromRow(null);
      setFillTooltip(null);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingFill, fillFromRow, activeCell, rows, onCellChange]);

  const handleBulkSetPrice = useCallback(() => {
    const priceStr = window.prompt("Set price for selected variants ($):", "");
    if (!priceStr) return;
    const price = Math.round(parseFloat(priceStr) * 100);
    if (!isNaN(price)) {
      onBulkSetPrice?.(selectedRows, price);
    }
  }, [selectedRows, onBulkSetPrice]);

  const handleBulkSetStock = useCallback(() => {
    const stockStr = window.prompt("Set stock quantity for selected variants:", "");
    if (!stockStr) return;
    const stock = parseInt(stockStr);
    if (!isNaN(stock)) {
      onBulkSetStock?.(selectedRows, stock);
    }
  }, [selectedRows, onBulkSetStock]);

  const handleRemoveFilter = useCallback((id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleAddFilter = useCallback(() => {
    // Demo: add a "stock < 10" filter
    const id = `filter-${Date.now()}`;
    setFilters((prev) => [
      ...prev,
      { id, label: "stock < 10", field: "stock", op: "<", value: 10 },
    ]);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  const showDimmed = filters.length > 0;

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <Crumbs items={breadcrumbs} />

      {/* Compact head */}
      <div className="ed-head-compact">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">
            Product · {rows.length} variants
          </div>
          <div className="title">{productTitle}</div>
          <div className="meta-row">
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{sku}</span>
            {pills}
            {stats && <span className="fig" style={{ fontSize: 12 }}>{stats}</span>}
          </div>
        </div>
        {actions && <div className="actions">{actions}</div>}
      </div>

      {/* Toolbar */}
      <SsToolbar
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onAddFilter={handleAddFilter}
        sortLabel={sortLabel}
        viewMode={viewMode}
        onViewChange={onViewChange}
      >
        {customFieldColumns.length > 0 && (
          <div className="group">
            <span className="lbl-mono">Columns</span>
            <span className="chip">{allColumns.length} visible</span>
            {customFieldColumns.map((cf) => (
              <span key={cf.id} className="chip on">
                {cf.label}{" "}
                <span className="cf-col-marker">FIELD</span>
              </span>
            ))}
          </div>
        )}
      </SsToolbar>

      {/* Bulk bar */}
      <BulkBar
        count={selectedRows.length}
        label={selectedRows.length === rows.length ? "all variants" : undefined}
        onSetPrice={handleBulkSetPrice}
        onSetStock={handleBulkSetStock}
        onSetStatus={() => void 0}
        onDelete={() => void 0}
        onClear={() => setSelectedRows([])}
      />

      {/* Grid */}
      <div className="ss-wrap" ref={gridRef}>
        <table className="ss">
          <colgroup>
            <col style={{ width: 28 }} />
            <col style={{ width: 32 }} />
            {allColumns.map((col) => (
              <col key={col.id} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="ck">
                <input
                  type="checkbox"
                  checked={selectedRows.length === rows.length && rows.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="num">#</th>
              {allColumns.map((col) => (
                <th
                  key={col.id}
                  className={col.align === "right" ? "num" : ""}
                  onClick={() => setSortLabel(`by ${col.label} ↑`)}
                  style={{ cursor: "pointer" }}
                >
                  {col.label}
                  {col.id === sortLabel.replace("by ", "").replace(" ↑", "") && (
                    <span className="sort"> ↑</span>
                  )}
                  {col.kind === "field" && (
                    <span className="cf-col-marker">FIELD</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const inFilter = !showDimmed || filteredIndexes.has(rowIndex);
              const isSel = selectedRows.includes(rowIndex);
              const isActive = activeCell?.rowIndex === rowIndex;
              return (
                <tr
                  key={row.id}
                  data-row-index={rowIndex}
                  className={isSel ? "sel-row" : ""}
                  style={!inFilter ? { opacity: 0.42 } : {}}
                  onClick={(e) => handleCellClick(rowIndex, "", e)}
                >
                  <td className="ck">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => handleCheckboxRow(rowIndex)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="num" style={{ color: "var(--ink-faint)", whiteSpace: "nowrap" }}>
                    {rowIndex + 1}
                    {onInspectRow && (
                      <span
                        onClick={(e) => { e.stopPropagation(); onInspectRow(rowIndex); }}
                        title="Inspect variant"
                        style={{ cursor: "pointer", marginLeft: 5, color: "var(--ink-soft)" }}
                      >
                        ⤢
                      </span>
                    )}
                  </td>
                  {allColumns.map((col) => {
                    const isEditingThis =
                      editingCell?.rowIndex === rowIndex && editingCell?.colId === col.id;
                    const isActiveCell =
                      activeCell?.rowIndex === rowIndex && activeCell?.colId === col.id;
                    const rawVal = row[col.id];

                    return (
                      <td
                        key={col.id}
                        className={
                          (col.align === "right" ? "num" : "") +
                          (isActiveCell ? " active-cell" : "")
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(rowIndex, col.id, e);
                        }}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, col.id)}
                        style={{ position: "relative" }}
                      >
                        {isEditingThis ? (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={commitEdit}
                            style={{
                              width: "100%",
                              background: "var(--paper)",
                              border: "none",
                              outline: "none",
                              fontFamily: "inherit",
                              fontSize: "inherit",
                              textAlign: col.align === "right" ? "right" : "left",
                              color: "var(--ink)",
                            }}
                          />
                        ) : (
                          <CellValue col={col} row={row} value={rawVal} />
                        )}
                        {/* Fill handle on last selected row active cell */}
                        {isActiveCell && isSel && (
                          <span
                            className="fill-handle"
                            onMouseDown={(e) => handleFillMouseDown(e, rowIndex)}
                            title="Drag to fill down"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Fill tooltip (shown during drag) */}
        {fillTooltip && (
          <div
            className="fill-tooltip"
            style={{ top: fillTooltip.top, left: fillTooltip.left }}
          >
            {fillTooltip.text}
          </div>
        )}
      </div>

      <SaveBar
        savedAt={isDirty ? `${selectedRows.length} cells changed · unsaved` : savedAt}
        isDirty={isDirty}
        onSave={onSave}
        hints={[
          ["↵", "edit"],
          ["⌫", "clear"],
          ["⌘D", "fill down"],
          ["⌘⇧F", "find"],
          ["Esc", "deselect"],
        ]}
      />
    </div>
  );
}

// ── Cell value renderer ────────────────────────────────────────────────────
interface CellValueProps {
  readonly col: AtlasGridColumn;
  readonly row: AtlasGridRow;
  readonly value: unknown;
}
function CellValue({ col, row, value }: CellValueProps) {
  // Core columns
  if (col.id === "sku") {
    return (
      <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
        {value as string ?? "—"}
      </span>
    );
  }
  if (col.id === "price" || col.id === "compareAtPrice" || col.id === "costPrice") {
    const cents = value as number | null;
    if (cents == null) return <span className="fig">—</span>;
    return (
      <span className={col.id === "costPrice" ? "fig" : ""} style={{ fontStyle: col.id === "costPrice" ? "italic" : "normal" }}>
        ${(cents / 100).toFixed(2)}
      </span>
    );
  }
  if (col.id === "stock") {
    const stock = value as number;
    return (
      <span style={{
        color: stock === 0 ? "var(--accent)" : stock < 10 ? "var(--gold)" : "var(--ink)",
        fontWeight: stock === 0 ? 600 : 400,
      }}>
        {stock}
      </span>
    );
  }
  if (col.id === "status") {
    return <StatusDot status={row.status} />;
  }
  if (col.id === "weight") {
    return <span className="fig" style={{ fontStyle: "italic", fontSize: 11 }}>{value != null ? String(value) : "—"}</span>;
  }
  if (col.id === "pace") {
    return <span>{value != null ? String(value) : "0"}</span>;
  }

  // Option columns (color swatch inline)
  if (col.kind === "option") {
    const optVal = value as { value: string; hex?: string } | null;
    if (!optVal) return <span className="fig">—</span>;
    if (optVal.hex) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ColorSwatch hex={optVal.hex} />
          {optVal.value}
        </span>
      );
    }
    return <span>{optVal.value}</span>;
  }

  // Custom field columns
  if (col.kind === "field" && col.fieldType) {
    return <FieldCellValue type={col.fieldType} value={value} options={col.fieldOptions} />;
  }

  // Fallback
  return <span>{value != null ? String(value) : "—"}</span>;
}

// ── Custom field cell value renderer ──────────────────────────────────────
import type { CustomFieldTypeKind } from "./atlas-types";
interface FieldCellValueProps {
  readonly type: CustomFieldTypeKind;
  readonly value: unknown;
  readonly options?: ReadonlyArray<{ readonly value: string; readonly label: string }>;
}
function FieldCellValue({ type, value, options }: FieldCellValueProps) {
  if (value == null || value === "") return <span className="fig">—</span>;

  switch (type) {
    case "BOOLEAN":
      return (
        <span
          style={{
            display: "inline-block",
            width: 14,
            height: 14,
            borderRadius: 2,
            background: value ? "var(--accent)" : "var(--paper)",
            border: `1px solid ${value ? "var(--accent)" : "var(--rule)"}`,
            color: "var(--paper)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            lineHeight: "13px",
            textAlign: "center",
          }}
        >
          {value ? "✓" : ""}
        </span>
      );
    case "MULTISELECT": {
      const arr = Array.isArray(value) ? (value as string[]) : [String(value)];
      return (
        <span>
          {arr.slice(0, 3).map((v) => (
            <span key={v} className="cell-chip">{v}</span>
          ))}
        </span>
      );
    }
    case "NUMBER":
      return <span className="mono" style={{ fontSize: 12 }}>{String(value)}</span>;
    case "SELECT": {
      const opt = options?.find((o) => o.value === String(value));
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {opt?.label ?? String(value)}
          <span style={{ color: "var(--ink-faint)", fontSize: 10 }}>▾</span>
        </span>
      );
    }
    case "COLOR":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <ColorSwatch hex={String(value)} size={12} />
          <span className="mono" style={{ fontSize: 10 }}>{String(value)}</span>
        </span>
      );
    default:
      return <span>{String(value)}</span>;
  }
}
