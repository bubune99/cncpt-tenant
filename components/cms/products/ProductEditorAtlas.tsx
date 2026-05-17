"use client";
/**
 * ProductEditorAtlas — Atlas Product Editor Frame Orchestrator
 *
 * Integrates all 9 frames (F1–F9) into a single tabbed interface.
 * Fetches product data from the API and routes tabs based on product type.
 *
 * Tab sets by type:
 *   SIMPLE       → Detail · Inventory · Pricing · Channels · SEO
 *   VARIABLE     → Detail · Variants   · Inventory · Pricing · Channels · SEO
 *   DIGITAL      → Detail · Files      · Licenses  · Delivery · Pricing · Channels · SEO
 *   SERVICE      → Detail · Schedule   · Capacity  · Pricing · Channels · SEO
 *   SUBSCRIPTION → Detail · Billing    · Lifecycle · Pricing · Channels · SEO
 *   BUNDLE       → Detail · Contents   · Pricing   · Channels · SEO
 */

import React from "react";
import Link from "next/link";
import "./atlas-product-editor.css";

import { CompactHead, EditorTabs, SaveBar, Crumbs } from "./atlas-product-ui";
import { SpreadsheetGrid } from "./SpreadsheetGrid";
import { MatrixView } from "./MatrixView";
import { TypeMorph } from "./TypeMorph";
import { CustomFieldsBuilder } from "./CustomFieldsBuilder";
import { BundleComposer } from "./BundleComposer";
import { DigitalEditor } from "./DigitalEditor";
import { PricingStack } from "./PricingStack";

import type {
  AtlasProduct,
  AtlasVariant,
  AtlasProductOption,
  AtlasProductCustomField,
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
  | "Variants"
  | "Files"
  | "Licenses"
  | "Delivery"
  | "Schedule"
  | "Capacity"
  | "Billing"
  | "Lifecycle"
  | "Contents"
  | "Inventory"
  | "Pricing"
  | "Channels"
  | "SEO"
  | "Type";

const TABS_BY_TYPE: Readonly<Record<ProductTypeKind, ReadonlyArray<TabLabel>>> = {
  SIMPLE: ["Detail", "Type", "Inventory", "Pricing", "Channels", "SEO"],
  VARIABLE: ["Detail", "Variants", "Type", "Inventory", "Pricing", "Channels", "SEO"],
  DIGITAL: ["Detail", "Files", "Licenses", "Delivery", "Type", "Pricing", "Channels", "SEO"],
  SERVICE: ["Detail", "Schedule", "Capacity", "Type", "Pricing", "Channels", "SEO"],
  SUBSCRIPTION: ["Detail", "Billing", "Lifecycle", "Type", "Pricing", "Channels", "SEO"],
  BUNDLE: ["Detail", "Contents", "Type", "Pricing", "Channels", "SEO"],
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
      pace: 0, // populated by API when available
    };

    // Flatten option values into row
    for (const optVal of Object.values(v.optionValues)) {
      row[`opt_${optVal.optionId}`] = optVal.value;
    }

    // Flatten custom field values into row
    for (const fieldVal of Object.values(v.customFields)) {
      row[`field_${fieldVal.fieldId}`] = fieldVal.value;
    }

    return row as AtlasGridRow;
  });
}

// ── Fallback placeholder tab ───────────────────────────────────────────────────

function PlaceholderTab({ label }: { readonly label: string }) {
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 24 }}>
      <div className="sec">
        <span className="h">{label}</span>
        <span className="meta">· coming soon</span>
      </div>
      <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13, padding: "12px 0" }}>
        This tab is not yet implemented in the Atlas editor.
      </p>
    </div>
  );
}

// ── API load state ─────────────────────────────────────────────────────────────

interface EditorLoadState {
  readonly loading: boolean;
  readonly error: string | null;
  readonly product: AtlasProduct | null;
  readonly variants: ReadonlyArray<AtlasVariant>;
  readonly options: ReadonlyArray<AtlasProductOption>;
  readonly customFields: ReadonlyArray<AtlasProductCustomField>;
  readonly digitalAsset: AtlasDigitalAsset | null;
}

// ── Main Props ─────────────────────────────────────────────────────────────────

