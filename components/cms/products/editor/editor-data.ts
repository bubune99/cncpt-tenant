/**
 * Product editor — data builders.
 *
 * Pure functions that derive the variant grid, size×option matrix, and media
 * bulk-assign view models from the product's real options + variants. Lifted
 * verbatim from the old monolith; no React, no side-effects.
 */

import type { MatrixAxisValue, MatrixCell } from "../MatrixView";
import type {
  AtlasVariant,
  AtlasProductOption,
  AtlasProductCustomField,
  AtlasGridColumn,
  AtlasGridRow,
} from "../atlas-types";

export const SYNTHETIC_ROW_ID = "__all__";

export function buildGridColumns(
  options: ReadonlyArray<AtlasProductOption>,
  customFields: ReadonlyArray<AtlasProductCustomField>,
): ReadonlyArray<AtlasGridColumn> {
  const base: AtlasGridColumn[] = [
    { id: "sku", kind: "core", label: "SKU", width: 120, align: "left", editable: true },
    { id: "price", kind: "core", label: "Price", width: 90, align: "right", editable: true },
    { id: "costPrice", kind: "core", label: "Cost", width: 80, align: "right", editable: true },
    { id: "stock", kind: "core", label: "Stock", width: 70, align: "right", editable: true },
    { id: "status", kind: "core", label: "Status", width: 80, align: "center", editable: false },
    { id: "weight", kind: "core", label: "Weight (g)", width: 90, align: "right", editable: true },
    { id: "pace", kind: "core", label: "30d sold", width: 80, align: "right", editable: false },
  ];

  const optionCols: AtlasGridColumn[] = options.map((opt) => ({
    id: `opt_${opt.id}`,
    kind: "option" as const,
    label: opt.name,
    width: 100,
    align: "left" as const,
    editable: false,
  }));

  const fieldCols: AtlasGridColumn[] = customFields
    .filter((pcf) => pcf.showInGrid)
    .map((pcf) => ({
      id: `field_${pcf.customFieldId}`,
      kind: "field" as const,
      label: pcf.customField.name,
      width: 110,
      align: "left" as const,
      editable: true,
      fieldType: pcf.customField.type,
      fieldOptions: Array.isArray(pcf.customField.options)
        ? (pcf.customField.options as Array<{ value: string; label: string }>).map((o) => ({
            value: String(o.value),
            label: String(o.label ?? o.value),
          }))
        : undefined,
    }));

  return [...base, ...optionCols, ...fieldCols];
}

export function buildGridRows(
  variants: ReadonlyArray<AtlasVariant>,
): ReadonlyArray<AtlasGridRow> {
  return variants.map((v) => {
    const stock = v.stock ?? 0;
    const status: "in" | "low" | "out" =
      stock <= 0 ? "out" : stock <= 5 ? "low" : "in";

    const row: Record<string, unknown> = {
      id: v.id,
      sku: v.sku,
      price: v.price,
      costPrice: v.costPrice,
      stock,
      status,
      enabled: v.enabled,
      weight: v.weight,
      pace: 0,
    };

    for (const optVal of Object.values(v.optionValues)) {
      row[`opt_${optVal.optionId}`] = optVal.value;
    }

    for (const fieldVal of Object.values(v.customFields)) {
      row[`field_${fieldVal.fieldId}`] = fieldVal.value;
    }

    return row as AtlasGridRow;
  });
}

// Map common option-value names to a swatch hex (best-effort; falls back neutral).
const COLOR_NAME_HEX: Readonly<Record<string, string>> = {
  bone: "#efe7d8", ivory: "#f3ecda", white: "#f7f4ec", cream: "#f0e8d6",
  marigold: "#d4a017", gold: "#b58730", yellow: "#e0b020", amber: "#c8901f",
  moss: "#4f5e3a", green: "#4f5e3a", olive: "#6b6233", sage: "#9aa07c",
  rust: "#8b2c1f", red: "#a83226", crimson: "#8b2c1f", terracotta: "#b5573a",
  black: "#1a1410", charcoal: "#3a342e", grey: "#8a857c", gray: "#8a857c",
  navy: "#2a3a5a", blue: "#2a4a73", teal: "#2a5a5a", brown: "#5a4632",
  pink: "#d39", rose: "#c47", purple: "#6a3d7a", tan: "#c8a97e",
};
function nameToHex(name: string): string {
  return COLOR_NAME_HEX[name.toLowerCase().trim()] ?? "var(--paper-3)";
}

