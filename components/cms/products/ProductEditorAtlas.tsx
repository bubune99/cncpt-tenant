"use client";
/**
 * ProductEditorAtlas — Atlas Product Editor Frame Orchestrator
 *
 * Single source of truth for the per-tenant admin product editor. Replaces the
 * legacy shadcn-styled ProductEditor.tsx + /configure route.
 *
 * Tab sets by product type (Media restored, owner-approved D3/D4/D5 applied):
 *   SIMPLE       → Detail · Media · Pricing · Inventory · Channels · SEO
 *   VARIABLE     → Detail · Media · Variants · Pricing · Inventory · Channels · SEO
 *   DIGITAL      → Detail · Media · Files    · Pricing · Channels · SEO
 *   SERVICE      → Detail · Media · Schedule · Pricing · Channels · SEO
 *   SUBSCRIPTION → Detail · Media · Billing  · Pricing · Channels · SEO
 *   BUNDLE       → Detail · Media · Contents · Pricing · Channels · SEO
 *
 * A persistent Type-switch tab is always available so the operator can morph
 * the product type. Variants is gated behind VARIABLE; saved-state gating
 * preserves the legacy editor's "save before adding variants" affordance.
 *
 * Create flow: passing `productId="new"` keeps the editor in a local-only
 * draft state until the first save, at which point it POSTs to
 * /api/cms/products and rewrites the URL to /admin/products/[newId] via
 * history.replaceState (no full navigation, dirty state preserved).
 */

import React from "react";
import Link from "next/link";
import "./atlas-product-editor.css";

import { CompactHead, EditorTabs, SaveBar, Crumbs } from "./atlas-product-ui";
import { SpreadsheetGrid } from "./SpreadsheetGrid";
import { MatrixView, type MatrixAxisValue, type MatrixCell } from "./MatrixView";
import { VariantCards } from "./VariantCards";
import { TypeMorph } from "./TypeMorph";
import { CustomFieldsBuilder } from "./CustomFieldsBuilder";
import { MediaBulkAssign } from "./MediaBulkAssign";
import { BundleComposer } from "./BundleComposer";
import { DigitalEditor } from "./DigitalEditor";
import { PricingStack } from "./PricingStack";
import type { CreateTierPayload, CreateSchedulePayload } from "./PricingStack";
import {
  DetailTab,
  MediaTab,
  PricingExtras,
  InventoryTab,
  ChannelsTab,
  SeoTab,
  ScheduleTab,
  BillingTab,
  type EditorCategory,
  type ProductImageRow,
} from "./ProductEditorAtlasTabs";

import type {
  AtlasProduct,
  AtlasVariant,
  AtlasProductOption,
  AtlasProductCustomField,
  AtlasCustomField,
  AtlasDigitalAsset,
  AtlasBundleItem,
  AtlasGridColumn,
  AtlasGridRow,
  AtlasPricingTier,
  AtlasMemberPricing,
  AtlasSaleSchedule,
  AtlasDiscountCode,
  ProductTypeKind,
  VariantsViewMode,
} from "./atlas-types";

// ── Tab sets per product type ─────────────────────────────────────────────────

type TabLabel =
  | "Detail"
  | "Media"
  | "Variants"
  | "Fields"
  | "Files"
  | "Schedule"
  | "Billing"
  | "Contents"
  | "Inventory"
  | "Pricing"
  | "Channels"
  | "SEO"
  | "Type";