export interface ProductEditorAtlasProps {
  /** Product ID to load. Pass "new" to create. */
  readonly productId: string;
  /** Subdomain slug (passed from route params for back-links). */
  readonly subdomain: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ProductEditorAtlas({ productId, subdomain }: ProductEditorAtlasProps) {
  const isNew = productId === "new";

  // ── Load state ──────────────────────────────────────────────────────────────
  const [state, setState] = React.useState<EditorLoadState>({
    loading: !isNew,
    error: null,
    product: isNew
      ? {
          id: "",
          title: "Untitled product",
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
        }
      : null,
    variants: [],
    options: [],
    customFields: [],
    digitalAsset: null,
  });

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState<TabLabel>("Detail");
  const [isDirty, setIsDirty] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string>("");
  const [viewMode, setViewMode] = React.useState<VariantsViewMode>("list");
  // filters live inside SpreadsheetGrid — no top-level state needed

  // ── Fetch product on mount ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (isNew) return;

    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch(
          `/api/cms/products/${productId}?includeVariants=true&includeOptions=true&includeDigitalAsset=true`,
          { credentials: "same-origin" }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        // Map API product to AtlasProduct shape
        const p: AtlasProduct = {
          id: data.id,
          title: data.title,
          slug: data.slug,
          description: data.description ?? null,
          type: data.type as ProductTypeKind,
          status: data.status,
          basePrice: data.basePrice,
          compareAtPrice: data.compareAtPrice ?? null,
          costPrice: data.costPrice ?? null,
          sku: data.sku ?? null,
          stock: data.stock ?? 0,
          trackInventory: data.trackInventory ?? true,
          stripeProductId: data.stripeProductId ?? null,
          stripePriceId: data.stripePriceId ?? null,
          stripeSyncedAt: data.stripeSyncedAt ?? null,
        };

        // Map variants
        const variants: AtlasVariant[] = (data.variants ?? []).map(
          (v: Record<string, unknown>) => ({
            id: v.id,
            sku: v.sku ?? null,
            price: v.price ?? 0,
            costPrice: v.costPrice ?? null,
            stock: v.stock ?? 0,
            enabled: v.enabled ?? true,
            weight: v.weight ?? null,
            optionValues: Object.fromEntries(
              ((v.optionValues as Array<Record<string, unknown>>) ?? []).map(
                (ov: Record<string, unknown>) => {
                  const optVal = ov.optionValue as Record<string, unknown>;
                  const optionId = optVal?.optionId ?? "";
                  return [
                    optVal?.value ?? "",
                    { optionId, valueId: optVal?.id ?? "", value: String(optVal?.value ?? "") },
                  ];
                }
              )
            ),
            customFields: {},
          } satisfies AtlasVariant)
        );

        // Map options
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

        setState((prev) => ({
          ...prev,
          loading: false,
          product: p,
          variants,
          options,
          customFields: prev.customFields, // custom fields loaded separately
          digitalAsset: data.digitalAsset ?? null,
        }));
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
  }, [productId, isNew]);