function slugCode(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

// Build the media bulk-assign view model from options + variants + media library.
// The first option (by position) is treated as the colour/group axis; cover = variant.imageId set.
export function buildMediaData(
  options: ReadonlyArray<AtlasProductOption>,
  variants: ReadonlyArray<AtlasVariant>,
  library: ReadonlyArray<{ id: string; name: string; url: string }>,
) {
  const sorted = [...options].sort((a, b) => a.position - b.position);
  const groupOpt = sorted[0] ?? null;
  const sizeOpt = sorted[1] ?? null;

  const colorGroups = groupOpt
    ? [...groupOpt.values].sort((a, b) => a.position - b.position).map((v) => ({
        id: v.value, label: v.value, hex: nameToHex(v.value), code: v.value.slice(0, 3).toUpperCase(),
      }))
    : [{ id: SYNTHETIC_ROW_ID, label: "All variants", hex: "var(--paper-3)", code: "ALL" }];

  const variantRows = variants.map((v) => {
    const ovs = Object.values(v.optionValues);
    const group = groupOpt ? (ovs.find((o) => o.optionId === groupOpt.id)?.value ?? SYNTHETIC_ROW_ID) : SYNTHETIC_ROW_ID;
    const size = sizeOpt ? (ovs.find((o) => o.optionId === sizeOpt.id)?.value ?? "") : "";
    const hasCover = !!v.imageId;
    return {
      variantId: v.id,
      colorGroup: group,
      colorHex: nameToHex(group),
      colorCode: group.slice(0, 3).toUpperCase(),
      sizeLabel: size,
      sku: v.sku ?? "",
      slots: [hasCover ? "cover" : "empty", "empty", "empty", "empty", "empty"] as ReadonlyArray<"cover" | "alt" | "empty" | "missing">,
    };
  });

  const withCover = variants.filter((v) => v.imageId).length;
  const total = variants.length;
  const coverage = [
    { slot: "Cover", have: withCover, total, note: withCover < total ? `${total - withCover} missing` : "complete" },
  ];

  const libraryItems = library.map((m) => {
    const assignedVariant = variants.find((v) => v.imageId === m.id);
    return { id: m.id, name: m.name, url: m.url, assignedTo: assignedVariant ? (assignedVariant.sku ?? "assigned") : null };
  });

  return { colorGroups, variantRows, coverage, libraryItems };
}

// Build matrix axes + cells from the product's real options & variants.
// 2+ options → first option (by position) on rows, second on columns.
// 1 option   → values on columns with a single synthetic "All" row (graceful 1-D).
export function buildMatrixData(
  options: ReadonlyArray<AtlasProductOption>,
  variants: ReadonlyArray<AtlasVariant>,
): {
  rows: ReadonlyArray<MatrixAxisValue>;
  cols: ReadonlyArray<MatrixAxisValue>;
  cells: ReadonlyArray<MatrixCell>;
  rowAxisName: string;
  colAxisName: string;
} {
  const sorted = [...options].sort((a, b) => a.position - b.position);
  if (sorted.length === 0) {
    return { rows: [], cols: [], cells: [], rowAxisName: "", colAxisName: "" };
  }

  const oneDim = sorted.length < 2;
  const rowOpt = oneDim ? null : sorted[0];
  const colOpt = oneDim ? sorted[0] : sorted[1];

  const sortByPos = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

  const cols: MatrixAxisValue[] = [...colOpt.values]
    .sort(sortByPos)
    .map((v) => ({ id: v.id, label: v.value, code: slugCode(v.value) }));

  const rows: MatrixAxisValue[] = rowOpt
    ? [...rowOpt.values].sort(sortByPos).map((v) => ({ id: v.id, label: v.value, code: slugCode(v.value) }))
    : [{ id: SYNTHETIC_ROW_ID, label: "All", code: "" }];

  const cells: MatrixCell[] = [];
  for (const v of variants) {
    const ovs = Object.values(v.optionValues);
    const colOv = ovs.find((o) => o.optionId === colOpt.id);
    if (!colOv) continue;
    const rowKey = rowOpt
      ? ovs.find((o) => o.optionId === rowOpt.id)?.valueId
      : SYNTHETIC_ROW_ID;
    if (rowOpt && !rowKey) continue;
    const stock = Number(v.stock ?? 0);
    cells.push({
      rowKey: rowKey as string,
      colKey: colOv.valueId,
      variantId: v.id,
      sku: v.sku ?? "",
      stock,
      price: Number(v.price ?? 0),
      cost: v.costPrice != null ? Number(v.costPrice) : undefined,
      pace: 0,
      status: stock <= 0 ? "out" : stock <= 5 ? "low" : "in",
    });
  }

  return {
    rows,
    cols,
    cells,
    rowAxisName: rowOpt?.name ?? "",
    colAxisName: colOpt.name,
  };
}