const TABS_BY_TYPE: Readonly<Record<ProductTypeKind, ReadonlyArray<TabLabel>>> = {
  SIMPLE:       ["Detail", "Media", "Fields", "Pricing", "Inventory", "Channels", "SEO", "Type"],
  VARIABLE:     ["Detail", "Media", "Variants", "Fields", "Pricing", "Inventory", "Channels", "SEO", "Type"],
  DIGITAL:      ["Detail", "Media", "Files", "Pricing", "Channels", "SEO", "Type"],
  SERVICE:      ["Detail", "Media", "Schedule", "Pricing", "Channels", "SEO", "Type"],
  SUBSCRIPTION: ["Detail", "Media", "Billing", "Pricing", "Channels", "SEO", "Type"],
  BUNDLE:       ["Detail", "Media", "Contents", "Pricing", "Channels", "SEO", "Type"],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildGridColumns(
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

function buildGridRows(
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

function formatCentsStatic(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const SYNTHETIC_ROW_ID = "__all__";

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

// Build the F3 media bulk-assign view model from options + variants + the media library.
// The first option (by position) is treated as the colour/group axis; cover = variant.imageId set.
function buildMediaData(
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

function slugCode(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

// Build matrix axes + cells from the product's real options & variants.
// 2+ options → first option (by position) on rows, second on columns.
// 1 option   → values on columns with a single synthetic "All" row (graceful 1-D).
// Cells are matched to (row,col) by each variant's option-value ids — not by
// option name, so it works regardless of how options are named.
function buildMatrixData(
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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── API row shapes ────────────────────────────────────────────────────────────

interface DiscountApiRow {
  readonly id: string;
  readonly code: string;
  readonly type: string;
  readonly value: number;
  readonly usageCount: number;
  readonly description: string | null;
  readonly enabled: boolean;
}

interface PricingTierApiRow {
  readonly id: string;
  readonly productId: string;
  readonly label: string;
  readonly minQty: number;
  readonly maxQty: number | null;
  readonly price: number;
  readonly type: "QTY" | "MEMBER";
  readonly enabled: boolean;
}

interface SaleScheduleApiRow {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string | null;
  readonly salePrice: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly enabled: boolean;
}

interface BundleItemRaw {
  readonly productId?: string;
  readonly productTitle?: string;
  readonly variantId?: string | null;
  readonly variantLabel?: string;
  readonly productType?: ProductTypeKind;
  readonly price?: number;
  readonly quantity?: number;
  readonly stock?: number | null;
  readonly hex?: string;
}

// ── Initial empty product (create mode) ───────────────────────────────────────

const EMPTY_PRODUCT: AtlasProduct = {
  id: "",
  title: "",
  slug: "",
  description: null,
  type: "SIMPLE",
  status: "DRAFT",
  basePrice: 0,
  compareAtPrice: null,
  costPrice: null,
  sku: null,
  stock: 0,
  trackInventory: true,
  stripeProductId: null,
  stripePriceId: null,
  stripeSyncedAt: null,
  featured: false,
  barcode: null,
  taxable: true,
  taxCode: null,
  requiresShipping: true,
  weight: null,
  length: null,
  width: null,
  height: null,
  lowStockThreshold: 5,
  allowBackorder: false,
  stripeSyncError: null,
  subscriptionInterval: null,
  subscriptionIntervalCount: null,
  trialDays: null,
  bundlePriceMode: null,
  digitalAssetId: null,
  serviceDuration: null,
  serviceCapacity: null,
  metaTitle: null,
  metaDescription: null,
  bundleItems: null,
  shopifyProductId: null,
  shopifySyncedAt: null,
};

function mapApiProduct(data: Record<string, unknown>): AtlasProduct {
  return {
    id: String(data.id ?? ""),
    title: String(data.title ?? ""),
    slug: String(data.slug ?? ""),
    description: (data.description as string | null) ?? null,
    type: (data.type as ProductTypeKind) ?? "SIMPLE",
    status: (data.status as AtlasProduct["status"]) ?? "DRAFT",
    basePrice: Number(data.basePrice ?? 0),
    compareAtPrice: data.compareAtPrice != null ? Number(data.compareAtPrice) : null,
    costPrice: data.costPrice != null ? Number(data.costPrice) : null,
    sku: (data.sku as string | null) ?? null,
    stock: Number(data.stock ?? 0),
    trackInventory: data.trackInventory !== false,
    stripeProductId: (data.stripeProductId as string | null) ?? null,
    stripePriceId: (data.stripePriceId as string | null) ?? null,
    stripeSyncedAt: (data.stripeSyncedAt as string | null) ?? null,
    featured: Boolean(data.featured),
    barcode: (data.barcode as string | null) ?? null,
    taxable: data.taxable !== false,
    taxCode: (data.taxCode as string | null) ?? null,
    requiresShipping: data.requiresShipping !== false,
    weight: data.weight != null ? Number(data.weight) : null,
    length: data.length != null ? Number(data.length) : null,
    width: data.width != null ? Number(data.width) : null,
    height: data.height != null ? Number(data.height) : null,
    lowStockThreshold:
      data.lowStockThreshold != null ? Number(data.lowStockThreshold) : 5,
    allowBackorder: Boolean(data.allowBackorder),
    stripeSyncError: (data.stripeSyncError as string | null) ?? null,
    subscriptionInterval: (data.subscriptionInterval as string | null) ?? null,
    subscriptionIntervalCount:
      data.subscriptionIntervalCount != null
        ? Number(data.subscriptionIntervalCount)
        : null,
    trialDays: data.trialDays != null ? Number(data.trialDays) : null,
    bundlePriceMode: (data.bundlePriceMode as string | null) ?? null,
    digitalAssetId: (data.digitalAssetId as string | null) ?? null,
    serviceDuration:
      data.serviceDuration != null ? Number(data.serviceDuration) : null,
    serviceCapacity:
      data.serviceCapacity != null ? Number(data.serviceCapacity) : null,
    metaTitle: (data.metaTitle as string | null) ?? null,
    metaDescription: (data.metaDescription as string | null) ?? null,
    bundleItems: data.bundleItems ?? null,
    shopifyProductId: (data.shopifyProductId as string | null) ?? null,
    shopifySyncedAt: (data.shopifySyncedAt as string | null) ?? null,
  };
}

function buildSavePayload(p: AtlasProduct): Record<string, unknown> {
  return {
    title: p.title,
    slug: p.slug,
    description: p.description,
    type: p.type,
    status: p.status,
    featured: p.featured ?? false,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    costPrice: p.costPrice,
    sku: p.sku,
    barcode: p.barcode,
    taxable: p.taxable ?? true,
    taxCode: p.taxCode,
    requiresShipping: p.requiresShipping ?? true,
    weight: p.weight,
    length: p.length,
    width: p.width,
    height: p.height,
    stock: p.stock,
    trackInventory: p.trackInventory,
    lowStockThreshold: p.lowStockThreshold,
    allowBackorder: p.allowBackorder ?? false,
    subscriptionInterval: p.subscriptionInterval,
    subscriptionIntervalCount: p.subscriptionIntervalCount,
    trialDays: p.trialDays,
    bundlePriceMode: p.bundlePriceMode,
    bundleItems: p.bundleItems,
    digitalAssetId: p.digitalAssetId,
    serviceDuration: p.serviceDuration,
    serviceCapacity: p.serviceCapacity,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
  };
}

// ── Editor state ──────────────────────────────────────────────────────────────

interface EditorLoadState {
  readonly loading: boolean;
  readonly error: string | null;
  readonly product: AtlasProduct | null;
  readonly variants: ReadonlyArray<AtlasVariant>;
  readonly options: ReadonlyArray<AtlasProductOption>;
  readonly customFields: ReadonlyArray<AtlasProductCustomField>;
  readonly digitalAsset: AtlasDigitalAsset | null;
  readonly images: ReadonlyArray<ProductImageRow>;
  readonly categoryIds: ReadonlyArray<string>;
}

// ── Main Props ─────────────────────────────────────────────────────────────────

export interface ProductEditorAtlasProps {
  /** Product ID to load. Pass "new" to enter create mode. */
  readonly productId: string;
  /** Subdomain slug (passed from route params for back-links). */
  readonly subdomain: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ProductEditorAtlas({ productId, subdomain }: ProductEditorAtlasProps) {
  const [isNew, setIsNew] = React.useState(productId === "new");
  const [effectiveProductId, setEffectiveProductId] = React.useState(productId);

  // ── Load state ──────────────────────────────────────────────────────────────
  const [state, setState] = React.useState<EditorLoadState>({
    loading: productId !== "new",
    error: null,
    product: productId === "new" ? EMPTY_PRODUCT : null,
    variants: [],
    options: [],
    customFields: [],
    digitalAsset: null,
    images: [],
    categoryIds: [],
  });

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState<TabLabel>("Detail");
  const [isDirty, setIsDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<string>("");
  const [viewMode, setViewMode] = React.useState<VariantsViewMode>("list");
  const [matrixShowing, setMatrixShowing] = React.useState<"stock" | "price" | "pace" | "cost">("stock");

  // ── Categories (loaded from /api/cms/shop/collections) ─────────────────────
  const [categories, setCategories] = React.useState<ReadonlyArray<EditorCategory>>([]);

  // ── Discount codes state ─────────────────────────────────────────────────────
  const [discountCodes, setDiscountCodes] = React.useState<ReadonlyArray<AtlasDiscountCode>>([]);
  const [discountsLoading, setDiscountsLoading] = React.useState(false);

  // ── Pricing tiers + sale schedules state ─────────────────────────────────────
  const [pricingTiers, setPricingTiers] = React.useState<ReadonlyArray<AtlasPricingTier>>([]);
  const [memberPricing, setMemberPricing] = React.useState<ReadonlyArray<AtlasMemberPricing>>([]);
  const [saleSchedules, setSaleSchedules] = React.useState<ReadonlyArray<SaleScheduleApiRow>>([]);
  const [pricingLoading, setPricingLoading] = React.useState(false);
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  const pricingFetchedRef = React.useRef(false);

  // ── Stripe sync state ────────────────────────────────────────────────────────
  const [syncingStripe, setSyncingStripe] = React.useState(false);
  const [globalCustomFields, setGlobalCustomFields] = React.useState<ReadonlyArray<AtlasCustomField>>([]);
  const [mediaLibrary, setMediaLibrary] = React.useState<ReadonlyArray<{ id: string; name: string; url: string }>>([]);

  // Mirror the latest variants into a ref so the save path always reads the
  // current grid state, immune to any stale-closure timing in handleSave.
  const variantsRef = React.useRef<ReadonlyArray<AtlasVariant>>(state.variants);
  variantsRef.current = state.variants;

  // ── Fetch product on mount / when id changes ─────────────────────────────────
  React.useEffect(() => {
    if (isNew) return;

    let cancelled = false;
    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch(
          `/api/cms/products/${effectiveProductId}?includeVariants=true&includeOptions=true&includeImages=true&includeCategories=true&includeDigitalAsset=true`,
          { credentials: "same-origin" }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        const product = mapApiProduct(data);

        const variants: AtlasVariant[] = (data.variants ?? []).map(
          (v: Record<string, unknown>) => ({
            id: String(v.id ?? ""),
            sku: v.sku != null ? String(v.sku) : null,
            price: Number(v.price ?? 0),
            costPrice: v.costPrice != null ? Number(v.costPrice) : null,
            stock: Number(v.stock ?? 0),
            enabled: (v.enabled ?? true) !== false,
            weight: v.weight != null ? Number(v.weight) : null,
            imageId:
              (v.imageId as string | null | undefined) ??
              ((v.image as Record<string, unknown> | undefined)?.id as string | undefined) ??
              null,
            optionValues: Object.fromEntries(
              ((v.optionValues as Array<Record<string, unknown>>) ?? []).map(
                (ov: Record<string, unknown>) => {
                  const optVal = ov.optionValue as Record<string, unknown>;
                  const optionId = optVal?.optionId ?? "";
                  return [
                    optVal?.value ?? "",
                    {
                      optionId,
                      valueId: optVal?.id ?? "",
                      value: String(optVal?.value ?? ""),
                    },
                  ];
                }
              )
            ),
            customFields: {},
          } satisfies AtlasVariant)
        );

        const options: AtlasProductOption[] = (data.options ?? []).map(
          (o: Record<string, unknown>) => ({
            id: String(o.id),
            name: String(o.name),
            position: Number(o.position),
            values: ((o.values as Array<Record<string, unknown>>) ?? []).map((val) => ({
              id: String(val.id),
              value: String(val.value),
              position: Number(val.position),
            })),
          })
        );

        const images: ProductImageRow[] = (data.images ?? []).map(
          (img: Record<string, unknown>) => ({
            id: String(img.id),
            position: Number(img.position ?? 0),
            alt: (img.alt as string | null) ?? null,
            media: {
              id: String((img.media as Record<string, unknown> | undefined)?.id ?? ""),
              url: String((img.media as Record<string, unknown> | undefined)?.url ?? ""),
              alt: (img.media as Record<string, unknown> | undefined)?.alt as string | null | undefined,
            },
          })
        );

        const categoryIds: string[] = ((data.categories ?? []) as Array<Record<string, unknown>>)
          .map((row) => {
            const cat = row.category as Record<string, unknown> | undefined;
            return cat ? String(cat.id ?? "") : String(row.categoryId ?? "");
          })
          .filter(Boolean);

        setState({
          loading: false,
          error: null,
          product,
          variants,
          options,
          customFields: [],
          digitalAsset: data.digitalAsset ?? null,
          images,
          categoryIds,
        });
        setSavedAt("Loaded");
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load product",
        }));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [effectiveProductId, isNew]);

  // ── Custom fields: load attached (assignedFields) + global library (availableFields) ──
  // The API returns { assignedFields: [...flattened CustomField + position + enabled],
  // availableFields: CustomField[] }. The join (ProductCustomField) has no own id and
  // no required/showInGrid — required lives on the global field; we map `enabled`→showInGrid.
  const mapApiCustomField = React.useCallback((f: Record<string, unknown>): AtlasCustomField => ({
    id: String(f.id ?? ""),
    name: String(f.name ?? ""),
    slug: String(f.slug ?? ""),
    type: (f.type as AtlasCustomField["type"]) ?? "TEXT",
    options: f.options ?? null,
    defaultValue: f.defaultValue ?? null,
    required: !!f.required,
    showInGrid: (f.enabled as boolean | undefined) !== false,
  }), []);

  const reloadCustomFields = React.useCallback(async () => {
    if (isNew || !effectiveProductId || effectiveProductId === "new") return;
    try {
      const res = await fetch(`/api/cms/products/${effectiveProductId}/custom-fields`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      const assigned = ((data.assignedFields ?? []) as Array<Record<string, unknown>>).map((f) => ({
        id: String(f.id ?? ""),
        productId: effectiveProductId,
        customFieldId: String(f.id ?? ""),
        required: !!f.required,
        showInGrid: (f.enabled as boolean | undefined) !== false,
        position: Number(f.position ?? 0),
        customField: mapApiCustomField(f),
      } satisfies AtlasProductCustomField));
      const available = ((data.availableFields ?? []) as Array<Record<string, unknown>>).map(mapApiCustomField);
      setState((prev) => ({ ...prev, customFields: assigned }));
      setGlobalCustomFields(available);
    } catch {
      // non-critical
    }
  }, [effectiveProductId, isNew, mapApiCustomField]);

  React.useEffect(() => {
    if (isNew || !state.product?.id) return;
    void reloadCustomFields();
  }, [reloadCustomFields, isNew, state.product?.id]);

  // ── Load media library (for the Media tab's bulk variant-image assign, F3) ──────
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/cms/media?type=image&limit=100", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const items = ((data.media ?? data.items ?? data.data ?? []) as Array<Record<string, unknown>>).map((m) => ({
          id: String(m.id ?? ""),
          name: String(m.title ?? m.originalName ?? m.filename ?? m.id ?? ""),
          url: String(m.url ?? ""),
        })).filter((m) => m.id);
        setMediaLibrary(items);
      } catch {
        /* non-critical */
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [effectiveProductId]);

  // ── Load categories ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/cms/shop/collections", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const rows: EditorCategory[] = ((data.collections ?? []) as Array<Record<string, unknown>>).map(
          (c) => ({
            id: String(c.id ?? ""),
            name: String(c.title ?? c.name ?? ""),
            slug: String(c.handle ?? c.slug ?? ""),
          })
        );
        setCategories(rows);
      } catch {
        // non-critical
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Discount codes (lazy, fires on Pricing tab) ─────────────────────────────
  React.useEffect(() => {
    if (activeTab !== "Pricing" || discountsLoading || discountCodes.length > 0) return;
    let cancelled = false;
    setDiscountsLoading(true);
    const fetchDiscounts = async () => {
      try {
        const res = await fetch("/api/cms/discounts?limit=50&status=active", {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { discounts?: DiscountApiRow[] };
        if (cancelled) return;
        const mapped: ReadonlyArray<AtlasDiscountCode> = (data.discounts ?? []).map(
          (d): AtlasDiscountCode => ({
            id: d.id,
            code: d.code,
            type: d.type,
            value: d.value,
            usageCount: d.usageCount,
            description: d.description,
            stackable: false,
          })
        );
        setDiscountCodes(mapped);
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setDiscountsLoading(false);
      }
    };
    void fetchDiscounts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Pricing tiers + sale schedules (lazy, fires on Pricing tab) ─────────────
  React.useEffect(() => {
    if (activeTab !== "Pricing" || isNew || !state.product?.id) return;
    if (pricingFetchedRef.current) return;
    let cancelled = false;
    pricingFetchedRef.current = true;
    setPricingLoading(true);
    setPricingError(null);

    const fetchPricing = async () => {
      try {
        const [tiersRes, schedulesRes] = await Promise.all([
          fetch(`/api/cms/products/${effectiveProductId}/pricing-tiers`, {
            credentials: "same-origin",
          }),
          fetch(`/api/cms/products/${effectiveProductId}/sale-schedules`, {
            credentials: "same-origin",
          }),
        ]);
        if (cancelled) return;

        if (!tiersRes.ok) {
          const body = await tiersRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Tiers fetch: HTTP ${tiersRes.status}`);
        }
        if (!schedulesRes.ok) {
          const body = await schedulesRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Schedules fetch: HTTP ${schedulesRes.status}`);
        }

        const tiersData = (await tiersRes.json()) as { data?: PricingTierApiRow[] };
        const schedulesData = (await schedulesRes.json()) as { data?: SaleScheduleApiRow[] };
        if (cancelled) return;

        const allTiers: ReadonlyArray<PricingTierApiRow> = tiersData.data ?? [];
        const basePrice = state.product?.basePrice ?? 0;

        const qtyTiers: AtlasPricingTier[] = allTiers
          .filter((t) => t.type === "QTY")
          .map((t) => ({
            id: t.id,
            minQty: t.minQty,
            maxQty: t.maxQty ?? null,
            price: t.price,
            requiresTag: t.label || null,
          }));

        const memberTiers: AtlasMemberPricing[] = allTiers
          .filter((t) => t.type === "MEMBER")
          .map((t) => {
            const discountPercent =
              basePrice > 0 ? Math.round(((basePrice - t.price) / basePrice) * 100) : 0;
            return {
              id: t.id,
              tierName: t.label,
              description: `${formatCentsStatic(t.price)} per unit`,
              memberCount: 0,
              discountPercent: Math.max(0, discountPercent),
              memberPrice: t.price,
              enabled: t.enabled,
            };
          });

        setPricingTiers(qtyTiers);
        setMemberPricing(memberTiers);
        setSaleSchedules(schedulesData.data ?? []);
      } catch (err) {
        if (cancelled) return;
        pricingFetchedRef.current = false;
        setPricingError(err instanceof Error ? err.message : "Failed to load pricing data");
      } finally {
        if (!cancelled) setPricingLoading(false);
      }
    };

    void fetchPricing();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, effectiveProductId, isNew, state.product?.id]);

  // ── Patch helper for product state ───────────────────────────────────────────
  const patchProduct = React.useCallback((patch: Partial<AtlasProduct>) => {
    setState((prev) => ({
      ...prev,
      product: prev.product ? { ...prev.product, ...patch } : prev.product,
    }));
    setIsDirty(true);
  }, []);

  // ── Variant persistence ───────────────────────────────────────────────────────
  // The Atlas grid edits variants in local state; this writes them through to the
  // bulk-update endpoint. Scalar fields only — option-value joins are left intact
  // (we don't send optionValues, so the route's delete+recreate guard never fires).
  const persistVariants = React.useCallback(
    async (productId: string, variants: ReadonlyArray<AtlasVariant>) => {
      if (variants.length === 0) return;
      const payloadVariants = variants.map((v) => ({
        id: v.id,
        sku: v.sku ?? undefined,
        price: Math.round(Number(v.price) || 0),
        costPrice: v.costPrice != null ? Math.round(Number(v.costPrice)) : undefined,
        stock: Math.round(Number(v.stock) || 0),
        weight: v.weight != null ? Math.round(Number(v.weight)) : undefined,
        enabled: v.enabled,
        imageId: v.imageId ?? undefined,
      }));
      const res = await fetch(`/api/cms/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ variants: payloadVariants }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? `Variant save failed (HTTP ${res.status})`
        );
      }
    },
    []
  );

  // ── Save handler — POST on create, PUT on edit ───────────────────────────────
  const handleSave = React.useCallback(async () => {
    if (!state.product) return;
    if (saving) return;
    if (!state.product.title.trim()) {
      setSaveError("Title is required.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const slug = state.product.slug?.trim() || slugify(state.product.title);
    const payload: Record<string, unknown> = {
      ...buildSavePayload(state.product),
      slug,
      categoryIds: state.categoryIds,
    };

    try {
      if (isNew) {
        const res = await fetch("/api/cms/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const created = await res.json();
        const newId = String(created.id ?? "");
        const product = mapApiProduct(created);

        setState((prev) => ({
          ...prev,
          product,
          images: ((created.images ?? []) as Array<Record<string, unknown>>).map((img) => ({
            id: String(img.id),
            position: Number(img.position ?? 0),
            alt: (img.alt as string | null) ?? null,
            media: {
              id: String((img.media as Record<string, unknown> | undefined)?.id ?? ""),
              url: String((img.media as Record<string, unknown> | undefined)?.url ?? ""),
              alt: (img.media as Record<string, unknown> | undefined)?.alt as string | null | undefined,
            },
          })),
        }));

        setIsNew(false);
        setEffectiveProductId(newId);
        setIsDirty(false);
        setSavedAt(`Created · ${new Date().toLocaleTimeString()}`);
        // Rewrite URL without navigation so reload lands on the edit route.
        if (typeof window !== "undefined" && newId) {
          window.history.replaceState({}, "", `/admin/products/${newId}`);
        }
      } else {
        const res = await fetch(`/api/cms/products/${effectiveProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const updated = await res.json();
        const product = mapApiProduct(updated);
        // Persist variant edits (price/cost/stock/weight/sku) made in the grid.
        // Read from the ref to avoid any stale-closure capture of state.variants.
        await persistVariants(effectiveProductId, variantsRef.current);
        setState((prev) => ({ ...prev, product }));
        setIsDirty(false);
        setSavedAt(`Saved · ${new Date().toLocaleTimeString()}`);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }, [state.product, state.categoryIds, state.variants, isNew, effectiveProductId, saving, persistVariants]);

  // ── Stripe sync handler ──────────────────────────────────────────────────────
  const handleStripeSync = React.useCallback(async () => {
    if (!state.product?.id || isNew) {
      setSaveError("Save the product before syncing to Stripe.");
      return;
    }
    setSyncingStripe(true);
    try {
      const res = await fetch(`/api/cms/products/${effectiveProductId}/sync-stripe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ syncVariants: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const result = await res.json();
      setState((prev) => ({
        ...prev,
        product: prev.product
          ? {
              ...prev.product,
              stripeProductId: (result.stripeProductId as string | null) ?? null,
              stripePriceId: (result.stripePriceId as string | null) ?? null,
              stripeSyncedAt: (result.stripeSyncedAt as string | null) ?? null,
              stripeSyncError: null,
            }
          : prev.product,
      }));
      setSavedAt(`Stripe synced · ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        product: prev.product
          ? {
              ...prev.product,
              stripeSyncError: err instanceof Error ? err.message : "Sync failed",
            }
          : prev.product,
      }));
    } finally {
      setSyncingStripe(false);
    }
  }, [effectiveProductId, isNew, state.product?.id]);

  // ── Cell change handler (variant grid) ───────────────────────────────────────
  const handleCellChange = React.useCallback(
    (rowIndex: number, colId: string, value: unknown) => {
      setState((prev) => {
        const updated = prev.variants.map((v, i) =>
          i === rowIndex ? { ...v, [colId]: value } : v
        );
        return { ...prev, variants: updated };
      });
      setIsDirty(true);
    },
    []
  );

  // ── Type change handler ──────────────────────────────────────────────────────
  const handleTypeChange = React.useCallback((type: ProductTypeKind) => {
    patchProduct({ type });
    setActiveTab("Detail");
  }, [patchProduct]);

  // ── Custom field handlers (design F5) ─────────────────────────────────────────
  const handleCreateCustomField = React.useCallback(
    async (field: { name: string; type: string; slug: string; description: string; options: ReadonlyArray<{ label: string; slug: string }>; defaultValue: string; required: boolean }) => {
      if (isNew || !effectiveProductId) {
        setSaveError("Save the product before adding custom fields.");
        return;
      }
      try {
        // 1. Create the global field.
        const createRes = await fetch(`/api/cms/custom-fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            name: field.name,
            slug: field.slug || undefined,
            description: field.description || undefined,
            type: field.type,
            options: field.options.length
              ? field.options.map((o) => ({ value: o.slug || o.label, label: o.label }))
              : undefined,
            defaultValue: field.defaultValue || undefined,
            required: field.required,
          }),
        });
        if (!createRes.ok) throw new Error(`Create field failed (HTTP ${createRes.status})`);
        const created = await createRes.json();
        const newId = String(created.id ?? created.field?.id ?? "");
        // 2. Attach it to this product.
        if (newId) {
          await fetch(`/api/cms/products/${effectiveProductId}/custom-fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ fieldIds: [newId] }),
          });
        }
        await reloadCustomFields();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to create custom field");
      }
    },
    [effectiveProductId, isNew, reloadCustomFields]
  );

  const handleAttachCustomField = React.useCallback(
    async (fieldId: string) => {
      if (isNew || !effectiveProductId) return;
      try {
        await fetch(`/api/cms/products/${effectiveProductId}/custom-fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ fieldIds: [fieldId] }),
        });
        await reloadCustomFields();
      } catch {
        /* non-critical */
      }
    },
    [effectiveProductId, isNew, reloadCustomFields]
  );

  const handleDetachCustomField = React.useCallback(
    async (customFieldId: string) => {
      if (isNew || !effectiveProductId) return;
      try {
        await fetch(
          `/api/cms/products/${effectiveProductId}/custom-fields?fieldIds=${encodeURIComponent(customFieldId)}&removeValues=true`,
          { method: "DELETE", credentials: "same-origin" }
        );
        await reloadCustomFields();
      } catch {
        /* non-critical */
      }
    },
    [effectiveProductId, isNew, reloadCustomFields]
  );

  // "Show in grid" maps to the join's `enabled` flag (no showInGrid column exists).
  const handleToggleFieldGrid = React.useCallback(
    async (customFieldId: string, showInGrid: boolean) => {
      if (isNew || !effectiveProductId) return;
      try {
        await fetch(`/api/cms/products/${effectiveProductId}/custom-fields`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ fieldId: customFieldId, enabled: showInGrid }),
        });
        await reloadCustomFields();
      } catch {
        /* non-critical */
      }
    },
    [effectiveProductId, isNew, reloadCustomFields]
  );

  // "Required" lives on the global CustomField definition.
  const handleToggleFieldRequired = React.useCallback(
    async (customFieldId: string, required: boolean) => {
      try {
        await fetch(`/api/cms/custom-fields/${customFieldId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ required }),
        });
        await reloadCustomFields();
      } catch {
        /* non-critical */
      }
    },
    [reloadCustomFields]
  );

  // ── Category selection handler ───────────────────────────────────────────────
  const handleCategoriesChange = React.useCallback((ids: ReadonlyArray<string>) => {
    setState((prev) => ({ ...prev, categoryIds: ids }));
    setIsDirty(true);
  }, []);

  // ── Media handlers ───────────────────────────────────────────────────────────
  const refetchProduct = React.useCallback(async () => {
    if (isNew || !effectiveProductId) return;
    try {
      const res = await fetch(
        `/api/cms/products/${effectiveProductId}?includeImages=true`,
        { credentials: "same-origin" }
      );
      if (!res.ok) return;
      const data = await res.json();
      const images: ProductImageRow[] = ((data.images ?? []) as Array<Record<string, unknown>>).map(
        (img) => ({
          id: String(img.id),
          position: Number(img.position ?? 0),
          alt: (img.alt as string | null) ?? null,
          media: {
            id: String((img.media as Record<string, unknown> | undefined)?.id ?? ""),
            url: String((img.media as Record<string, unknown> | undefined)?.url ?? ""),
            alt: (img.media as Record<string, unknown> | undefined)?.alt as string | null | undefined,
          },
        })
      );
      setState((prev) => ({ ...prev, images }));
    } catch {
      // non-critical
    }
  }, [effectiveProductId, isNew]);

  const handleAddImage = React.useCallback(async () => {
    if (isNew || !effectiveProductId) {
      setSaveError("Save the product before adding images.");
      return;
    }
    if (typeof window === "undefined") return;
    const url = window.prompt("Paste an image URL to attach to this product:");
    if (!url) return;
    try {
      // Two-step: create a Media row via POST /api/cms/media/url-import-style, then attach.
      // Many tenants use a remote URL importer; fall back to a direct ProductImage upsert
      // through the product PUT shape by passing `images` if the API supports it.
      // Since the current cms/products API doesn't expose image CRUD directly, we surface
      // a clear "manage in Media library" affordance and rely on the Media tab UX. For now
      // we ask the user to upload via the standalone Media library and paste a media ID.
      const mediaId = window.prompt(
        "Paste the Media library ID for this image (upload via Media first, then copy its ID):"
      );
      if (!mediaId) return;
      // Optimistic add: append to images list locally and let the next save persist.
      // The persistence path lives in /api/cms/products/[id]/images (if absent, the editor
      // surfaces the failure inline rather than silently swallowing).
      const res = await fetch(`/api/cms/products/${effectiveProductId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ mediaId, alt: null, url }),
      });
      if (!res.ok) {
        // Endpoint may not be wired in every deploy — degrade gracefully.
        setSaveError(
          "Image upload endpoint is not available in this deploy. Use the Media library and connect images via the database for now."
        );
        return;
      }
      await refetchProduct();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to add image");
    }
  }, [effectiveProductId, isNew, refetchProduct]);

  const handleRemoveImage = React.useCallback(
    async (imageId: string) => {
      if (isNew || !effectiveProductId) return;
      // Optimistic local removal.
      setState((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }));
      try {
        const res = await fetch(
          `/api/cms/products/${effectiveProductId}/images/${imageId}`,
          {
            method: "DELETE",
            credentials: "same-origin",
          }
        );
        if (!res.ok) {
          // Revert.
          await refetchProduct();
          setSaveError("Failed to remove image.");
        }
      } catch {
        await refetchProduct();
      }
    },
    [effectiveProductId, isNew, refetchProduct]
  );

  const handleUpdateAlt = React.useCallback((imageId: string, alt: string) => {
    // Update locally and mark dirty; persistence on save (alt is metadata on ProductImage).
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === imageId ? { ...img, alt } : img)),
    }));
    setIsDirty(true);
  }, []);

  const handleReorderImage = React.useCallback(
    (imageId: string, direction: -1 | 1) => {
      setState((prev) => {
        const ordered = [...prev.images];
        const idx = ordered.findIndex((img) => img.id === imageId);
        if (idx === -1) return prev;
        const target = idx + direction;
        if (target < 0 || target >= ordered.length) return prev;
        const tmp = ordered[idx];
        ordered[idx] = ordered[target];
        ordered[target] = tmp;
        // Re-sequence positions.
        return {
          ...prev,
          images: ordered.map((img, i) => ({ ...img, position: i })),
        };
      });
      setIsDirty(true);
    },
    []
  );

  // ── Pricing tier CRUD ────────────────────────────────────────────────────────
  const handleCreateTier = React.useCallback(
    async (payload: CreateTierPayload) => {
      const body: CreateTierPayload = { ...payload, maxQty: payload.maxQty ?? null };
      const res = await fetch(`/api/cms/products/${effectiveProductId}/pricing-tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { data?: PricingTierApiRow };
      const created = data.data;
      if (!created) return;
      const basePrice = state.product?.basePrice ?? 0;
      if (created.type === "QTY") {
        setPricingTiers((prev) => [
          ...prev,
          {
            id: created.id,
            minQty: created.minQty,
            maxQty: created.maxQty ?? null,
            price: created.price,
            requiresTag: created.label || null,
          },
        ]);
      } else {
        const discountPercent =
          basePrice > 0
            ? Math.max(0, Math.round(((basePrice - created.price) / basePrice) * 100))
            : 0;
        setMemberPricing((prev) => [
          ...prev,
          {
            id: created.id,
            tierName: created.label,
            description: `${formatCentsStatic(created.price)} per unit`,
            memberCount: 0,
            discountPercent,
            memberPrice: created.price,
            enabled: created.enabled,
          },
        ]);
      }
    },
    [effectiveProductId, state.product?.basePrice]
  );

  const handleDeleteTier = React.useCallback(
    async (tierId: string) => {
      setPricingTiers((prev) => prev.filter((t) => t.id !== tierId));
      setMemberPricing((prev) => prev.filter((m) => m.id !== tierId));
      const res = await fetch(`/api/cms/products/${effectiveProductId}/pricing-tiers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tierId }),
      });
      if (!res.ok) {
        pricingFetchedRef.current = false;
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
    },
    [effectiveProductId]
  );

  const handleCreateSchedule = React.useCallback(
    async (payload: CreateSchedulePayload) => {
      const res = await fetch(`/api/cms/products/${effectiveProductId}/sale-schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { data?: SaleScheduleApiRow };
      const created = data.data;
      if (!created) return;
      setSaleSchedules((prev) => [...prev, created]);
    },
    [effectiveProductId]
  );

  const handleDeleteSchedule = React.useCallback(
    async (scheduleId: string) => {
      setSaleSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      const res = await fetch(`/api/cms/products/${effectiveProductId}/sale-schedules`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ scheduleId }),
      });
      if (!res.ok) {
        pricingFetchedRef.current = false;
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
    },
    [effectiveProductId]
  );

  // ── Bundle items (BUNDLE only) ───────────────────────────────────────────────
  const bundleItems: ReadonlyArray<AtlasBundleItem> = React.useMemo(() => {
    const raw = state.product?.bundleItems;
    if (!Array.isArray(raw)) return [];
    return (raw as ReadonlyArray<BundleItemRaw>).map((b) => ({
      productId: String(b.productId ?? ""),
      productTitle: String(b.productTitle ?? "Untitled"),
      variantId: b.variantId ?? null,
      variantLabel: String(b.variantLabel ?? "Default"),
      productType: (b.productType ?? "SIMPLE") as ProductTypeKind,
      price: Number(b.price ?? 0),
      quantity: Number(b.quantity ?? 1),
      stock: b.stock ?? null,
      hex: String(b.hex ?? "#808080"),
    }));
  }, [state.product?.bundleItems]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const variantCount = state.variants.length;
  const customFieldCount = state.customFields.length;
  const variantStockSummary = React.useMemo(() => {
    if (state.variants.length === 0) return null;
    return {
      variants: state.variants.length,
      totalStock: state.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0),
    };
  }, [state.variants]);

  const gridColumns = React.useMemo(
    () => buildGridColumns(state.options, state.customFields),
    [state.options, state.customFields]
  );
  const gridRows = React.useMemo(() => buildGridRows(state.variants), [state.variants]);

  // ── Matrix (crosstab) data + bulk edit ────────────────────────────────────────
  const matrixData = React.useMemo(
    () => buildMatrixData(state.options, state.variants),
    [state.options, state.variants]
  );

  const mediaData = React.useMemo(
    () => buildMediaData(state.options, state.variants, mediaLibrary),
    [state.options, state.variants, mediaLibrary]
  );

  // F3 — assign a library image as the cover (variant.imageId) to target variants, persist now.
  const handleAssignMedia = React.useCallback(
    async (mediaIds: ReadonlyArray<string>, variantIds: ReadonlyArray<string>) => {
      const mediaId = mediaIds[0];
      if (!mediaId || variantIds.length === 0 || isNew) return;
      const idSet = new Set(variantIds);
      // Optimistic local update.
      setState((prev) => ({
        ...prev,
        variants: prev.variants.map((v) => (idSet.has(v.id) ? { ...v, imageId: mediaId } : v)),
      }));
      try {
        await fetch(`/api/cms/products/${effectiveProductId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            variants: variantIds.map((id) => {
              const v = state.variants.find((x) => x.id === id);
              return { id, price: Math.round(Number(v?.price) || 0), imageId: mediaId };
            }),
          }),
        });
        setSavedAt(`Assigned image · ${new Date().toLocaleTimeString()}`);
      } catch {
        setSaveError("Failed to assign image to variants");
      }
    },
    [effectiveProductId, isNew, state.variants]
  );

  const handleMatrixBulkEdit = React.useCallback(
    (keys: ReadonlyArray<{ rowKey: string; colKey: string }>, value: number) => {
      // Map (rowKey,colKey) → variantId via the matrix cells, then set stock.
      const cellIndex = new Map<string, string>();
      for (const cell of matrixData.cells) {
        cellIndex.set(`${cell.rowKey}|${cell.colKey}`, cell.variantId);
      }
      const targetIds = new Set<string>();
      for (const k of keys) {
        const id = cellIndex.get(`${k.rowKey}|${k.colKey}`);
        if (id) targetIds.add(id);
      }
      if (targetIds.size === 0) return;
      setState((prev) => ({
        ...prev,
        variants: prev.variants.map((v) =>
          targetIds.has(v.id) ? { ...v, stock: value } : v
        ),
      }));
      setIsDirty(true);
    },
    [matrixData.cells]
  );

  // ── Spreadsheet bulk edits (price/stock across selected rows) ──────────────────
  const handleBulkSetPrice = React.useCallback(
    (rowIndexes: ReadonlyArray<number>, price: number) => {
      const idxSet = new Set(rowIndexes);
      setState((prev) => ({
        ...prev,
        variants: prev.variants.map((v, i) => (idxSet.has(i) ? { ...v, price } : v)),
      }));
      setIsDirty(true);
    },
    []
  );

  const handleBulkSetStock = React.useCallback(
    (rowIndexes: ReadonlyArray<number>, stock: number) => {
      const idxSet = new Set(rowIndexes);
      setState((prev) => ({
        ...prev,
        variants: prev.variants.map((v, i) => (idxSet.has(i) ? { ...v, stock } : v)),
      }));
      setIsDirty(true);
    },
    []
  );

  const productType = state.product?.type ?? "SIMPLE";
  const tabs = TABS_BY_TYPE[productType].map((label) => ({
    label,
    count:
      label === "Variants" ? variantCount || null
      : label === "Files" ? (state.digitalAsset ? 1 : null)
      : label === "Media" ? (state.images.length || null)
      : label === "Contents" ? bundleItems.length || null
      : null,
  }));

  const tabLabels = tabs.map((t) => t.label);
  const safeActiveTab: TabLabel = tabLabels.includes(activeTab) ? activeTab : "Detail";

  const saleSchedule: AtlasSaleSchedule | null = React.useMemo(() => {
    const active = saleSchedules.find((s) => s.enabled);
    if (!active) return null;
    return {
      id: active.id,
      salePrice: active.salePrice,
      startDate: active.startsAt,
      endDate: active.endsAt,
      active: active.enabled,
    };
  }, [saleSchedules]);

  const pricingTierEnabled = pricingTiers.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  if (state.loading) {
    return (
      <div className="atlas">
        <div className="prod-editor-shell" style={{ paddingTop: 40, textAlign: "center" }}>
          <span className="fig">Loading product…</span>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="atlas">
        <div className="prod-editor-shell" style={{ paddingTop: 40 }}>
          <div className="sec">
            <span className="h" style={{ color: "var(--accent)" }}>Error loading product</span>
          </div>
          <p
            style={{
              color: "var(--ink-soft)",
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: 13,
            }}
          >
            {state.error}
          </p>
          <Link href={`/s/${subdomain}/admin/products`} className="btn btn-ghost">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const product = state.product ?? EMPTY_PRODUCT;
  const hasBeenSaved = !isNew && Boolean(product.id);

  return (
    <div className="atlas">
      <Crumbs
        items={[
          ["Products", `/s/${subdomain}/admin/products`],
          [isNew ? "New product" : product.title || "Untitled"],
        ]}
      />

      <CompactHead
        kicker={product.type}
        title={isNew ? product.title || "New product" : product.title || "Untitled"}
        sku={product.sku ?? undefined}
        pills={
          <>
            <span
              className={
                "pill " +
                (product.status === "ACTIVE" ? "pill-solid-accent" : "pill-out")
              }
            >
              {product.status}
            </span>
            {product.featured && (
              <span className="pill pill-solid-accent" style={{ fontSize: 11 }}>
                Featured
              </span>
            )}
            {product.stripeProductId && (
              <span className="pill pill-out" style={{ fontSize: 11 }}>
                Stripe ✓
              </span>
            )}
            {isNew && (
              <span className="pill pill-out" style={{ fontSize: 11 }}>
                Unsaved
              </span>
            )}
          </>
        }
        stats={
          variantCount > 0
            ? `${variantCount} variants · ${customFieldCount} custom fields`
            : undefined
        }
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {hasBeenSaved && product.slug && (
              <a
                className="btn btn-ghost btn-sm"
                href={`/products/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Preview ↗
              </a>
            )}
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={() => void handleSave()}
              data-tour-id="product-form-save"
              disabled={saving || (!isDirty && !isNew)}
            >
              {saving
                ? isNew ? "Creating…" : "Saving…"
                : isNew ? "⌘S Create" : isDirty ? "⌘S Save" : "Saved"}
            </button>
          </div>
        }
      />

      {saveError && (
        <div
          role="alert"
          style={{
            margin: "0 24px",
            padding: "8px 12px",
            border: "1px solid var(--accent-2)",
            borderRadius: 4,
            color: "var(--accent-2)",
            background: "rgba(255, 0, 0, 0.04)",
            fontSize: 13,
            fontFamily: "var(--font-geist), sans-serif",
          }}
        >
          {saveError}
        </div>
      )}

      <EditorTabs
        items={tabs}
        active={safeActiveTab}
        onChange={(label) => setActiveTab(label as TabLabel)}
      />

      <div style={{ minHeight: 400 }}>
        {safeActiveTab === "Detail" && (
          <DetailTab
            product={product}
            onChange={patchProduct}
            categories={categories}
            selectedCategoryIds={state.categoryIds}
            onCategoriesChange={handleCategoriesChange}
            onAutoSlug={() => patchProduct({ slug: slugify(product.title) })}
          />
        )}

        {safeActiveTab === "Media" && (
          <>
            <MediaTab
              images={state.images}
              productId={effectiveProductId}
              canUpload={hasBeenSaved}
              onAddImage={() => void handleAddImage()}
              onRemoveImage={(id) => void handleRemoveImage(id)}
              onUpdateAlt={handleUpdateAlt}
              onReorder={handleReorderImage}
            />
            {hasBeenSaved && state.variants.length > 0 && (
              <div style={{ marginTop: 18, borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
                <MediaBulkAssign
                  library={mediaData.libraryItems}
                  variantRows={mediaData.variantRows}
                  colorGroups={mediaData.colorGroups}
                  coverage={mediaData.coverage}
                  onAssign={(mediaIds, variantIds) => void handleAssignMedia(mediaIds, variantIds)}
                  savedAt={savedAt}
                />
              </div>
            )}
          </>
        )}

        {safeActiveTab === "Variants" && (
          <>
            {!hasBeenSaved ? (
              <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
                <div className="sec">
                  <span className="h">Variants</span>
                  <span className="meta">· save the product first</span>
                </div>
                <p
                  style={{
                    color: "var(--ink-soft)",
                    fontFamily: "var(--font-geist), sans-serif",
                    fontSize: 13,
                    padding: "12px 0",
                  }}
                >
                  Variants require a saved product so option values can be attached. Save the
                  Detail tab first, then return here.
                </p>
              </div>
            ) : viewMode === "list" ? (
              <SpreadsheetGrid
                productId={product.id}
                productTitle={product.title}
                sku={product.sku ?? ""}
                rows={gridRows}
                columns={gridColumns}
                customFieldColumns={state.customFields
                  .filter((pcf) => pcf.showInGrid)
                  .map((pcf) => ({
                    id: `field_${pcf.customFieldId}`,
                    kind: "field" as const,
                    label: pcf.customField.name,
                    width: 110,
                    align: "left" as const,
                    editable: true,
                    fieldType: pcf.customField.type,
                  }))}
                breadcrumbs={[[product.title], ["Variants"]]}
                viewMode={viewMode}
                onViewChange={setViewMode}
                onCellChange={handleCellChange}
                onBulkSetPrice={handleBulkSetPrice}
                onBulkSetStock={handleBulkSetStock}
                onSave={() => void handleSave()}
                isDirty={isDirty}
                savedAt={savedAt}
              />
            ) : viewMode === "matrix" ? (
              <MatrixView
                rows={matrixData.rows}
                cols={matrixData.cols}
                cells={matrixData.cells}
                rowAxisName={matrixData.rowAxisName}
                colAxisName={matrixData.colAxisName}
                showing={matrixShowing}
                onShowingChange={setMatrixShowing}
                onCellBulkEdit={handleMatrixBulkEdit}
                onViewChange={setViewMode}
                onSave={() => void handleSave()}
                isDirty={isDirty}
                savedAt={savedAt}
              />
            ) : (
              <VariantCards
                rows={gridRows}
                options={state.options}
                fieldColumns={gridColumns.filter((c) => c.kind === "field")}
                viewMode={viewMode}
                onViewChange={setViewMode}
                onSave={() => void handleSave()}
                isDirty={isDirty}
                savedAt={savedAt}
              />
            )}
          </>
        )}

        {safeActiveTab === "Fields" && (
          !hasBeenSaved ? (
            <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
              <div className="sec">
                <span className="h">Custom fields</span>
                <span className="meta">· save the product first</span>
              </div>
              <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13, padding: "12px 0" }}>
                Save the Detail tab first, then attach custom fields here.
              </p>
            </div>
          ) : (
            <CustomFieldsBuilder
              globalFields={globalCustomFields}
              attachedFields={state.customFields}
              onCreateField={(f) => void handleCreateCustomField(f)}
              onAttach={(id) => void handleAttachCustomField(id)}
              onDetach={(id) => void handleDetachCustomField(id)}
              onToggleShowInGrid={(id, v) => void handleToggleFieldGrid(id, v)}
              onToggleRequired={(id, v) => void handleToggleFieldRequired(id, v)}
              isDirty={isDirty}
              savedAt={savedAt}
            />
          )
        )}

        {safeActiveTab === "Type" && (
          <TypeMorph
            currentType={product.type}
            productTitle={product.title}
            variantCount={variantCount}
            options={state.options}
            stripeSync={
              product.stripeSyncedAt
                ? `Synced ${new Date(product.stripeSyncedAt).toLocaleDateString()}`
                : undefined
            }
            onTypeChange={handleTypeChange}
            savedAt={savedAt}
            isDirty={isDirty}
          />
        )}

        {safeActiveTab === "Contents" && (
          <BundleComposer
            items={bundleItems}
            priceMode={(product.bundlePriceMode === "fixed" ? "fixed" : "calculated") as "fixed" | "calculated"}
            fixedPrice={product.basePrice}
            allowVariantChoice={false}
            allowSubstitutions={false}
            includeGiftWrap={false}
            onPriceModeChange={(mode) => patchProduct({ bundlePriceMode: mode })}
            onFixedPriceChange={(price) => patchProduct({ basePrice: price })}
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {safeActiveTab === "Files" && (
          <DigitalEditor
            asset={state.digitalAsset}
            delivery={{
              deliverOn: "payment",
              method: "download",
              maxDownloads: state.digitalAsset?.downloadLimit ?? 0,
              linkExpiry: state.digitalAsset?.downloadExpiry ?? 30,
              useLicenseKeys: state.digitalAsset?.useLicenseKeys ?? false,
              maxActivations: null,
            }}
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {safeActiveTab === "Pricing" && (
          <>
            <PricingExtras product={product} onChange={patchProduct} />
            <PricingStack
              basePrices={[
                {
                  label: "Base price",
                  price: product.basePrice,
                  cost: product.costPrice ?? 0,
                },
              ]}
              tierPricing={pricingTiers}
              tierEnabled={pricingTierEnabled}
              memberPricing={memberPricing}
              saleSchedule={saleSchedule}
              discountCodes={discountCodes}
              pricingLoading={pricingLoading}
              pricingError={pricingError}
              onCreateTier={handleCreateTier}
              onDeleteTier={handleDeleteTier}
              onCreateSchedule={handleCreateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onToggleTierEnabled={() => {
                // Visual toggle only — actual enablement persists with the tier row.
              }}
              onToggleMemberPricing={(id, enabled) => {
                setMemberPricing((prev) =>
                  prev.map((m) => (m.id === id ? { ...m, enabled } : m))
                );
              }}
              isDirty={isDirty}
              savedAt={savedAt}
            />
          </>
        )}

        {safeActiveTab === "Inventory" && (
          <InventoryTab
            product={product}
            onChange={patchProduct}
            variantStockSummary={variantStockSummary}
          />
        )}

        {safeActiveTab === "Channels" && (
          <ChannelsTab
            product={product}
            onChange={patchProduct}
            hasBeenSaved={hasBeenSaved}
            syncingStripe={syncingStripe}
            onSyncStripe={() => void handleStripeSync()}
          />
        )}

        {safeActiveTab === "SEO" && (
          <SeoTab product={product} onChange={patchProduct} />
        )}

        {safeActiveTab === "Schedule" && (
          <ScheduleTab product={product} onChange={patchProduct} />
        )}

        {safeActiveTab === "Billing" && (
          <BillingTab product={product} onChange={patchProduct} />
        )}
      </div>

      <SaveBar
        savedAt={savedAt || (isDirty ? "Unsaved changes" : "— autosaved —")}
        hints={[
          ["T", "switch type"],
          ["P", "pricing"],
          ["V", "variants"],
        ]}
        isDirty={isDirty}
        onSave={() => void handleSave()}
      />
    </div>
  );
}