  // ── Also load custom fields ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (isNew || !state.product) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/cms/products/${productId}/custom-fields`, {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          customFields: (data.customFields ?? []) as ReadonlyArray<AtlasProductCustomField>,
        }));
      } catch {
        // non-critical — custom fields tab will show empty
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isNew, state.product?.id]);

  // ── Save handler ──────────────────────────────────────────────────────────────
  const handleSave = React.useCallback(async () => {
    if (!state.product || !isDirty) return;
    try {
      const res = await fetch(`/api/cms/products/${state.product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: state.product.title,
          slug: state.product.slug,
          description: state.product.description,
          type: state.product.type,
          status: state.product.status,
          basePrice: state.product.basePrice,
          compareAtPrice: state.product.compareAtPrice,
          costPrice: state.product.costPrice,
          sku: state.product.sku,
          stock: state.product.stock,
          trackInventory: state.product.trackInventory,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setIsDirty(false);
      setSavedAt(`Saved · ${new Date().toLocaleTimeString()}`);
    } catch {
      // surface to user
    }
  }, [state.product, isDirty]);

  // ── Cell change handler ────────────────────────────────────────────────────────
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

  // ── Type change handler ────────────────────────────────────────────────────────
  const handleTypeChange = React.useCallback((type: ProductTypeKind) => {
    setState((prev) => ({
      ...prev,
      product: prev.product ? { ...prev.product, type } : null,
    }));
    setIsDirty(true);
    // Reset to Detail tab when type changes
    setActiveTab("Detail");
  }, []);

  // ── Tab badge counts ─────────────────────────────────────────────────────────
  const variantCount = state.variants.length;
  const customFieldCount = state.customFields.length;

  // ── Derived grid data ─────────────────────────────────────────────────────────
  const gridColumns = React.useMemo(
    () => buildGridColumns(state.options, state.customFields),
    [state.options, state.customFields]
  );
  const gridRows = React.useMemo(
    () => buildGridRows(state.variants),
    [state.variants]
  );

  // ── (filters live inside SpreadsheetGrid — managed there) ────────────────────

  // ── Tabs list for current type ────────────────────────────────────────────────
  const productType = state.product?.type ?? "SIMPLE";
  const tabs = TABS_BY_TYPE[productType].map((label) => ({
    label,
    count:
      label === "Variants" ? variantCount || null
      : label === "Files" ? (state.digitalAsset ? 1 : null)
      : label === "Contents" ? (state.product ? variantCount || null : null)
      : null,
  }));

  // Ensure active tab exists in current type's tab list
  const tabLabels = tabs.map((t) => t.label);
  const safeActiveTab = tabLabels.includes(activeTab) ? activeTab : "Detail";

  // ── Pricing mock data (read from product or use defaults) ─────────────────────
  const pricingTiers: ReadonlyArray<AtlasPricingTier> = [];
  const memberPricing: ReadonlyArray<AtlasMemberPricing> = [];
  const discountCodes: ReadonlyArray<AtlasDiscountCode> = [];
  const saleSchedule: AtlasSaleSchedule | null = null;

  // ── Bundle items (stored in product.bundleItems as JSON) ─────────────────────
  const bundleItems: ReadonlyArray<AtlasBundleItem> = [];

  // ── Render ─────────────────────────────────────────────────────────────────────

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
          <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13 }}>
            {state.error}
          </p>
          <Link href={`/s/${subdomain}/admin/products`} className="btn btn-ghost">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const product = state.product!;

  return (
    <div className="atlas">
      {/* Breadcrumb */}
      <Crumbs
        items={[
          ["Products", `/s/${subdomain}/admin/products`],
          [product.title],
        ]}
      />

      {/* Compact masthead */}
      <CompactHead
        kicker={product.type}
        title={product.title}
        sku={product.sku ?? undefined}
        pills={
          <>
            <span className={"pill " + (product.status === "ACTIVE" ? "pill-solid-accent" : "pill-out")}>
              {product.status}
            </span>
            {product.stripeProductId && (
              <span className="pill pill-out" style={{ fontSize: 11 }}>Stripe ✓</span>
            )}
          </>
        }
        stats={
          variantCount > 0
            ? `${variantCount} variants · ${customFieldCount} custom fields`
            : undefined
        }
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => void handleSave()} disabled={!isDirty}>
            {isDirty ? "⌘S Save" : "Saved"}
          </button>
        }
      />

      {/* Tab strip */}
      <EditorTabs
        items={tabs}
        active={safeActiveTab}
        onChange={(label) => setActiveTab(label as TabLabel)}
      />

      {/* Tab content */}
      <div style={{ minHeight: 400 }}>
        {safeActiveTab === "Detail" && (
          <DetailTab
            product={product}
            onChange={(patch) => {
              setState((prev) => ({
                ...prev,
                product: prev.product ? { ...prev.product, ...patch } : null,
              }));
              setIsDirty(true);
            }}
          />
        )}

        {safeActiveTab === "Variants" && viewMode === "list" && (
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
            onSave={() => void handleSave()}
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {safeActiveTab === "Variants" && viewMode === "matrix" && (
          <MatrixView
            rows={
              (state.options.find((o) => o.name.toLowerCase().includes("color"))?.values ?? []).map((v) => ({
                id: v.id,
                label: v.value,
                code: v.value.toLowerCase().replace(/\s+/g, "-"),
                hex: undefined,
              }))
            }
            cols={
              (state.options.find((o) => o.name.toLowerCase().includes("size"))?.values ?? []).map((v) => ({
                id: v.id,
                label: v.value,
                code: v.value.toLowerCase().replace(/\s+/g, "-"),
              }))
            }
            cells={[]}
            showing="stock"
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {safeActiveTab === "Variants" && viewMode === "cards" && (
          <PlaceholderTab label="Cards view" />
        )}

        {safeActiveTab === "Type" && (
          <TypeMorph
            currentType={product.type}
            productTitle={product.title}
            variantCount={variantCount}
            options={state.options}
            stripeSync={product.stripeSyncedAt ? `Synced ${new Date(product.stripeSyncedAt).toLocaleDateString()}` : undefined}
            onTypeChange={handleTypeChange}
            savedAt={savedAt}
            isDirty={isDirty}
          />
        )}

        {safeActiveTab === "Contents" && (
          <BundleComposer
            items={bundleItems}
            priceMode="calculated"
            fixedPrice={product.basePrice}
            allowVariantChoice={false}
            allowSubstitutions={false}
            includeGiftWrap={false}
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {(safeActiveTab === "Files" || safeActiveTab === "Licenses" || safeActiveTab === "Delivery") && (
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
          <PricingStack
            basePrices={[
              {
                label: "Base price",
                price: product.basePrice,
                cost: product.costPrice ?? 0,
              },
            ]}
            tierPricing={pricingTiers}
            tierEnabled={false}
            memberPricing={memberPricing}
            saleSchedule={saleSchedule}
            discountCodes={discountCodes}
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {safeActiveTab === "Channels" && <PlaceholderTab label="Channels" />}
        {safeActiveTab === "SEO" && <PlaceholderTab label="SEO" />}
        {safeActiveTab === "Schedule" && <PlaceholderTab label="Schedule" />}
        {safeActiveTab === "Capacity" && <PlaceholderTab label="Capacity" />}
        {safeActiveTab === "Billing" && <PlaceholderTab label="Billing" />}
        {safeActiveTab === "Lifecycle" && <PlaceholderTab label="Lifecycle" />}
        {safeActiveTab === "Inventory" && <PlaceholderTab label="Inventory" />}
      </div>
    </div>
  );
}

// ── Detail tab ────────────────────────────────────────────────────────────────
// Inline — small enough to keep here; avoids another component file.

interface DetailTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
}

function DetailTab({ product, onChange }: DetailTabProps) {
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <div className="sec">
        <span className="n">§1</span>
        <span className="h">Core details</span>
        <span className="meta">· title, slug, description</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", padding: "0 0 16px" }}>
        {/* Title */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="field">
            <span className="lbl">Title</span>
            <input
              className="val"
              style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-display), Spectral, serif", fontSize: 15 }}
              value={product.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
        </div>

        {/* Slug */}
        <div>
          <div className="field">
            <span className="lbl">Slug</span>
            <input
              className="val mono"
              style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-geist-mono), monospace", fontSize: 12 }}
              value={product.slug ?? ""}
              onChange={(e) => onChange({ slug: e.target.value })}
            />
          </div>
        </div>

        {/* SKU */}
        <div>
          <div className="field">
            <span className="lbl">Base SKU</span>
            <input
              className="val mono"
              style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-geist-mono), monospace", fontSize: 12 }}
              value={product.sku ?? ""}
              onChange={(e) => onChange({ sku: e.target.value || null })}
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="field">
            <span className="lbl">Description</span>
            <textarea
              style={{ width: "100%", minHeight: 80, border: "1px solid var(--rule)", borderRadius: 4, padding: "6px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13, resize: "vertical" }}
              value={product.description ?? ""}
              onChange={(e) => onChange({ description: e.target.value || null })}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <div className="field">
            <span className="lbl">Status</span>
            <select
              style={{ border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13, cursor: "pointer" }}
              value={product.status}
              onChange={(e) =>
                onChange({
                  status: e.target.value as "DRAFT" | "ACTIVE" | "ARCHIVED",
                })
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <SaveBar
        hints={[["T", "switch type"], ["P", "pricing"], ["V", "variants"]]}
      />
    </div>
  );
}
